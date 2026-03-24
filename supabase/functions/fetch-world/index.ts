import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const log = logger(supabase, 'fetch-world');

  try {
    await log.info('Starting world fetch');
    const yesterday = new Date(Date.now() - 24*3600*1000).toISOString().split('T')[0];
    const articles: any[] = [];

    // Guardian API
    try {
      const guardianRes = await fetch(
        `https://content.guardianapis.com/search?section=world&show-fields=headline,trailText,webUrl&page-size=10&from-date=${yesterday}&api-key=${Deno.env.get('GUARDIAN_API_KEY')}`
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
            category: 'world'
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
        `https://api.nytimes.com/svc/topstories/v2/world.json?api-key=${Deno.env.get('NYT_API_KEY')}`
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
            category: 'world'
          });
        }
      } else {
        await log.error('NYT API error', { status: nytRes.status });
      }
    } catch (e) {
      await log.error('NYT API exception', { error: String(e) });
    }

    // Deduplicate by URL
    const uniqueMap = new Map();
    for (const a of articles) {
      if (!uniqueMap.has(a.link)) uniqueMap.set(a.link, a);
    }
    const uniqueArticles = Array.from(uniqueMap.values()).slice(0, 8);

    await log.info(`Found ${uniqueArticles.length} unique articles`);

    let inserted = 0;
    for (const article of uniqueArticles) {
      const fingerprint = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 6).join('-');
      
      const { data: recents } = await supabase
        .from('articles')
        .select('id, full_url')
        .gte('published_at', new Date(Date.now() - 48 * 3600 * 1000).toISOString())
        .limit(200);

      const isDuplicate = recents?.some(r => r.full_url === article.link);
      
      if (!isDuplicate) {
        await supabase.from('articles').insert({
          title: article.title,
          full_url: article.link,
          source_name: article.source_name,
          category: article.category,
          published_at: article.pubDate || new Date().toISOString(),
          ai_processed: false,
          story_fingerprint: fingerprint,
          content_fetched: false
        });
        inserted++;
      }
    }

    await log.info(`World fetch completed`, { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });
  } catch (error) {
    await log.error('World fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
