/**
 * supabase/functions/fetch-business/index.ts
 * ─────────────────────────────────────────────────────────────────
 * Lightweight RSS-only fetch for Business + Stocks news.
 * Triggered every 15 min by cron-job.org.
 *
 * No AI calls — articles are inserted raw with ai_processed = false.
 * AI processing handled separately by process-articles function.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { fetchAllRSS } from '../_shared/rss.ts';
import { filterDuplicates } from '../_shared/dedup.ts';
import { SOURCES } from '../_shared/sources.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  );
  const log = logger(supabase, 'fetch-business');
  await log.info('Fetch-business started');

  try {
    const categories = ['business', 'stocks-india', 'stocks-us'];
    const sources = SOURCES.filter(s => categories.includes(s.category) && s.enabled);

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

    const rssArticles = await fetchAllRSS(activeSources, supabase);
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString().split('T')[0];
    const articles: any[] = [];

    // Guardian API
    try {
      const guardianRes = await fetch(
        `https://content.guardianapis.com/search?section=business&show-fields=headline,trailText,webUrl&page-size=5&from-date=${yesterday}&api-key=${Deno.env.get('GUARDIAN_API_KEY')}`
      );
      if (guardianRes.ok) {
        const data = await guardianRes.json();
        const results = data.response?.results || [];
        for (const item of results) {
          articles.push({
            title: item.fields?.headline || item.webTitle,
            link: item.webUrl,
            contentSnippet: item.fields?.trailText ?? '',
            pubDate: item.webPublicationDate,
            source_name: 'The Guardian',
            category: 'business'
          });
        }
      } else {
        await log.error('Guardian API error', { status: guardianRes.status });
      }
    } catch (e) {
      await log.error('Guardian API exception', { error: String(e) });
    }

    // NYT API
    try {
      const nytRes = await fetch(
        `https://api.nytimes.com/svc/topstories/v2/business.json?api-key=${Deno.env.get('NYT_API_KEY')}`
      );
      if (nytRes.ok) {
        const data = await nytRes.json();
        const results = data.results || [];
        for (const item of results) {
          if (!item.title || !item.url) continue;
          articles.push({
            title: item.title,
            link: item.url,
            contentSnippet: item.abstract ?? '',
            pubDate: item.published_date,
            source_name: 'New York Times',
            category: 'business'
          });
        }
      } else {
        await log.error('NYT API error', { status: nytRes.status });
      }
    } catch (e) {
      await log.error('NYT API exception', { error: String(e) });
    }

    articles.push(...rssArticles);

    // Deduplicate by URL
    const uniqueMap = new Map();
    for (const a of articles) {
      if (!uniqueMap.has(a.link)) uniqueMap.set(a.link, a);
    }
    const finalArticles = Array.from(uniqueMap.values()).slice(0, 8);

    for (const article of finalArticles) {
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
      .in('category', categories)
      .gte('published_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
      .limit(200);

    const recentFingerprints: Record<string, string[]> = {};
    for (const r of (recents ?? [])) {
      if (!r.story_fingerprint) continue;
      if (!recentFingerprints[r.category]) recentFingerprints[r.category] = [];
      recentFingerprints[r.category].push(r.story_fingerprint);
    }

    const uniqueArticles = await filterDuplicates(
      finalArticles as Parameters<typeof filterDuplicates>[0],
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
        source_name: article.source_name,
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

    await log.info('Fetch-business completed', { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });

  } catch (err) {
    await log.error('Fetch-business failed', { error: String(err) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
