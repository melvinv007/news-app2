-- Football standings table
CREATE TABLE IF NOT EXISTS football_standings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  league_code text UNIQUE NOT NULL,
  league_name text NOT NULL,
  standings jsonb NOT NULL DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- Cricket matches table
CREATE TABLE IF NOT EXISTS cricket_matches (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id text UNIQUE NOT NULL,
  home_team text,
  away_team text,
  home_score text,
  away_score text,
  match_date text,
  status text,
  league text,
  updated_at timestamptz DEFAULT now()
);

-- F1 session data table
CREATE TABLE IF NOT EXISTS f1_session_data (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  session_key int UNIQUE NOT NULL,
  session_name text,
  session_type text,
  date_start text,
  date_end text,
  circuit_short_name text,
  country_name text,
  positions jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- Add theme to user_preferences
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS theme text DEFAULT 'stone-dark';

-- Add per-section article counts
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS section_article_counts jsonb DEFAULT '{
  "world": 50, "india": 50, "mumbai": 50,
  "ai-tech": 50, "business": 50,
  "sports-cricket": 50, "sports-football": 50,
  "sports-f1": 50, "sports-other": 50,
  "stocks": 50
}';

-- Add notification settings
ALTER TABLE user_preferences
ADD COLUMN IF NOT EXISTS notification_settings jsonb DEFAULT '{
  "breaking_news": false,
  "f1_race_start": false,
  "daily_digest": false,
  "watchlist_updates": false
}';

-- RLS for new tables
ALTER TABLE football_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE cricket_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE f1_session_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "owner_only" ON football_standings FOR ALL USING (true);
CREATE POLICY "owner_only" ON cricket_matches FOR ALL USING (true);
CREATE POLICY "owner_only" ON f1_session_data FOR ALL USING (true);

-- Update recommended articles to support offset
DROP FUNCTION IF EXISTS get_recommended_articles;

CREATE OR REPLACE FUNCTION get_recommended_articles(
  p_category text,
  p_limit int default 50,
  p_offset int default 0
) RETURNS SETOF articles AS $$
DECLARE
  v_pref_vector vector(768);
BEGIN
  SELECT preference_vector INTO v_pref_vector FROM user_profile WHERE id = 1;
  RETURN QUERY
  SELECT a.*
  FROM articles a
  WHERE a.category = p_category
    AND a.is_cluster_primary = true
    AND a.is_null_article = false
    AND a.ai_processed = true
    AND a.id NOT IN (
      SELECT ui.article_id FROM user_interactions ui
      WHERE ui.action = 'read'
        AND NOT EXISTS (
          SELECT 1 FROM articles a2
          WHERE a2.id = ui.article_id AND a2.has_update = true
        )
    )
  ORDER BY (
    CASE WHEN a.embedding IS NOT NULL THEN
      (0.30 * (1 - (a.embedding <=> v_pref_vector)))
    ELSE 0 END
    + (0.60 * exp(-extract(epoch FROM (now() - a.published_at)) / 86400.0))
    + (0.10 * (a.source_priority::float / 10.0))
  ) DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Cleanup articles RPC helper
CREATE OR REPLACE FUNCTION cleanup_old_articles_fn(
  p_cutoff timestamptz,
  p_keep_ids uuid[]
) RETURNS int AS $$
DECLARE
  deleted_count int;
BEGIN
  DELETE FROM articles
  WHERE created_at < p_cutoff
  AND id != ALL(p_keep_ids);
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;