/**
 * components/Sports/F1Standings.tsx
 * ─────────────────────────────────────────────────────────────────
 * F1 driver standings from OpenF1 API via /api/f1?type=standings.
 *
 * Shows driver standings table: Position | Driver | Team | Points.
 * P1 highlighted in amber. font-mono for numbers.
 *
 * Graceful degrade: "Standings unavailable after first race" if API
 * returns no data (pre-season or API down).
 *
 * Used by: app/(app)/sports/f1/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { BarChart3, AlertCircle } from 'lucide-react';

type DriverStanding = {
  position: number;
  driver: string;
  team: string;
  points: number | null;
};

export default function F1Standings(): React.ReactElement {
  const [standings, setStandings] = useState<DriverStanding[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStandings(): Promise<void> {
      try {
        const res = await fetch('/api/f1?type=standings');
        if (res.ok) {
          const data = await res.json();
          setStandings(data.standings ?? null);
        }
      } catch {
        // Graceful degrade
      } finally {
        setLoading(false);
      }
    }

    fetchStandings();
  }, []);

  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
        <span
          className="font-sans text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Driver Standings
        </span>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-8 rounded-lg shimmer" />
          ))}
        </div>
      ) : !standings || standings.length === 0 ? (
        <div className="flex items-center gap-2 py-4 justify-center">
          <AlertCircle size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>
            Standings unavailable after first race
          </span>
        </div>
      ) : (
        <div className="overflow-x-auto">
          {/* Table header */}
          <div
            className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-2 py-1.5 text-[11px] font-sans font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            <span>P</span>
            <span>Driver</span>
            <span>Team</span>
            <span className="text-right">Pts</span>
          </div>

          {/* Table rows */}
          <div className="space-y-0.5">
            {standings.map((d) => {
              const isP1 = d.position === 1;

              return (
                <div
                  key={d.position}
                  className="grid grid-cols-[2rem_1fr_1fr_3rem] gap-2 px-2 py-1.5 rounded-lg text-sm"
                  style={{
                    backgroundColor: isP1 ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                  }}
                >
                  <span
                    className="font-mono text-xs font-bold"
                    style={{ color: isP1 ? 'var(--accent)' : 'var(--text-muted)' }}
                  >
                    {d.position}
                  </span>
                  <span
                    className="font-sans text-sm truncate"
                    style={{ color: isP1 ? 'var(--accent)' : 'var(--text-primary)' }}
                  >
                    {d.driver}
                  </span>
                  <span
                    className="font-sans text-xs truncate self-center"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {d.team}
                  </span>
                  <span
                    className="font-mono text-sm text-right font-bold"
                    style={{ color: isP1 ? 'var(--accent)' : 'var(--text-secondary)' }}
                  >
                    {d.points ?? '-'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
