/**
 * app/api/football-scores/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Proxy route for football-data.org API calls.
 * The API key is server-side only — never exposed to client.
 *
 * GET /api/football-scores?type=live|upcoming&competition=PL|CL
 *
 * Used by: components/Sports/FootballScores.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';
import { getLiveMatches, getUpcomingMatches } from '@/lib/sports/football';
import type { FOOTBALL_COMPETITIONS } from '@/config/sports';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const type = request.nextUrl.searchParams.get('type') ?? 'live';
    const competition = (request.nextUrl.searchParams.get('competition') ?? 'PL') as keyof typeof FOOTBALL_COMPETITIONS;

    if (type === 'live') {
      const matches = await getLiveMatches();
      return NextResponse.json({ matches });
    }

    const matches = await getUpcomingMatches(competition);
    return NextResponse.json({ matches });
  } catch (err) {
    console.error('[FootballScores] Error:', err);
    return NextResponse.json({ matches: [] });
  }
}
