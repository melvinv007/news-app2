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
  const log = logger(supabase, 'fetch-india');

  try {
    await log.info('Starting india fetch');
    const articles: any[] = [];

    // NewsData.io API
    try {
      const res = await fetch(
        `https://newsdata.io/api/1/news?country=in&language=en&apikey=${Deno.env.get('NEWSDATA_API_KEY')}`
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.results || [];
        for (const item of results) {
          if (!item.title || !item.link) continue;
          articles.push({
            title: item.title,
            link: item.link,
            contentSnippet: item.description ?? '',
            pubDate: item.pubDate,
            source: item.source_id,
            category: 'india'
          });
        }
      } else {
        await log.error('NewsData.io API error', { status: res.status });
      }
    } catch (e) {
      await log.error('NewsData.io API exception', { error: String(e) });
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
        const insertPayload = {
          title: article.title,
          url: article.link,
          full_url: article.link,
          source: article.source,
          category: article.category,
          published_at: String(article.pubDate || new Date().toISOString()),
          ai_processed: false,
          story_fingerprint: fingerprint,
          content_fetched: false
        };
        const { error: insertErr } = await supabase.from('articles').insert(insertPayload);
        
        if (insertErr) {
           await log.error('Failed to insert article', { title: article.title, error: insertErr });
        } else {
           await log.info('Inserted article', { category: article.category, source: article.source });
           inserted++;
        }
      }
    }

    await log.info(`India fetch completed`, { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });
  } catch (error) {
    await log.error('India fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
