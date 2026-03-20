/**
 * app/api/f1/route.ts
 * ─────────────────────────────────────────────────────────────────
 * Proxy for OpenF1 API (https://api.openf1.org). No API key needed.
 *
 * Query params:
 *   ?type=calendar  → All meetings for current year, sorted by date
 *   ?type=standings → Driver positions from latest session
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

type OpenF1Driver = {
  driver_number: number;
  full_name: string;
  name_acronym: string;
  team_name: string;
  session_key: number;
};

type OpenF1Position = {
  driver_number: number;
  position: number;
  session_key: number;
};

export async function GET(request: NextRequest): Promise<NextResponse> {
  const type = request.nextUrl.searchParams.get('type');
  const today = new Date().toISOString().split('T')[0];

  try {
    if (type === 'calendar') {
      const year = new Date().getFullYear();
      const res = await fetch(`https://api.openf1.org/v1/meetings?year=${year}`, {
        next: { revalidate: 3600 },
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
      // Fetch drivers and positions from the latest session
      const [driversRes, positionsRes] = await Promise.all([
        fetch('https://api.openf1.org/v1/drivers?session_key=latest', {
          next: { revalidate: 3600 },
        }),
        fetch('https://api.openf1.org/v1/position?session_key=latest', {
          next: { revalidate: 3600 },
        }),
      ]);

      if (!driversRes.ok || !positionsRes.ok) {
        return NextResponse.json({ standings: null });
      }

      const drivers: OpenF1Driver[] = await driversRes.json();
      const positions: OpenF1Position[] = await positionsRes.json();

      if (!drivers.length || !positions.length) {
        return NextResponse.json({ standings: null });
      }

      // Build a map of driver_number → driver info
      const driverMap = new Map<number, OpenF1Driver>();
      for (const d of drivers) {
        driverMap.set(d.driver_number, d);
      }

      // Get the latest position for each driver (last entry wins)
      const latestPositions = new Map<number, number>();
      for (const p of positions) {
        latestPositions.set(p.driver_number, p.position);
      }

      // Join drivers with positions
      const standings = Array.from(latestPositions.entries())
        .map(([driverNum, position]) => {
          const driver = driverMap.get(driverNum);
          return {
            position,
            driverName: driver?.full_name ?? driver?.name_acronym ?? `#${driverNum}`,
            teamName: driver?.team_name ?? '',
            driverNumber: driverNum,
          };
        })
        .sort((a, b) => a.position - b.position);

      return NextResponse.json({
        standings: standings.length > 0 ? standings : null,
      });
    }

    return NextResponse.json({ error: 'Invalid type param' }, { status: 400 });
  } catch {
    return NextResponse.json({ meetings: null, standings: null, next: null });
  }
}
