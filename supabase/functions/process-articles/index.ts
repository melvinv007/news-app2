/**
 * supabase/functions/process-articles/index.ts
 * ─────────────────────────────────────────────────────────────────
 * AI processing for unprocessed articles.
 * Runs separately from RSS fetch to avoid 30s cron timeout.
 * Triggered every 5 min by cron-job.org.
 *
 * Pipeline per article:
 *   1. Fetch full article text (extractArticle)
 *   2. Cascade: Gemini → Groq 70B → Groq 8B
 *   3. If all fail → mark as null article
 *   4. Groq → stock ticker matching
 *   5. Keyword match + Gemini confirm → watchlist matching
 *   6. Update article in DB (ai_processed = true)
 *
 * Quota detection: if Gemini returns 429, stop the entire run early
 * and fall through to Groq for remaining articles.
 *
 * Processes up to 8 articles per invocation.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { extractArticle } from '../_shared/extract.ts';
import { summarizeArticle } from '../_shared/gemini.ts';
import { matchStockTickers, summarizeWithGroq } from '../_shared/groq.ts';
import { matchWatchlistItems } from '../_shared/watchlist-match.ts';

import type { SummarizeResult } from '../_shared/gemini.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const log = logger(supabase, 'process-articles');
  await log.info('Process-articles started');

  try {
    // Step 1: Fetch unprocessed articles
    const { data: unprocessed } = await supabase
      .from('articles')
      .select('*')
      .eq('ai_processed', false)
      .eq('is_null_article', false)
      .order('created_at', { ascending: true })
      .limit(8);

    if (!unprocessed || unprocessed.length === 0) {
      await log.info('Process-articles: no unprocessed articles');
      return new Response(JSON.stringify({ ok: true, processed: 0 }), { status: 200 });
    }

    // Step 2: Load user preferences
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('custom_summary_prompt, custom_watchlist_prompt')
      .single();

    const { data: watchlistItems } = await supabase
      .from('user_watchlist')
      .select('*');

    const { data: stockWatchlist } = await supabase
      .from('stock_watchlist')
      .select('ticker, display_name');

    const customSummaryPrompt = prefs?.custom_summary_prompt ?? null;

    let processed = 0;
    let geminiQuotaReached = false;

    // Step 3: Process each article
    for (const article of unprocessed) {
      try {
        // 3a: Extract full text
        const fullText = await extractArticle(article.full_url, supabase);
        const articleText = fullText ?? article.title;

        // 3b: Summarize — cascade: Gemini → Groq 70B → Groq 8B
        let aiResult: SummarizeResult | null = null;

        // Try Gemini first (unless quota already reached)
        if (!geminiQuotaReached) {
          try {
            aiResult = await summarizeArticle(
              article.title,
              articleText,
              customSummaryPrompt,
            );
          } catch (err) {
            if (err instanceof Error && err.message === 'QUOTA_EXCEEDED') {
              await log.info('Gemini quota reached, falling back to Groq');
              geminiQuotaReached = true;
              // Don't break — try Groq for this article
            }
            // Other errors: aiResult stays null, will fall through to Groq
          }
        }

        // Fallback to Groq 70B
        if (!aiResult) {
          aiResult = await summarizeWithGroq(
            article.title,
            articleText,
            'llama-3.3-70b-versatile',
          );
        }

        // Fallback to Groq 8B
        if (!aiResult) {
          aiResult = await summarizeWithGroq(
            article.title,
            articleText,
            'llama-3.1-8b-instant',
          );
        }

        // All models failed
        if (!aiResult || aiResult.summary === null) {
          await supabase
            .from('articles')
            .update({
              ai_processed: true,
              is_null_article: true,
              processing_error: 'all_models_failed',
            })
            .eq('id', article.id);
          processed++;
          continue;
        }

        // 3c: Stock ticker matching
        const stockTickers = stockWatchlist
          ? await matchStockTickers(
              article.title,
              aiResult.summary ?? '',
              stockWatchlist,
            )
          : [];

        // 3d: Watchlist matching
        const watchlistMatches = watchlistItems
          ? await matchWatchlistItems(
              article.title,
              aiResult.summary ?? '',
              watchlistItems,
              supabase,
              prefs?.custom_watchlist_prompt,
            )
          : [];

        // 3e: Update article with AI results
        await supabase
          .from('articles')
          .update({
            title: aiResult.final_headline ?? article.title,
            summary: aiResult.summary,
            full_content: aiResult.full_content_cleaned,
            topic_tags: aiResult.topic_tags,
            clickbait_score: aiResult.clickbait_score,
            content_fetched: fullText !== null,
            watchlist_matches: watchlistMatches.length > 0 ? watchlistMatches : null,
            stock_tickers: stockTickers.length > 0 ? stockTickers : null,
            ai_processed: true,
          })
          .eq('id', article.id);

        processed++;
      } catch (err) {
        // Mark as processed with error to avoid infinite retry
        await supabase
          .from('articles')
          .update({
            ai_processed: true,
            processing_error: String(err).slice(0, 500),
          })
          .eq('id', article.id);
        processed++;
      }
    }

    await log.info('Process-articles completed', {
      processed,
      total: unprocessed.length,
      quota_reached: geminiQuotaReached,
    });
    return new Response(
      JSON.stringify({ ok: true, processed, quota_reached: geminiQuotaReached }),
      { status: 200 },
    );

  } catch (err) {
    await log.error('Process-articles failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
