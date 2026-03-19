-- ═══════════════════════════════════════════════════════════════════
-- 001_initial_schema.sql
-- Run this in Supabase → SQL Editor in one go.
-- ═══════════════════════════════════════════════════════════════════

-- Extensions
create extension if not exists vector;
create extension if not exists "uuid-ossp";

-- ── Articles ─────────────────────────────────────────────────────
create table articles (
  id                  uuid primary key default uuid_generate_v4(),
  title               text not null,
  original_title      text,
  summary             text,
  full_content        text,
  full_url            text not null unique,
  source_name         text not null,
  source_priority     int default 5,
  source_logo_url     text,
  category            text not null,
  topic_tags          text[],
  published_at        timestamptz not null,
  fetched_at          timestamptz default now(),
  last_activity_at    timestamptz default now(),
  story_fingerprint   text,
  source_count        int default 1,
  is_cluster_primary  bool default true,
  cluster_primary_id  uuid references articles(id),
  has_update          bool default false,
  embedding           vector(768),
  content_fetched     bool default false,
  clickbait_score     int default 0,
  is_null_article     bool default false,
  watchlist_matches   uuid[],
  stock_tickers       text[],
  why_this            text,
  created_at          timestamptz default now()
);

create index idx_articles_category       on articles(category);
create index idx_articles_published_at   on articles(published_at desc);
create index idx_articles_fingerprint    on articles(story_fingerprint);
create index idx_articles_last_activity  on articles(last_activity_at desc);
create index idx_articles_cluster        on articles(cluster_primary_id);
create index idx_articles_embedding      on articles
  using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- ── Story sources ─────────────────────────────────────────────────
create table story_sources (
  id           uuid primary key default uuid_generate_v4(),
  story_id     uuid not null references articles(id) on delete cascade,
  source_name  text not null,
  source_url   text not null,
  added_at     timestamptz default now()
);
create index idx_story_sources_story on story_sources(story_id);

-- ── User interactions ─────────────────────────────────────────────
-- action: 'like' | 'dislike' | 'read' | 'dismiss' | 'track'
create table user_interactions (
  id                  uuid primary key default uuid_generate_v4(),
  article_id          uuid not null references articles(id) on delete cascade,
  action              text not null,
  read_time_seconds   int,
  has_seen_update     bool default false,
  created_at          timestamptz default now()
);
create index idx_interactions_article on user_interactions(article_id);
create index idx_interactions_created on user_interactions(created_at desc);

-- ── User profile (preference vector) ─────────────────────────────
create table user_profile (
  id                    int primary key default 1,
  preference_vector     vector(768),
  total_interactions    int default 0,
  last_updated          timestamptz default now()
);
insert into user_profile (id, preference_vector, total_interactions)
values (1, array_fill(0::float, array[768])::vector(768), 0);

-- ── User watchlist ────────────────────────────────────────────────
-- type: 'topic' | 'person' | 'company'
create table user_watchlist (
  id                uuid primary key default uuid_generate_v4(),
  label             text not null,
  canonical_name    text not null,
  search_keywords   text[] not null,
  related_terms     text[],
  type              text not null default 'topic',
  pinned_story_id   uuid references articles(id),
  unread_count      int default 0,
  created_at        timestamptz default now(),
  last_checked_at   timestamptz default now()
);

-- ── Stock watchlist ───────────────────────────────────────────────
-- market: 'IN' | 'US'
create table stock_watchlist (
  id            uuid primary key default uuid_generate_v4(),
  ticker        text not null,
  display_name  text not null,
  market        text not null,
  added_at      timestamptz default now()
);

-- ── System logs (health dashboard) ───────────────────────────────
-- level: 'info' | 'warning' | 'error'
create table system_logs (
  id            uuid primary key default uuid_generate_v4(),
  timestamp     timestamptz default now(),
  level         text not null,
  source        text not null,
  message       text not null,
  context       jsonb,
  resolved      bool default false,
  auto_resolved bool default false,
  created_at    timestamptz default now()
);
create index idx_logs_level     on system_logs(level);
create index idx_logs_timestamp on system_logs(timestamp desc);
create index idx_logs_resolved  on system_logs(resolved);

-- ── User preferences ──────────────────────────────────────────────
create table user_preferences (
  id                        int primary key default 1,
  show_thumbnails           bool default false,
  disabled_sources          text[] default '{}',
  source_url_overrides      jsonb default '{}',
  section_order             text[] default array[
    'world','india','mumbai','sports','ai-tech','business','stocks','watchlist'
  ],
  custom_summary_prompt     text,
  custom_watchlist_prompt   text,
  custom_whythis_prompt     text,
  updated_at                timestamptz default now()
);
insert into user_preferences (id) values (1);

-- ── SQL Functions ─────────────────────────────────────────────────

-- Recommendation query: World News ranked by personal preference score
create or replace function get_recommended_articles(
  p_category text,
  p_limit int default 30
) returns setof articles as $$
declare
  v_pref_vector vector(768);
begin
  select preference_vector into v_pref_vector from user_profile where id = 1;
  return query
  select a.*
  from articles a
  where a.category = p_category
    and a.is_cluster_primary = true
    and a.is_null_article = false
    and a.id not in (
      select ui.article_id from user_interactions ui
      where ui.action = 'read'
        and not exists (
          select 1 from articles a2
          where a2.id = ui.article_id and a2.has_update = true
        )
    )
  order by (
    case when a.embedding is not null then
      (0.55 * (1 - (a.embedding <=> v_pref_vector)))
    else 0 end
    + (0.30 * exp(-extract(epoch from (now() - a.published_at)) / 86400.0))
    + (0.15 * (a.source_priority::float / 10.0))
  ) desc
  limit p_limit;
end;
$$ language plpgsql security definer;

-- Preference vector update (called on every like/dislike/read)
create or replace function update_preference_vector(
  p_article_embedding vector(768),
  p_weight float
) returns void as $$
begin
  update user_profile
  set
    preference_vector = l2_normalize(
      preference_vector + (p_article_embedding * p_weight)
    ),
    total_interactions = total_interactions + 1,
    last_updated = now()
  where id = 1;
end;
$$ language plpgsql security definer;

-- Increment helper
create or replace function increment(x int) returns int as $$
  select x + 1;
$$ language sql immutable;

-- ── Row Level Security ────────────────────────────────────────────
-- Enable RLS on all tables
alter table articles           enable row level security;
alter table story_sources      enable row level security;
alter table user_interactions  enable row level security;
alter table user_profile       enable row level security;
alter table user_watchlist     enable row level security;
alter table stock_watchlist    enable row level security;
alter table system_logs        enable row level security;
alter table user_preferences   enable row level security;

-- !! IMPORTANT: Run the block below AFTER your first Google login !!
-- Get your UUID: Supabase → Authentication → Users → copy your UUID
-- Replace YOUR_UUID_HERE with your actual UUID (keep the single quotes)
/*
create policy "owner_only" on articles           for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on story_sources      for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on user_interactions  for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on user_profile       for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on user_watchlist     for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on stock_watchlist    for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on system_logs        for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
create policy "owner_only" on user_preferences   for all using (auth.uid() = 'YOUR_UUID_HERE'::uuid);
*/

-- ── Auto-delete schedules ─────────────────────────────────────────
-- Articles older than 30 days (except pinned watchlist stories)
select cron.schedule(
  'delete-old-articles',
  '0 2 * * *',
  $$
    delete from articles
    where created_at < now() - interval '30 days'
    and id not in (
      select pinned_story_id from user_watchlist where pinned_story_id is not null
    );
  $$
);

-- Clean resolved logs after 7 days, all logs after 30 days
select cron.schedule(
  'delete-old-logs',
  '0 3 * * *',
  $$
    delete from system_logs
    where (created_at < now() - interval '7 days' and resolved = true and auto_resolved = true)
    or created_at < now() - interval '30 days';
  $$
);
