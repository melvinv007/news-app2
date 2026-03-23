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
  const log = logger(supabase, 'fetch-mumbai');

  try {
    await log.info('Starting mumbai fetch');
    const articles: any[] = [];

    // GNews API
    try {
      const res = await fetch(
        `https://gnews.io/api/v4/search?q=mumbai&lang=en&country=in&max=5&token=${Deno.env.get('GNEWS_API_KEY')}`
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.articles || [];
        for (const item of results) {
          if (!item.title || !item.url) continue;
          articles.push({
            title: item.title,
            link: item.url,
            contentSnippet: item.description ?? '',
            pubDate: item.publishedAt,
            source: item.source?.name,
            category: 'mumbai'
          });
        }
      } else {
        await log.error('GNews API error', { status: res.status });
      }
    } catch (e) {
      await log.error('GNews API exception', { error: String(e) });
    }

    // Deduplicate by URL
    const uniqueMap = new Map();
    for (const a of articles) {
      if (!uniqueMap.has(a.link)) uniqueMap.set(a.link, a);
    }
    const uniqueArticles = Array.from(uniqueMap.values()).slice(0, 5);

    await log.info(`Found ${uniqueArticles.length} unique articles`);

    let inserted = 0;
    for (const article of uniqueArticles) {
      const fingerprint = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 6).join('-');
      
      const { data: recents } = await supabase
        .from('articles')
        .select('id, link')
        .gte('published_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .limit(200);

      const isDuplicate = recents?.some(r => r.link === article.link);
      
      if (!isDuplicate) {
        await supabase.from('articles').insert({
          title: article.title,
          url: article.link,
          full_url: article.link,
          source: article.source,
          category: article.category,
          published_at: article.pubDate || new Date().toISOString(),
          ai_processed: false,
          story_fingerprint: fingerprint,
          content_fetched: false
        });
        inserted++;
      }
    }

    await log.info(`Mumbai fetch completed`, { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });
  } catch (error) {
    await log.error('Mumbai fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
