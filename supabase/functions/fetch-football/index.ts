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
  const log = logger(supabase, 'fetch-football');

  try {
    await log.info('Starting football fetch');
    
    // Part 1 - Standings
    let standingsUpdated = 0;
    const leagues = [
      { code: 'PL', name: 'Premier League' },
      { code: 'CL', name: 'Champions League' },
      { code: 'PD', name: 'La Liga' },
      { code: 'BL1', name: 'Bundesliga' },
      { code: 'SA', name: 'Serie A' },
    ];
    
    for (const league of leagues) {
      try {
        const res = await fetch(
          `https://api.football-data.org/v4/competitions/${league.code}/standings`,
          { headers: { 'X-Auth-Token': Deno.env.get('FOOTBALL_DATA_API_KEY') ?? '' } }
        );
        if (res.ok) {
          const data = await res.json();
          const standingsBlocks = Array.isArray(data.standings) ? data.standings : [];
          // Competitions like UCL can return multiple group tables; flatten all.
          const rawStandings = standingsBlocks
            .flatMap((block: { table?: unknown[] }) => Array.isArray(block?.table) ? block.table : []);
          
          await log.info(`Sample standing row ${league.code}`, { sample: rawStandings[0] });
          
          const mappedStandings = rawStandings.map((row: any) => ({
            position: row.position ?? 0,
            team: row.team?.name ?? 'Unknown',
            played: row.playedGames ?? 0,
            won: row.won ?? 0,
            drawn: row.draw ?? 0,
            lost: row.lost ?? 0,
            points: row.points ?? 0,
            goalsFor: row.goalsFor ?? 0,
            goalsAgainst: row.goalsAgainst ?? 0,
          }));

          await supabase.from('football_standings').upsert({
            league_code: league.code,
            league_name: league.name,
            standings: mappedStandings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'league_code' });
          standingsUpdated++;
        }
      } catch (e) {
        await log.error(`Failed to fetch standings for ${league.code}`, { error: String(e) });
      }
    }

    // Part 2 - RSS news articles
    const footballSources = SOURCES.filter(s => s.category === 'sports-football' && s.enabled);
    const { data: prefs } = await supabase
      .from('user_preferences')
      .select('disabled_sources, source_url_overrides')
      .single();

    const disabledSources: string[] = prefs?.disabled_sources ?? [];
    const urlOverrides: Record<string, string> = prefs?.source_url_overrides ?? {};
    const activeSources = footballSources
      .filter(s => !disabledSources.includes(s.name))
      .map(s => ({ ...s, url: urlOverrides[s.name] ?? s.url }));

    const rssArticles = await fetchAllRSS(activeSources, supabase);
    const uniqueArticles = rssArticles.slice(0, 5);

    await log.info(`Found ${uniqueArticles.length} football articles`);

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
          full_url: article.link,
          source_name: article.source,
          category: 'sports-football',
          published_at: article.pubDate || new Date().toISOString(),
          ai_processed: false,
          story_fingerprint: fingerprint,
          content_fetched: false
        });
        inserted++;
      }
    }

    await log.info(`Football fetch completed`, { inserted, standingsUpdated });
    return new Response(JSON.stringify({ ok: true, inserted, standingsUpdated }), { status: 200 });
  } catch (error) {
    await log.error('Football fetch failed', { error: String(error) });
    return new Response(JSON.stringify({ ok: false }), { status: 500 });
  }
});
