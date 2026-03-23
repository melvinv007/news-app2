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
  const log = logger(supabase, 'fetch-cricket');

  try {
    await log.info('Starting cricket fetch');
    
    // Part 1 - Match data
    let matchesUpdated = 0;
    try {
      const res = await fetch('https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=4415&s=2024-2025');
      if (res.ok) {
        const data = await res.json();
        const events = data.events || [];
        const recentEvents = events.slice(-10); // Take last 10
        
        for (const event of recentEvents) {
          await supabase.from('cricket_matches').upsert({
            match_id: event.idEvent,
            home_team: event.strHomeTeam,
            away_team: event.strAwayTeam,
            home_score: event.intHomeScore ?? '',
            away_score: event.intAwayScore ?? '',
            match_date: event.strTimestamp || event.dateEvent,
            status: event.strStatus ?? 'Unknown',
            league: event.strLeague,
            updated_at: new Date().toISOString()
          }, { onConflict: 'match_id' });
          matchesUpdated++;
        }
      }
    } catch (e) {
      await log.error('Failed to fetch cricket matches', { error: String(e) });
    }

    // Part 2 - RSS news articles
    const cricketSources = SOURCES.filter(s => s.category === 'sports-cricket' && s.enabled);
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = cricketSources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    const rssArticles = await fetchAllRSS(activeSources, supabase);
    const uniqueArticles = rssArticles.slice(0, 5);

    await log.info(`Found ${uniqueArticles.length} cricket articles`);

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
          category: 'sports-cricket',
          published_at: article.pubDate || new Date().toISOString(),
          ai_processed: false,
          fingerprint: fingerprint,
          content_fetched: false
        });
        inserted++;
      }
    }

    await log.info(`Cricket fetch completed`, { inserted, matchesUpdated });
    return new Response(JSON.stringify({ ok: true, inserted, matchesUpdated }), { status: 200 });
  } catch (error) {
    await log.error('Cricket fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
