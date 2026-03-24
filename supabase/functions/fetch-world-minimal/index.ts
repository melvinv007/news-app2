/**
 * supabase/functions/fetch-world-minimal/index.ts
 * ─────────────────────────────────────────────────────────────────
 * MINIMAL VERSION for testing - only Guardian API, no RSS, no dedup
 * Use this to verify the pipeline works, then expand.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';

Deno.serve(async (req) => {
  // Auth check
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const log = logger(supabase, 'fetch-world-minimal');

  try {
    await log.info('🚀 Minimal world fetch started');
    
    const yesterday = new Date(Date.now() - 24*3600*1000).toISOString().split('T')[0];
    const articles: any[] = [];

    // Guardian API only
    const guardianKey = Deno.env.get('GUARDIAN_API_KEY');
    if (guardianKey) {
      try {
        const url = `https://content.guardianapis.com/search?section=world&show-fields=headline,trailText,webUrl&page-size=5&from-date=${yesterday}&api-key=${guardianKey}`;
        await log.info('Fetching from Guardian...');
        
        const guardianRes = await fetch(url, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)' }
        });
        
        if (guardianRes.ok) {
          const data = await guardianRes.json();
          const results = data.response?.results || [];
          await log.info(`Guardian returned ${results.length} articles`);
          
          for (const item of results) {
            articles.push({
              title: item.fields?.headline || item.webTitle,
              link: item.webUrl,
              snippet: item.fields?.trailText ?? '',
              pubDate: item.webPublicationDate,
              source: 'The Guardian',
              category: 'world'
            });
          }
        } else {
          await log.error('Guardian API error', { status: guardianRes.status });
        }
      } catch (e) {
        await log.error('Guardian exception', { error: String(e) });
      }
    } else {
      await log.warn('GUARDIAN_API_KEY not set');
    }

    await log.info(`Total articles found: ${articles.length}`);

    // Simple insert - no dedup for now
    let inserted = 0;
    for (const article of articles) {
      try {
        // Check if URL already exists
        const { data: existing } = await supabase
          .from('articles')
          .select('id')
          .eq('full_url', article.link)
          .single();

        if (!existing) {
          const { error } = await supabase.from('articles').insert({
            title: article.title,
            full_url: article.link,
            source_name: article.source,
            category: article.category,
            published_at: article.pubDate || new Date().toISOString(),
            ai_processed: false,
            summary: article.snippet.slice(0, 500),
            is_null_article: false,
            has_update: false,
            source_count: 1,
            content_fetched: false,
            is_cluster_primary: true
          });

          if (!error) {
            inserted++;
          } else {
            await log.error('Insert failed', { title: article.title, error: String(error) });
          }
        }
      } catch (e) {
        await log.error('Article processing error', { error: String(e) });
      }
    }

    await log.info(`✅ Completed: ${inserted} articles inserted`);

    return new Response(
      JSON.stringify({ ok: true, inserted, total: articles.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (err) {
    await log.error('Fatal error', { error: String(err) });
    return new Response(
      JSON.stringify({ ok: false, error: String(err) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
