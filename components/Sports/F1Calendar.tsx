'use client';

import { useState, useEffect, useCallback } from 'react';
import { Flag, Clock, Zap, MapPin, AlertCircle, RefreshCw, Loader2, Radio } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type F1Session = {
  session_key: number;
  session_name: string;
  session_type: string;
  date_start: string;
  date_end: string;
  circuit_short_name: string;
  country_name: string;
  positions: any[];
};

type Countdown = { days: number; hours: number; minutes: number, seconds: number } | null;

function getCountdown(dateStr: string): Countdown {
  const diff = new Date(dateStr).getTime() - Date.now();
  if (diff <= 0) return null;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const minutes = Math.floor((diff % 3600000) / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return { days, hours, minutes, seconds };
}

export default function F1Calendar(): React.ReactElement {
  const [sessions, setSessions] = useState<F1Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState<Countdown>(null);

  const fetchSessions = useCallback(async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('f1_session_data')
      .select('*')
      .order('date_start', { ascending: true });
    
    if (!error && data) setSessions(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/refresh-f1', { method: 'POST' });
      await fetchSessions();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  const now = new Date();
  
  const nextRace = sessions.find(s => new Date(s.date_start) > now && (s.session_name.includes('Race') || s.session_type === 'Race'));
  
  const activeSession = sessions.find(s => {
    const start = new Date(s.date_start);
    const end = new Date(s.date_end);
    return now >= start && now <= end;
  });

  useEffect(() => {
    if (!nextRace) return;
    setCountdown(getCountdown(nextRace.date_start));
    const interval = setInterval(() => {
      setCountdown(getCountdown(nextRace.date_start));
    }, 1000);
    return () => clearInterval(interval);
  }, [nextRace]);

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

  if (sessions.length === 0) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Flag size={16} className="text-[var(--accent)]" />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            F1 Sessions
          </span>
        </div>
        <div className="flex items-center gap-2 py-4 justify-center">
          <AlertCircle size={16} className="text-[var(--text-muted)]" />
          <span className="font-sans text-sm text-[var(--text-muted)]">
            Sessions unavailable
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 md:p-5 overflow-hidden flex flex-col gap-4" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Flag size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            F1 Sessions {new Date().getFullYear()}
          </span>
        </div>
        <button 
          onClick={handleRefresh} 
          disabled={refreshing}
          className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
        >
          {refreshing ? <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /> : <RefreshCw size={16} className="text-[var(--text-muted)]" />}
        </button>
      </div>

      {/* Next race countdown */}
      {nextRace && countdown && (
        <div
          className="rounded-lg p-3 border"
          style={{
            backgroundColor: 'var(--accent-subtle)',
            borderColor: 'var(--accent)',
          }}
        >
          <div className="flex items-center justify-between">
            <p className="font-display text-sm font-semibold" style={{ color: 'var(--accent)' }}>
              Next: {nextRace.session_name} ({nextRace.country_name})
            </p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            <MapPin size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
              {nextRace.circuit_short_name}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Clock size={12} style={{ color: 'var(--accent)' }} />
            <span className="font-mono text-sm font-bold tabular-nums" style={{ color: 'var(--accent)' }}>
              {countdown.days}d {countdown.hours.toString().padStart(2, '0')}h {countdown.minutes.toString().padStart(2, '0')}m {countdown.seconds.toString().padStart(2, '0')}s
            </span>
          </div>
        </div>
      )}

      {/* Live Timing */}
      {activeSession && activeSession.positions && activeSession.positions.length > 0 && (
        <div className="rounded-lg border border-[var(--border)] p-3 bg-[var(--bg-primary)]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Radio size={14} className="text-red-500 animate-pulse" />
              <span className="font-sans text-xs font-semibold uppercase tracking-wider text-red-500">Live Timing</span>
            </div>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {activeSession.positions.slice(0, 10).map((pos: any, i) => (
              <div key={i} className="flex justify-between items-center text-sm font-mono p-1 bg-[var(--bg-secondary)] rounded">
                <span className="text-[var(--text-secondary)] w-6">{pos.position}</span>
                <span className="text-[var(--text-primary)] font-bold flex-1 ml-2">CAR {pos.driver_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
        {sessions.map((session) => {
          const isPast = new Date(session.date_end) < now;
          const isToday = new Date(session.date_start).toDateString() === now.toDateString();
          const isActive = now >= new Date(session.date_start) && now <= new Date(session.date_end);
          
          return (
            <div
              key={session.session_key}
              className="flex flex-col px-2 py-1.5 rounded-lg text-sm border border-transparent transition-colors"
              style={{
                opacity: isPast ? 0.5 : 1,
                backgroundColor: isToday && !isActive ? 'var(--accent-subtle)' : isActive ? 'rgba(239, 68, 68, 0.1)' : 'transparent',
                borderColor: isActive ? 'rgba(239, 68, 68, 0.3)' : isToday ? 'var(--accent)' : 'transparent',
              }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-sans text-sm font-medium truncate"
                  style={{
                    color: isActive ? '#ef4444' : isToday ? 'var(--accent)' : 'var(--text-secondary)',
                    textDecoration: isPast ? 'line-through' : 'none',
                  }}
                >
                  {session.session_name}
                </span>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-500">
                      LIVE
                    </span>
                  )}
                  {isToday && !isActive && (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}>
                      TODAY
                    </span>
                  )}
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(session.date_start).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {session.circuit_short_name}, {session.country_name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
