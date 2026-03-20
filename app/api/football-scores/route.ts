/**
 * app/api/football-scores/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Proxy route for API-Football (api-football.com).
 * The API key is server-side only — never exposed to client.
 *
 * GET /api/football-scores?type=live|upcoming
 *
 * Used by: components/Sports/FootballScores.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

const API_BASE = 'https://v3.football.api-sports.io';
const HIGHLIGHT_TEAMS = ['Manchester City', 'Barcelona'];

// League IDs: 39=PL, 2=CL, 135=Serie A, 78=Bundesliga, 61=Ligue 1, 301=ISL
const LEAGUE_IDS = '39,2,135,78,61,301';

type APIFixture = {
  fixture: {
    id: number;
    date: string;
    status: { short: string; long: string };
  };
  league: { id: number; name: string };
  teams: {
    home: { name: string };
    away: { name: string };
  };
  goals: {
    home: number | null;
    away: number | null;
  };
};

type MatchResult = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  competition: string;
  utcDate: string;
  isHighlighted: boolean;
};

async function apiFetch(path: string): Promise<APIFixture[]> {
  const apiKey = process.env.FOOTBALL_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'x-apisports-key': apiKey,
    },
  });
  if (!res.ok) return [];

  const data = await res.json();
  return data?.response ?? [];
}

function toMatch(f: APIFixture): MatchResult {
  const home = f.teams.home.name;
  const away = f.teams.away.name;
  return {
    id: f.fixture.id,
    homeTeam: home,
    awayTeam: away,
    homeScore: f.goals.home,
    awayScore: f.goals.away,
    status: f.fixture.status.short,
    competition: f.league.name,
    utcDate: f.fixture.date,
    isHighlighted: HIGHLIGHT_TEAMS.some(
      (t) => home.includes(t) || away.includes(t),
    ),
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const type = request.nextUrl.searchParams.get('type') ?? 'live';

    if (type === 'live') {
      const fixtures = await apiFetch('/fixtures?live=all');
      const matches = fixtures.map(toMatch);
      return NextResponse.json({ live: matches, upcoming: [] });
    }

    if (type === 'upcoming') {
      const fixtures = await apiFetch(`/fixtures?next=20&league=${LEAGUE_IDS}`);

      // Filter to next 7 days only
      const now = Date.now();
      const sevenDays = 7 * 24 * 3600 * 1000;
      const filtered = fixtures.filter((f) => {
        const d = new Date(f.fixture.date).getTime();
        return d >= now && d <= now + sevenDays;
      });

      // Group by league name
      const matches = filtered.map(toMatch);
      return NextResponse.json({ live: [], upcoming: matches });
    }

    return NextResponse.json({ live: [], upcoming: [] });
  } catch (err) {
    console.error('[FootballScores] Error:', err);
    return NextResponse.json({ live: [], upcoming: [] });
  }
}
