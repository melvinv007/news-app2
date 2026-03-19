/**
 * lib/sports/football.ts
 * ─────────────────────────────────────────────────────────────────
 * football-data.org API client.
 * FREE TIER: Premier League (PL) + Champions League (CL) ONLY.
 * Other leagues use RSS news feeds (results appear within minutes).
 * Rate limit: 10 requests/minute — never poll aggressively.
 */

import { FOOTBALL_API_BASE, FOOTBALL_COMPETITIONS } from '@/config/sports';

export type FootballMatch = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'SCHEDULED' | 'LIVE' | 'IN_PLAY' | 'PAUSED' | 'FINISHED' | 'CANCELLED';
  competition: string;
  utcDate: string;
};

async function footballFetch(path: string): Promise<unknown> {
  const res = await fetch(`${FOOTBALL_API_BASE}${path}`, {
    headers: {
      'X-Auth-Token': process.env.FOOTBALL_DATA_API_KEY ?? '',
    },
  });
  if (!res.ok) throw new Error(`football-data.org: ${res.status}`);
  return res.json();
}

export async function getLiveMatches(): Promise<FootballMatch[]> {
  try {
    const data = await footballFetch('/matches?status=LIVE') as { matches: Array<{
      id: number;
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: { fullTime: { home: number | null; away: number | null } };
      status: FootballMatch['status'];
      competition: { name: string };
      utcDate: string;
    }> };
    return (data.matches ?? []).map(m => ({
      id:          m.id,
      homeTeam:    m.homeTeam.name,
      awayTeam:    m.awayTeam.name,
      homeScore:   m.score.fullTime.home,
      awayScore:   m.score.fullTime.away,
      status:      m.status,
      competition: m.competition.name,
      utcDate:     m.utcDate,
    }));
  } catch {
    return [];
  }
}

export async function getUpcomingMatches(competition: keyof typeof FOOTBALL_COMPETITIONS): Promise<FootballMatch[]> {
  try {
    const code = FOOTBALL_COMPETITIONS[competition];
    const data = await footballFetch(`/competitions/${code}/matches?status=SCHEDULED&limit=5`) as { matches: Array<{
      id: number;
      homeTeam: { name: string };
      awayTeam: { name: string };
      score: { fullTime: { home: number | null; away: number | null } };
      status: FootballMatch['status'];
      competition: { name: string };
      utcDate: string;
    }> };
    return (data.matches ?? []).map(m => ({
      id:          m.id,
      homeTeam:    m.homeTeam.name,
      awayTeam:    m.awayTeam.name,
      homeScore:   m.score.fullTime.home,
      awayScore:   m.score.fullTime.away,
      status:      m.status,
      competition: m.competition.name,
      utcDate:     m.utcDate,
    }));
  } catch {
    return [];
  }
}
