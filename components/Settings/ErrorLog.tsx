/**
 * components/Settings/ErrorLog.tsx
 * ─────────────────────────────────────────────────────────────────
 * System error log viewer. Shows latest 50 system_logs entries.
 *
 * Filter buttons: All / Info / Warning / Error.
 * Each row: level badge (colour coded) + source + message + time ago.
 * "Mark resolved" button → update resolved=true.
 * Auto-resolved logs shown with muted style.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/settings/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Check, AlertTriangle, XCircle, Info, ListFilter } from 'lucide-react';
import type { SystemLog } from '@/lib/supabase/types';

type FilterLevel = 'all' | 'info' | 'warning' | 'error';

const LEVEL_CONFIG = {
  info:    { icon: Info,           color: 'var(--text-muted)',  bg: 'var(--bg-tertiary)' },
  warning: { icon: AlertTriangle,  color: 'var(--accent)',      bg: 'var(--accent-subtle)' },
  error:   { icon: XCircle,        color: 'var(--error)',       bg: 'rgba(239,68,68,0.1)' },
} as const;

function timeAgo(isoDate: string): string {
  const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export default function ErrorLog(): React.ReactElement {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterLevel>('all');

  const fetchLogs = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    let query = supabase
      .from('system_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(50);

    if (filter !== 'all') {
      query = query.eq('level', filter);
    }

    const { data } = await query;
    setLogs((data ?? []) as SystemLog[]);
    setLoading(false);
  }, [filter]);

  useEffect(() => {
    setLoading(true);
    fetchLogs();
  }, [fetchLogs]);

  const handleMarkResolved = async (id: string): Promise<void> => {
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('system_logs') as any).update({ resolved: true }).eq('id', id);
    setLogs((prev) => prev.map((l) => (l.id === id ? { ...l, resolved: true } : l)));
  };

  const filters: { label: string; value: FilterLevel }[] = [
    { label: 'All',     value: 'all' },
    { label: 'Info',    value: 'info' },
    { label: 'Warning', value: 'warning' },
    { label: 'Error',   value: 'error' },
  ];

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ListFilter size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            System Logs
          </span>
        </div>
        <div className="flex gap-1">
          {filters.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className="px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors"
              style={{
                backgroundColor: filter === f.value ? 'var(--accent)' : 'var(--bg-tertiary)',
                color: filter === f.value ? 'var(--bg-primary)' : 'var(--text-muted)',
              }}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      ) : logs.length === 0 ? (
        <div className="flex flex-col items-center py-8 gap-2">
          <Check size={24} style={{ color: 'var(--success)' }} />
          <p className="font-sans text-sm" style={{ color: 'var(--text-muted)' }}>No logs found</p>
        </div>
      ) : (
        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {logs.map((log) => {
            const conf = LEVEL_CONFIG[log.level];
            const LevelIcon = conf.icon;
            const isMuted = log.resolved || log.auto_resolved;

            return (
              <div
                key={log.id}
                className="flex items-start justify-between gap-3 px-3 py-2.5 rounded-lg"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  opacity: isMuted ? 0.5 : 1,
                }}
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className="flex-shrink-0 mt-0.5 px-1.5 py-0.5 rounded flex items-center gap-1 font-sans text-[10px] font-semibold uppercase"
                    style={{ backgroundColor: conf.bg, color: conf.color }}
                  >
                    <LevelIcon size={10} />
                    {log.level}
                  </span>
                  <div className="min-w-0">
                    <p className="font-sans text-sm truncate" style={{ color: 'var(--text-primary)' }}>
                      {log.message}
                    </p>
                    <p className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
                      {log.source} • {timeAgo(log.timestamp)}
                      {isMuted && ' • resolved'}
                    </p>
                  </div>
                </div>

                {!log.resolved && !log.auto_resolved && (
                  <button
                    onClick={() => handleMarkResolved(log.id)}
                    className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded font-sans text-xs transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--success)')}
                    onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    title="Mark resolved"
                  >
                    <Check size={12} />
                    Resolve
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
