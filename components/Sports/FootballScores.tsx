/**
 * components/Sports/FootballScores.tsx
 * ─────────────────────────────────────────────────────────────────
 * Live and upcoming football scores widget.
 * Fetches via /api/football-scores proxy (keeps API key server-side).
 * Polls every 60 seconds during match hours for live updates.
 *
 * Graceful degradation: shows "No live matches" if empty.
 * FREE TIER: Premier League + Champions League only.
 *
 * How to change poll interval: Edit POLL_INTERVAL below.
 * Used by: app/(app)/sports/football/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { Timer, Trophy, Calendar } from 'lucide-react';

type Match = {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: string;
  competition: string;
  utcDate: string;
};

const POLL_INTERVAL = 60_000; // 60 seconds

function formatMatchTime(utcDate: string): string {
  return new Date(utcDate).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function FootballScores(): React.ReactElement {
  const [liveMatches, setLiveMatches] = useState<Match[]>([]);
  const [upcomingMatches, setUpcomingMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchMatches = useCallback(async (): Promise<void> => {
    try {
      const [liveRes, upcomingRes] = await Promise.all([
        fetch('/api/football-scores?type=live'),
        fetch('/api/football-scores?type=upcoming&competition=PL'),
      ]);

      if (liveRes.ok) {
        const data = (await liveRes.json()) as { matches: Match[] };
        setLiveMatches(data.matches);
      }

      if (upcomingRes.ok) {
        const data = (await upcomingRes.json()) as { matches: Match[] };
        setUpcomingMatches(data.matches);
      }
    } catch {
      // Graceful degrade
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMatches();
    const interval = setInterval(fetchMatches, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchMatches]);

  if (loading) {
    return (
      <div
        className="rounded-xl p-4 md:p-5"
        style={{ backgroundColor: 'var(--bg-secondary)' }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded shimmer" />
          <div className="h-3 w-32 rounded shimmer" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Live matches */}
      {liveMatches.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Timer size={14} style={{ color: 'var(--error)' }} />
            <span
              className="font-sans text-xs font-semibold uppercase tracking-wider"
              style={{ color: 'var(--error)' }}
            >
              Live
            </span>
          </div>
          <div className="space-y-2">
            {liveMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-tertiary)' }}
              >
                <span className="font-sans text-sm" style={{ color: 'var(--text-primary)' }}>
                  {match.homeTeam}
                </span>
                <span className="font-mono text-sm font-bold" style={{ color: 'var(--accent)' }}>
                  {match.homeScore ?? 0} – {match.awayScore ?? 0}
                </span>
                <span className="font-sans text-sm text-right" style={{ color: 'var(--text-primary)' }}>
                  {match.awayTeam}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming matches */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Calendar size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="font-sans text-xs font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Upcoming
          </span>
        </div>
        {upcomingMatches.length === 0 && liveMatches.length === 0 ? (
          <div className="flex items-center gap-2 py-4 justify-center">
            <Trophy size={16} style={{ color: 'var(--text-muted)' }} />
            <span className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>
              No live matches right now
            </span>
          </div>
        ) : (
          <div className="space-y-2">
            {upcomingMatches.map((match) => (
              <div
                key={match.id}
                className="flex items-center justify-between px-3 py-2 rounded-lg"
                style={{ backgroundColor: 'var(--bg-primary)' }}
              >
                <span className="font-sans text-sm" style={{ color: 'var(--text-secondary)' }}>
                  {match.homeTeam} vs {match.awayTeam}
                </span>
                <span className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
                  {formatMatchTime(match.utcDate)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Note */}
      <p className="font-sans text-xs mt-3" style={{ color: 'var(--text-muted)' }}>
        Live scores: Premier League &amp; Champions League only
      </p>
    </div>
  );
}
