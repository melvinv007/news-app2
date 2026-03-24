import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { logger } from '../_shared/logger.ts';
import { fetchAllRSS } from '../_shared/rss.ts';
import { SOURCES } from '../_shared/sources.ts';

Deno.serve(async (req) => {
  if (req.headers.get('x-cron-secret') !== Deno.env.get('CRON_SECRET')) {
    return new Response('Unauthorized', { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );
  const log = logger(supabase, 'fetch-f1');

  try {
    await log.info('Starting f1 fetch');
    
    // Part 1 - OpenF1 Session data
    let sessionsUpdated = 0;
    try {
      const sessionsRes = await fetch('https://api.openf1.org/v1/sessions?year=2026'); // Using 2026 as asked
      if (sessionsRes.ok) {
        const sessions = await sessionsRes.json();
        
        for (const session of sessions) {
          await supabase.from('f1_session_data').upsert({
            session_key: session.session_key,
            session_name: session.session_name,
            session_type: session.session_type,
            date_start: session.date_start,
            date_end: session.date_end,
            circuit_short_name: session.circuit_short_name,
            country_name: session.country_name,
            updated_at: new Date().toISOString()
          }, { onConflict: 'session_key' });
          sessionsUpdated++;
        }

        const today = new Date().toISOString().split('T')[0];
        const activeSession = sessions.find((s: any) => s.date_start?.startsWith(today));
        if (activeSession) {
          const posRes = await fetch(`https://api.openf1.org/v1/position?session_key=${activeSession.session_key}`);
          if (posRes.ok) {
            const positions = await posRes.json();
            await supabase.from('f1_session_data').update({
              positions: positions,
              updated_at: new Date().toISOString()
            }).eq('session_key', activeSession.session_key);
          }
        }
      }
    } catch (e) {
      await log.error('Failed to fetch f1 sessions', { error: String(e) });
    }

    // Part 2 - RSS news articles
    const f1Sources = SOURCES.filter(s => s.category === 'sports-f1' && s.enabled);
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = f1Sources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    const rssArticles = await fetchAllRSS(activeSources, supabase);
    const uniqueArticles = rssArticles.slice(0, 5);

    await log.info(`Found ${uniqueArticles.length} f1 articles`);

    let inserted = 0;
    for (const article of uniqueArticles) {
      const fingerprint = article.title.toLowerCase().replace(/[^a-z0-9\s]/g, '').split(/\s+/).slice(0, 6).join('-');
      
      const { data: recents } = await supabase
        .from('articles')
        .select('id, full_url')
        .gte('published_at', new Date(Date.now() - 24 * 3600 * 1000).toISOString())
        .limit(200);

      const isDuplicate = recents?.some(r => r.full_url === article.link);
      
      if (!isDuplicate) {
        await supabase.from('articles').insert({
          title: article.title,
          url: article.link,
          full_url: article.link,
          source_name: article.source,
          category: 'sports-f1',
          published_at: article.pubDate || new Date().toISOString(),
          ai_processed: false,
          story_fingerprint: fingerprint,
          content_fetched: false
        });
        inserted++;
      }
    }

    await log.info(`f1 fetch completed`, { inserted, sessionsUpdated });
    return new Response(JSON.stringify({ ok: true, inserted, sessionsUpdated }), { status: 200 });
  } catch (error) {
    await log.error('f1 fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
