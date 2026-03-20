/**
 * supabase/functions/fetch-aitech/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Fetches AI/Tech news every 10 minutes (fastest section).
 * Same pipeline as fetch-world but with looser dedup threshold (0.75)
 * to avoid missing genuinely new AI developments.
 *
 * To change interval: update cron-job.org schedule (config/cron.ts documents this)
 * To change sources: edit config/sources.ts (category: 'ai-tech')
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { fetchAllRSS } from '../_shared/rss.ts';
import { extractArticle } from '../_shared/extract.ts';
import { filterDuplicates } from '../_shared/dedup.ts';
import { extractFingerprint, matchStockTickers } from '../_shared/groq.ts';
import { summarizeArticle } from '../_shared/gemini.ts';
import { SOURCES } from '../_shared/sources.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const log = logger(supabase, 'fetch-aitech');
  await log.info('Fetch-aitech started');

  try {
    const sources = SOURCES.filter(s => s.category === 'ai-tech' && s.enabled);

    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides, custom_summary_prompt')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = sources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    const allArticles = await fetchAllRSS(activeSources, supabase);
    // Take 1-2 articles per source instead of first N overall
    const bySource = activeSources.map(s =>
      allArticles.filter(a => a.source === s.name).slice(0, 2)
    );
    const articles = bySource.flat().slice(0, 5);

    for (const article of articles) {
      (article as Record<string, unknown>).fingerprint = await extractFingerprint(
        article.title, article.contentSnippet ?? '',
      );
    }

    const { data: recents } = await supabase
      .from('articles')
      .select('story_fingerprint, category')
      .eq('category', 'ai-tech')
      .gte('published_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString());

    const recentFingerprints: Record<string, string[]> = { 'ai-tech': [] };
    for (const r of (recents ?? [])) {
      if (r.story_fingerprint) recentFingerprints['ai-tech'].push(r.story_fingerprint);
    }

    const uniqueArticles = await filterDuplicates(
      articles as Parameters<typeof filterDuplicates>[0],
      recentFingerprints,
      supabase,
    );

    const { data: stockWatchlist } = await supabase
      .from('stock_watchlist')
      .select('ticker, display_name');

    let inserted = 0;

    for (const article of uniqueArticles) {
      const fullText = await extractArticle(article.link, supabase);
      const aiResult = await summarizeArticle(
        article.title,
        fullText ?? article.contentSnippet ?? '',
        prefs?.custom_summary_prompt,
      );
      if (!aiResult || aiResult.summary === null) continue;

      const stockTickers = stockWatchlist
        ? await matchStockTickers(article.title, aiResult.summary ?? '', stockWatchlist)
        : [];

      const { error } = await supabase.from('articles').insert({
        title: aiResult.final_headline ?? article.title,
        original_title: article.title,
        summary: aiResult.summary,
        full_content: aiResult.full_content_cleaned,
        full_url: article.link,
        source_name: article.source,
        source_priority: activeSources.find(s => s.name === article.source)?.priority ?? 5,
        category: 'ai-tech',
        topic_tags: aiResult.topic_tags,
        published_at: article.pubDate,
        story_fingerprint: (article as Record<string, unknown>).fingerprint as string | null,
        source_count: 1,
        is_cluster_primary: true,
        has_update: false,
        content_fetched: fullText !== null,
        clickbait_score: aiResult.clickbait_score,
        is_null_article: false,
        stock_tickers: stockTickers.length > 0 ? stockTickers : null,
      });

      if (!error) inserted++;
    }

    await log.info('Fetch-aitech completed', { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });

  } catch (err) {
    await log.error('Fetch-aitech failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
