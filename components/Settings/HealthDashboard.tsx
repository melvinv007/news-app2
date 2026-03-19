/**
 * components/Settings/HealthDashboard.tsx
 * ─────────────────────────────────────────────────────────────────
 * System health overview dashboard.
 *
 * Overall status: Green/Yellow/Red based on fetch recency.
 *   Green  = all sections fetched within 30 min
 *   Yellow = any section 30–60 min stale
 *   Red    = any section 60+ min stale
 *
 * Shows per-section last fetch time, API usage bars, and
 * a "Run fetcher now" button per section.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/settings/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Activity,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import type { SystemLog } from '@/lib/supabase/types';

type SectionStatus = {
  name: string;
  fetchKey: string;
  lastFetch: Date | null;
  staleness: 'fresh' | 'stale' | 'critical';
  logCount: number;
};

const SECTIONS = [
  { name: 'World',    fetchKey: 'fetch-world' },
  { name: 'Sports',   fetchKey: 'fetch-sports' },
  { name: 'AI/Tech',  fetchKey: 'fetch-aitech' },
  { name: 'Business', fetchKey: 'fetch-business' },
];

function getStaleness(lastFetch: Date | null): 'fresh' | 'stale' | 'critical' {
  if (!lastFetch) return 'critical';
  const diffMin = (Date.now() - lastFetch.getTime()) / 60_000;
  if (diffMin <= 30) return 'fresh';
  if (diffMin <= 60) return 'stale';
  return 'critical';
}

function timeAgo(date: Date): string {
  const diffMin = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (diffMin < 1) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const hours = Math.floor(diffMin / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const statusConfig = {
  fresh:    { icon: CheckCircle2,  color: 'var(--success)', label: 'All Systems Operational' },
  stale:    { icon: AlertTriangle, color: 'var(--accent)',  label: 'Some Sections Stale' },
  critical: { icon: XCircle,       color: 'var(--error)',   label: 'Sections Offline' },
};

export default function HealthDashboard(): React.ReactElement {
  const [sections, setSections] = useState<SectionStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningFetcher, setRunningFetcher] = useState<string | null>(null);

  const fetchHealth = useCallback(async (): Promise<void> => {
    const supabase = createClient();

    // Get latest 'info' logs with 'completed' in message per section
    const results: SectionStatus[] = [];

    for (const sec of SECTIONS) {
      const { data: logs } = await supabase
        .from('system_logs')
        .select('*')
        .eq('source', sec.fetchKey)
        .eq('level', 'info')
        .ilike('message', '%completed%')
        .order('timestamp', { ascending: false })
        .limit(1);

      const logList = (logs ?? []) as SystemLog[];
      const lastFetch = logList.length > 0 ? new Date(logList[0].timestamp) : null;

      // Count today's logs for this source
      const today = new Date().toISOString().split('T')[0];
      const { count } = await supabase
        .from('system_logs')
        .select('id', { count: 'exact', head: true })
        .eq('source', sec.fetchKey)
        .gte('timestamp', `${today}T00:00:00`);

      results.push({
        name: sec.name,
        fetchKey: sec.fetchKey,
        lastFetch,
        staleness: getStaleness(lastFetch),
        logCount: count ?? 0,
      });
    }

    setSections(results);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const handleRunFetcher = async (fetchKey: string): Promise<void> => {
    setRunningFetcher(fetchKey);
    try {
      const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
      const fnUrl = `${baseUrl}/functions/v1/${fetchKey}`;
      await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'x-cron-secret': 'manual-trigger',
          'Content-Type': 'application/json',
        },
      });
    } catch {
      // Best-effort trigger
    }
    setRunningFetcher(null);
    // Refetch health after a moment
    setTimeout(fetchHealth, 3000);
  };

  // Overall status
  const overallStaleness = sections.some((s) => s.staleness === 'critical')
    ? 'critical'
    : sections.some((s) => s.staleness === 'stale')
      ? 'stale'
      : 'fresh';

  const StatusIcon = statusConfig[overallStaleness].icon;
  const maxLogCount = Math.max(...sections.map((s) => s.logCount), 1);

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Overall status */}
      <div className="flex items-center gap-3 mb-5">
        <StatusIcon size={20} style={{ color: statusConfig[overallStaleness].color }} />
        <div>
          <p className="font-sans text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {statusConfig[overallStaleness].label}
          </p>
          <p className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
            {sections.filter((s) => s.staleness === 'fresh').length} / {sections.length} sections healthy
          </p>
        </div>
      </div>

      {/* Section rows */}
      <div className="space-y-2">
        {sections.map((sec) => {
          const sConf = statusConfig[sec.staleness];
          const SIcon = sConf.icon;

          return (
            <div
              key={sec.fetchKey}
              className="flex items-center justify-between px-3 py-3 rounded-lg"
              style={{ backgroundColor: 'var(--bg-primary)' }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <SIcon size={14} style={{ color: sConf.color }} />
                <div className="min-w-0">
                  <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {sec.name}
                  </p>
                  <p className="font-sans text-xs" style={{ color: 'var(--text-muted)' }}>
                    {sec.lastFetch ? `Last fetch: ${timeAgo(sec.lastFetch)}` : 'Never fetched'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* API usage bar */}
                <div className="w-20 hidden md:block">
                  <div className="h-1.5 rounded-full" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
                    <div
                      className="h-1.5 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (sec.logCount / maxLogCount) * 100)}%`,
                        backgroundColor: sConf.color,
                      }}
                    />
                  </div>
                  <p className="font-mono text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    {sec.logCount} calls
                  </p>
                </div>

                {/* Run fetcher button */}
                <button
                  onClick={() => handleRunFetcher(sec.fetchKey)}
                  disabled={runningFetcher === sec.fetchKey}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors"
                  style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-secondary)')}
                >
                  {runningFetcher === sec.fetchKey ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <RefreshCw size={12} />
                  )}
                  Run
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
