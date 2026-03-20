/**
 * supabase/functions/fetch-world/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Lightweight RSS-only fetch for World + India + Mumbai news.
 * Triggered every 20 min by cron-job.org.
 *
 * Pipeline (no AI — stays under 30s cron limit):
 *   1. Auth check (x-cron-secret)
 *   2. Load user prefs (disabled sources, URL overrides)
 *   3. Fetch RSS feeds
 *   4. Per source: take up to 2 articles
 *   5. Extract fingerprint via Groq (fast, <0.5s each)
 *   6. Dedup against recent fingerprints
 *   7. Insert raw article to DB (ai_processed = false)
 *
 * AI processing (summarize, watchlist, stocks) is handled
 * separately by process-articles Edge Function.
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
  const log = logger(supabase, 'fetch-world');
  await log.info('Fetch-world started');

  try {
    const sources = SOURCES.filter(
      s => ['world', 'india', 'mumbai'].includes(s.category) && s.enabled
    );

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = sources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    // Step 1: Fetch RSS
    const allArticles = await fetchAllRSS(activeSources, supabase);
    const bySource = activeSources.map(s =>
      allArticles.filter(a => a.source === s.name).slice(0, 2)
    );
    const articles = bySource.flat().slice(0, 5);

    // Step 2: Fingerprint
    for (const article of articles) {
      (article as Record<string, unknown>).fingerprint = await extractFingerprint(
        article.title, article.contentSnippet ?? '',
      );
    }

    // Step 3: Dedup
    const { data: recents } = await supabase
      .from('articles')
      .select('story_fingerprint, category')
      .gte('published_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString());

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

    // Step 4: Insert raw articles (no AI)
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

    await log.info('Fetch-world completed', { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });

  } catch (err) {
    await log.error('Fetch-world failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
