/**
 * supabase/functions/fetch-sports/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Lightweight RSS-only fetch for Sports (Cricket, Football, F1, Others).
 * Triggered every 20 min by cron-job.org.
 *
 * No AI calls — articles are inserted raw with ai_processed = false.
 * AI processing handled separately by process-articles function.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { fetchAllRSS } from '../_shared/rss.ts';
import { filterDuplicates } from '../_shared/dedup.ts';
import { extractFingerprint } from '../_shared/groq.ts';
import { SOURCES } from '../_shared/sources.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const log = logger(supabase, 'fetch-sports');
  await log.info('Fetch-sports started');

  try {
    const sportCategories = ['sports-cricket', 'sports-football', 'sports-f1', 'sports-other'];
    const sources = SOURCES.filter(s => sportCategories.includes(s.category) && s.enabled);

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = sources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }))
      .slice(0, 8);

    const allArticles = await fetchAllRSS(activeSources, supabase);
    const bySource = activeSources.map(s =>
      allArticles.filter(a => a.source === s.name).slice(0, 2)
    );
    const articles = bySource.flat().slice(0, 5);

    for (const article of articles) {
      (article as Record<string, unknown>).fingerprint = article.title
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .slice(0, 6)
        .join('-');
    }

    const { data: recents } = await supabase
      .from('articles')
      .select('story_fingerprint, category')
      .in('category', sportCategories)
      .gte('published_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
      .limit(200);

    const recentFingerprints: Record<string, string[]> = {};
    for (const r of (recents ?? [])) {
      if (!r.story_fingerprint) continue;
      if (!recentFingerprints[r.category]) recentFingerprints[r.category] = [];
      recentFingerprints[r.category].push(r.story_fingerprint);
    }

    const uniqueArticles = await filterDuplicates(
      articles as Parameters<typeof filterDuplicates>[0],
      recentFingerprints,
      supabase,
    );

    let inserted = 0;
    for (const article of uniqueArticles) {
      const { error } = await supabase.from('articles').insert({
        title: article.title,
        original_title: article.title,
        summary: null,
        full_content: null,
        full_url: article.link,
        source_name: article.source,
        source_priority: activeSources.find(s => s.name === article.source)?.priority ?? 5,
        category: article.category,
        topic_tags: null,
        published_at: article.pubDate,
        story_fingerprint: (article as Record<string, unknown>).fingerprint as string | null,
        source_count: 1,
        is_cluster_primary: true,
        has_update: false,
        content_fetched: false,
        clickbait_score: 0,
        is_null_article: false,
        ai_processed: false,
      });

      if (!error) inserted++;
    }

    await log.info('Fetch-sports completed', { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });

  } catch (err) {
    await log.error('Fetch-sports failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
