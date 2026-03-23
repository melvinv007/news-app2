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
  const log = logger(supabase, 'fetch-stocks-news');

  try {
    await log.info('Starting stocks news fetch');
    const articles: any[] = [];

    // MarketAux API
    try {
      const res = await fetch(
        `https://api.marketaux.com/v1/news/all?symbols=RELIANCE,TCS,INFY,HDFC,AAPL,TSLA,NVDA,MSFT&filter_entities=true&language=en&api_token=${Deno.env.get('MARKETAUX_API_KEY')}`
      );
      if (res.ok) {
        const data = await res.json();
        const results = data.data || [];
        for (const item of results) {
          if (!item.title || !item.url) continue;
          
          let category = 'stocks-us';
          if (item.entities && Array.isArray(item.entities)) {
            if (item.entities.some((e: any) => e.country === 'IN')) {
              category = 'stocks-india';
            }
          }

          articles.push({
            title: item.title,
            link: item.url,
            contentSnippet: item.description ?? '',
            pubDate: item.published_at,
            source: item.source,
            category
          });
        }
      } else {
        await log.error('MarketAux API error', { status: res.status });
      }
    } catch (e) {
      await log.error('MarketAux API exception', { error: String(e) });
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

    await log.info(`Stocks news fetch completed`, { inserted });
    return new Response(JSON.stringify({ ok: true, inserted }), { status: 200 });
  } catch (error) {
    await log.error('Stocks news fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
