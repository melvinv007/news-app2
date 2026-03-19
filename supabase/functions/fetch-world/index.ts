/**
 * supabase/functions/fetch-world/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Fetches World + India + Mumbai news every 20 minutes.
 * Triggered by cron-job.org via HTTP POST with x-cron-secret header.
 *
 * Pipeline per article:
 *   1. RSS fetch (sequential, not parallel)
 *   2. URL dedup (already seen = skip)
 *   3. Groq 8B → story fingerprint
 *   4. TF-IDF dedup → cluster update or new story
 *   5. Readability → extract full article text
 *   6. Gemini → summarize + distill + clickbait (single call)
 *   7. Groq 8B → stock ticker matching
 *   8. Keyword match → watchlist matching (Gemini confirm)
 *   9. Insert to DB (embedding added separately by process-embeddings)
 *
 * To change sources: edit config/sources.ts
 * To change interval: update cron-job.org schedule (see config/cron.ts)
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { fetchAllRSS } from '../_shared/rss.ts';
import { extractArticle } from '../_shared/extract.ts';
import { filterDuplicates } from '../_shared/dedup.ts';
import { matchWatchlistItems } from '../_shared/watchlist-match.ts';
import { extractFingerprint, matchStockTickers } from '../_shared/groq.ts';
import { summarizeArticle } from '../_shared/gemini.ts';
import { SOURCES } from '../_shared/sources.ts';

Deno.serve(async (req) => {
  // Authenticate cron trigger
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
    // Load sources for this function's categories
    const sources = SOURCES.filter(
      s => ['world', 'india', 'mumbai'].includes(s.category) && s.enabled
    );

    // Load disabled sources from user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};

    const activeSources = sources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    // Step 1: Fetch RSS feeds (sequential)
    const articles = (await fetchAllRSS(activeSources, supabase)).slice(0, 10);

    // Step 2: Extract fingerprints
    for (const article of articles) {
      (article as Record<string, unknown>).fingerprint = await extractFingerprint(
        article.title,
        article.contentSnippet ?? '',
      );
    }

    // Step 3: Deduplication — get recent fingerprints from DB
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

    // Load watchlist and stock watchlist once (outside article loop)
    const { data: watchlistItems } = await supabase
      .from('user_watchlist')
      .select('*');

    const { data: stockWatchlist } = await supabase
      .from('stock_watchlist')
      .select('ticker, display_name');

    // Load custom prompts
    const { data: prefsWithPrompts } = await supabase
      .from('user_preferences')
      .select('custom_summary_prompt, custom_watchlist_prompt')
      .single();

    let inserted = 0;

    for (const article of uniqueArticles) {
      // Step 4: Extract full article text
      const fullText = await extractArticle(article.link, supabase);

      // Step 5: AI summarization
      const aiResult = await summarizeArticle(
        article.title,
        fullText ?? article.contentSnippet ?? '',
        prefsWithPrompts?.custom_summary_prompt,
      );

      if (!aiResult || aiResult.summary === null) continue; // Pure clickbait — skip

      // Step 6: Stock ticker matching
      const stockTickers = stockWatchlist
        ? await matchStockTickers(
          article.title,
          aiResult.summary ?? '',
          stockWatchlist,
        )
        : [];

      // Step 7: Watchlist matching
      const watchlistMatches = watchlistItems
        ? await matchWatchlistItems(
          article.title,
          aiResult.summary ?? '',
          watchlistItems,
          supabase,
          prefsWithPrompts?.custom_watchlist_prompt,
        )
        : [];

      // Step 8: Insert article
      const { error } = await supabase.from('articles').insert({
        title: aiResult.final_headline ?? article.title,
        original_title: article.title,
        summary: aiResult.summary,
        full_content: aiResult.full_content_cleaned,
        full_url: article.link,
        source_name: article.source,
        source_priority: activeSources.find(s => s.name === article.source)?.priority ?? 5,
        category: article.category,
        topic_tags: aiResult.topic_tags,
        published_at: article.pubDate,
        story_fingerprint: (article as Record<string, unknown>).fingerprint as string | null,
        source_count: 1,
        is_cluster_primary: true,
        has_update: false,
        content_fetched: fullText !== null,
        clickbait_score: aiResult.clickbait_score,
        is_null_article: false,
        watchlist_matches: watchlistMatches.length > 0 ? watchlistMatches : null,
        stock_tickers: stockTickers.length > 0 ? stockTickers : null,
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
