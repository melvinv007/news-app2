/**
 * components/Sports/F1Calendar.tsx
 * ─────────────────────────────────────────────────────────────────
 * F1 race calendar widget with next-race countdown.
 * Fetches live data from /api/f1 (OpenF1 API proxy).
 *
 * Features:
 *   - Countdown to next race (days/hours/minutes, auto-updates)
 *   - Full calendar list from OpenF1 meetings endpoint
 *   - Past races: opacity-50, line-through
 *   - Next race: amber highlight
 *   - Sprint badge on sprint weekends
 *   - Shimmer skeleton while loading
 *   - "Calendar unavailable" on API failure
 *
 * Used by: app/(app)/sports/f1/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flag, Clock, Zap, MapPin, AlertCircle } from 'lucide-react';

type Meeting = {
  round: number;
  name: string;
  circuit: string;
  country: string;
  date_start: string;
  date_end: string;
  is_past: boolean;
  is_sprint: boolean;
};

type NextRace = {
  name: string;
  circuit: string;
  country: string;
  date_start: string;
};

type Countdown = { days: number; hours: number; minutes: number } | null;

function getCountdown(dateStr: string): Countdown {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  return { days, hours, minutes };
}

export default function F1Calendar(): React.ReactElement {
  const [meetings, setMeetings] = useState<Meeting[] | null>(null);
  const [nextRace, setNextRace] = useState<NextRace | null>(null);
  const [countdown, setCountdown] = useState<Countdown>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [calRes, nextRes] = await Promise.all([
        fetch('/api/f1?type=calendar'),
        fetch('/api/f1?type=next'),
      ]);

      if (calRes.ok) {
        const cal = await calRes.json();
        if (cal.meetings) {
          setMeetings(cal.meetings);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }

      if (nextRes.ok) {
        const nxt = await nextRes.json();
        if (nxt.next) {
          setNextRace(nxt.next);
          setCountdown(getCountdown(nxt.next.date_start));
        }
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update countdown every minute
  useEffect(() => {
    if (!nextRace) return;
    const interval = setInterval(() => {
      setCountdown(getCountdown(nextRace.date_start));
    }, 60_000);
    return () => clearInterval(interval);
  }, [nextRace]);

  // Determine which meeting is "next" for highlighting
  const nextRound = meetings?.find((m) => !m.is_past)?.round ?? -1;

  if (loading) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-4 h-4 rounded shimmer" />
          <div className="h-3 w-32 rounded shimmer" />
        </div>
        <div className="h-20 rounded-lg shimmer mb-3" />
        <div className="space-y-1.5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-7 rounded shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !meetings) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Flag size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            F1 Calendar
          </span>
        </div>
        <div className="flex items-center gap-2 py-4 justify-center">
          <AlertCircle size={16} style={{ color: 'var(--text-muted)' }} />
          <span className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>
            Calendar unavailable
          </span>
        </div>
      </div>
    );
  }

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
          F1 Calendar {new Date().getFullYear()}
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
        {meetings.map((race) => {
          const isNext = race.round === nextRound;

          return (
            <div
              key={race.round}
              className="flex items-center justify-between px-2 py-1.5 rounded-lg text-sm"
              style={{
                opacity: race.is_past ? 0.5 : 1,
                backgroundColor: isNext ? 'var(--accent-subtle)' : 'transparent',
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
                    color: isNext ? 'var(--accent)' : 'var(--text-secondary)',
                    textDecoration: race.is_past ? 'line-through' : 'none',
                  }}
                >
                  {race.name}
                </span>
                {race.is_sprint && (
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
                {new Date(race.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
