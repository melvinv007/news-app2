/**
 * components/Sports/F1Calendar.tsx
 * ─────────────────────────────────────────────────────────────────
 * F1 race calendar widget with next-race countdown.
 *
 * Features:
 *   - Countdown to next race (days/hours/minutes)
 *   - Full calendar list from config/sports.ts
 *   - Past races: opacity-50, line-through
 *   - Next race: amber highlight
 *   - Sprint badge on sprint weekends
 *
 * How to update calendar: Edit F1_CALENDAR_2026 in config/sports.ts
 * Used by: app/(app)/sports/f1/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { Flag, Clock, Zap, MapPin } from 'lucide-react';
import { getRacesWithStatus, getCountdownToNextRace } from '@/lib/sports/f1';

export default function F1Calendar(): React.ReactElement {
  const races = getRacesWithStatus();
  const [countdown, setCountdown] = useState(getCountdownToNextRace());

  // Update countdown every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getCountdownToNextRace());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  const nextRace = races.find((r) => r.isNext);

  return (
    <div
      className="rounded-xl p-4 md:p-5 overflow-hidden"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Flag size={16} style={{ color: 'var(--accent)' }} />
        <span
          className="font-sans text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          F1 Calendar 2026
        </span>
      </div>

      {/* Next race countdown */}
      {nextRace && countdown && (
        <div
          className="rounded-lg p-3 mb-4 border"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            borderColor: 'var(--accent)',
          }}
        >
          <p className="font-display text-sm font-semibold" style={{ color: 'var(--accent)' }}>
            {nextRace.name}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
              {nextRace.circuit}, {nextRace.country}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={12} style={{ color: 'var(--accent)' }} />
            <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
              {countdown.days}d {countdown.hours}h {countdown.minutes}m
            </span>
          </div>
        </div>
      )}

      {/* Calendar list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {races.map((race) => (
          <div
            key={race.round}
            className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm"
            style={{
              opacity: race.isPast ? 0.5 : 1,
              backgroundColor: race.isNext ? 'var(--accent-subtle)' : 'transparent',
            }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className="font-mono text-xs w-5 flex-shrink-0"
                style={{ color: 'var(--text-muted)' }}
              >
                R{race.round}
              </span>
              <span
                className="font-sans text-sm truncate"
                style={{
                  color: race.isNext ? 'var(--accent)' : 'var(--text-secondary)',
                  textDecoration: race.isPast ? 'line-through' : 'none',
                }}
              >
                {race.name}
              </span>
              {race.sprintDate && (
                <span
                  className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold flex-shrink-0"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--bg-primary)',
                  }}
                >
                  <Zap size={8} />
                  Sprint
                </span>
              )}
            </div>
            <span
              className="font-mono text-xs flex-shrink-0 ml-2"
              style={{ color: 'var(--text-muted)' }}
            >
              {new Date(race.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
