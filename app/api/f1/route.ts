/**
 * app/api/f1/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Proxy for OpenF1 API (https://api.openf1.org). No API key needed.
 *
 * Query params:
 *   ?type=calendar  → All meetings for current year, sorted by date
 *   ?type=standings → Latest driver standings
 *   ?type=next      → Next upcoming meeting
 *
 * Graceful degrade: returns null data on any fetch failure.
 * Used by: F1Calendar.tsx, F1Standings.tsx
 */

import { NextResponse, type NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type OpenF1Meeting = {
  meeting_key: number;
  meeting_name: string;
  meeting_official_name: string;
  circuit_short_name: string;
  country_name: string;
  date_start: string;
  date_end: string;
  year: number;
};

type OpenF1Standing = {
  position: number;
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  points: number;
  wins: number;
  session_key: number;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const type = request.nextUrl.searchParams.get('type');
  const today = new Date().toISOString().split('T')[0];

  try {
    if (type === 'calendar') {
      const year = new Date().getFullYear();
      const res = await fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
        next: { revalidate: 3600 }, // cache 1 hour
      });

      if (!res.ok) {
        return NextResponse.json({ meetings: null });
      }

      const meetings: OpenF1Meeting[] = await res.json();

      const sorted = meetings
        .sort((a, b) => a.date_start.localeCompare(b.date_start))
        .map((m, i) => ({
          round: i + 1,
          name: m.meeting_name,
          circuit: m.circuit_short_name,
          country: m.country_name,
          date_start: m.date_start,
          date_end: m.date_end,
          is_past: m.date_end.split('T')[0] < today,
          is_sprint: m.meeting_official_name?.toLowerCase().includes('sprint') ?? false,
        }));

      return NextResponse.json({ meetings: sorted });
    }

    if (type === 'next') {
      const year = new Date().getFullYear();
      const res = await fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return NextResponse.json({ next: null });
      }

      const meetings: OpenF1Meeting[] = await res.json();
      const sorted = meetings.sort((a, b) => a.date_start.localeCompare(b.date_start));
      const next = sorted.find((m) => m.date_start.split('T')[0] >= today) ?? null;

      if (!next) {
        return NextResponse.json({ next: null });
      }

      return NextResponse.json({
        next: {
          name: next.meeting_name,
          circuit: next.circuit_short_name,
          country: next.country_name,
          date_start: next.date_start,
        },
      });
    }

    if (type === 'standings') {
      const res = await fetch(`https://api.openf1.org/v1/drivers?session_key=latest`, {
        next: { revalidate: 3600 },
      });

      if (!res.ok) {
        return NextResponse.json({ standings: null });
      }

      const drivers: OpenF1Standing[] = await res.json();

      // OpenF1 may return drivers without position — filter to those with standings data
      const withPositions = drivers
        .filter((d) => d.position != null && d.points != null)
        .sort((a, b) => a.position - b.position)
        .map((d) => ({
          position: d.position,
          driver: d.full_name ?? d.name_acronym,
          team: d.team_name ?? '',
          points: d.points ?? 0,
        }));

      return NextResponse.json({ standings: withPositions.length > 0 ? withPositions : null });
    }

    return NextResponse.json({ error: 'Invalid type param' }, { status: 400 });
  } catch {
    return NextResponse.json({ meetings: null, standings: null, next: null });
  }
}
