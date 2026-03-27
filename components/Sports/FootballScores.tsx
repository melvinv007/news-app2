'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, RefreshCw, Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

type StandingRow = {
  position: number;
  team: { name?: string; crest?: string; shortName?: string } | string;
  playedGames?: number;
  played?: number;
  won: number;
  draw?: number;
  drawn?: number;
  lost: number;
  points: number;
};

type LeagueData = {
  league_code: string;
  league_name: string;
  standings: { standings?: [{ table: StandingRow[] }] }; // structure varies, we'll traverse safely
  updated_at: string;
};

const TABS = [
  { code: 'PL', label: 'Premier League' },
  { code: 'CL', label: 'Champions League' },
  { code: 'PD', label: 'La Liga' },
  { code: 'BL1', label: 'Bundesliga' },
  { code: 'SA', label: 'Serie A' },
];

function getTimeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)} days ago`;
}

function getTeamName(team: StandingRow['team']): string {
  if (typeof team === 'string') return team;
  return team?.shortName || team?.name || 'Unknown';
}

export default function FootballScores(): React.ReactElement {
  const [data, setData] = useState<LeagueData[]>([]);
  const [activeTab, setActiveTab] = useState('PL');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStandings = useCallback(async () => {
    const supabase = createClient();
    const { data: fetchedData, error } = await supabase
      .from('football_standings')
      .select('*')
      .order('updated_at', { ascending: false });

    if (!error && fetchedData) {
      setData(fetchedData as LeagueData[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStandings();
  }, [fetchStandings]);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetch('/api/refresh-football', { method: 'POST' });
      await fetchStandings();
    } catch (e) {
      console.error(e);
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-4 h-4 rounded shimmer" />
          <div className="h-3 w-32 rounded shimmer" />
        </div>
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-2 mb-3">
          <Trophy size={16} className="text-[var(--accent)]" />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            Football Standings
          </span>
        </div>
        <div className="flex items-center gap-2 py-4 justify-center text-[var(--text-muted)]">
          <AlertCircle size={16} />
          <span className="font-sans text-sm">Standings unavailable</span>
        </div>
      </div>
    );
  }

  const activeLeague = data.find(d => d.league_code === activeTab);
  
  // Safely extract the table array based on common football-data.org structure
  let table: StandingRow[] = [];
  if (activeLeague?.standings) {
    const s = activeLeague.standings as any;
    if (Array.isArray(s)) table = s;
    else if (s.standings && Array.isArray(s.standings) && s.standings[0]?.table) {
      table = s.standings[0].table;
    } else if (s.table && Array.isArray(s.table)) {
      table = s.table;
    } else if (s.response && Array.isArray(s.response) && s.response[0]?.league?.standings) {
      table = s.response[0].league.standings[0];
    }
  }

  return (
    <div className="rounded-xl overflow-hidden flex flex-col pt-4 md:pt-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 md:px-5 mb-3">
        <div className="flex items-center gap-2">
          <Trophy size={16} style={{ color: 'var(--accent)' }} />
          <span className="font-sans text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Football Standings
          </span>
        </div>
        <div className="flex items-center gap-3">
          {activeLeague && (
            <span className="font-mono text-xs text-[var(--text-muted)] hidden md:inline-block">
              Last updated: {getTimeAgo(activeLeague.updated_at)}
            </span>
          )}
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="p-1.5 rounded-md transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-50"
          >
            {refreshing ? <Loader2 size={16} className="animate-spin text-[var(--text-muted)]" /> : <RefreshCw size={16} className="text-[var(--text-muted)]" />}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto hide-scrollbar px-2 mb-2 border-b border-[var(--border)]">
        {TABS.map(tab => (
          <button
            key={tab.code}
            onClick={() => setActiveTab(tab.code)}
            className="px-3 py-2 whitespace-nowrap text-sm font-medium transition-colors border-b-2"
            style={{
              color: activeTab === tab.code ? 'var(--accent)' : 'var(--text-muted)',
              borderColor: activeTab === tab.code ? 'var(--accent)' : 'transparent',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Standings Table */}
      <div className="overflow-x-auto pb-4 px-4 md:px-5">
        <table className="w-full text-sm text-left whitespace-nowrap">
          <thead>
            <tr className="text-[10px] uppercase font-semibold text-[var(--text-muted)] border-b border-[var(--border)]">
              <th className="py-2 pl-2 pr-4 font-mono font-medium tracking-wider">Pos</th>
              <th className="py-2 pr-4 tracking-wider">Team</th>
              <th className="py-2 px-2 text-center tracking-wider">P</th>
              <th className="py-2 px-2 text-center tracking-wider text-emerald-500/80">W</th>
              <th className="py-2 px-2 text-center tracking-wider text-amber-500/80">D</th>
              <th className="py-2 px-2 text-center tracking-wider text-red-500/80">L</th>
              <th className="py-2 pl-2 pr-2 text-right tracking-wider">Pts</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]/50">
            {table && table.length > 0 ? table.map((row) => (
              <tr key={`${getTeamName(row.team)}-${row.position}`} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                <td className="py-2.5 pl-2 pr-4 font-mono text-xs text-[var(--text-secondary)]">{row.position}</td>
                <td className="py-2.5 pr-4 font-semibold text-[var(--text-primary)] max-w-[150px] truncate">
                  {getTeamName(row.team)}
                </td>
                <td className="py-2.5 px-2 text-center text-xs text-[var(--text-muted)]">{row.playedGames ?? row.played ?? 0}</td>
                <td className="py-2.5 px-2 text-center text-xs text-[var(--text-muted)]">{row.won ?? 0}</td>
                <td className="py-2.5 px-2 text-center text-xs text-[var(--text-muted)]">{row.draw ?? row.drawn ?? 0}</td>
                <td className="py-2.5 px-2 text-center text-xs text-[var(--text-muted)]">{row.lost ?? 0}</td>
                <td className="py-2.5 pl-2 pr-2 text-right font-bold text-[var(--accent)]">{row.points ?? 0}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan={7} className="py-6 text-center text-[var(--text-muted)] text-sm">
                  No data available for this league.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
