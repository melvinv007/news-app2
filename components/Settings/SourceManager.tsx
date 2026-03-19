/**
 * components/Settings/SourceManager.tsx
 * ─────────────────────────────────────────────────────────────────
 * Source management panel. Shows all RSS sources with status dots,
 * enable/disable toggles, and inline URL editing.
 *
 * Loads SOURCES from config + user_preferences for overrides.
 * Category filter tabs at top.
 * Status dot: green = recent success log, red = recent failure.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/settings/sources/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { SOURCES, type NewsSource } from '@/config/sources';
import {
  Globe,
  Circle,
  Pencil,
  Check,
  Loader2,
} from 'lucide-react';
import type { UserPreferences } from '@/lib/supabase/types';

type MergedSource = NewsSource & {
  isDisabled: boolean;
  urlOverride: string | null;
  hasRecentSuccess: boolean;
};

const CATEGORIES = [
  { label: 'All',       value: 'all' },
  { label: 'World',     value: 'world' },
  { label: 'India',     value: 'india' },
  { label: 'Mumbai',    value: 'mumbai' },
  { label: 'Sports',    value: 'sports' },
  { label: 'AI/Tech',   value: 'ai-tech' },
  { label: 'Business',  value: 'business' },
  { label: 'Stocks',    value: 'stocks' },
];

export default function SourceManager(): React.ReactElement {
  const [sources, setSources] = useState<MergedSource[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [editingUrl, setEditingUrl] = useState<string | null>(null);
  const [editUrlValue, setEditUrlValue] = useState('');
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);

  const fetchData = useCallback(async (): Promise<void> => {
    const supabase = createClient();

    // Fetch user preferences
    const { data: prefsData } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1)
      .single();

    const userPrefs = prefsData as UserPreferences | null;
    setPrefs(userPrefs);

    const disabledSources = userPrefs?.disabled_sources ?? [];
    const urlOverrides = userPrefs?.source_url_overrides ?? {};

    // Get recent success logs
    const { data: recentLogs } = await supabase
      .from('system_logs')
      .select('source')
      .eq('level', 'info')
      .ilike('message', '%success%')
      .gte('timestamp', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(100);

    const successfulSources = new Set(
      ((recentLogs ?? []) as { source: string }[]).map((l) => l.source),
    );

    const merged: MergedSource[] = SOURCES.map((src) => ({
      ...src,
      isDisabled: disabledSources.includes(src.name),
      urlOverride: urlOverrides[src.name] ?? null,
      hasRecentSuccess: successfulSources.has(src.name),
    }));

    setSources(merged);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const updatePrefs = async (updates: Partial<UserPreferences>): Promise<void> => {
    setSaving(true);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_preferences') as any).update(updates).eq('id', prefs?.id ?? 1);
    setSaving(false);
  };

  const handleToggle = async (sourceName: string): Promise<void> => {
    const currentDisabled = prefs?.disabled_sources ?? [];
    const isCurrentlyDisabled = currentDisabled.includes(sourceName);
    const newDisabled = isCurrentlyDisabled
      ? currentDisabled.filter((s) => s !== sourceName)
      : [...currentDisabled, sourceName];

    setSources((prev) =>
      prev.map((s) => (s.name === sourceName ? { ...s, isDisabled: !s.isDisabled } : s)),
    );

    await updatePrefs({ disabled_sources: newDisabled });
  };

  const handleUrlSave = async (sourceName: string): Promise<void> => {
    const currentOverrides = prefs?.source_url_overrides ?? {};
    const newOverrides = { ...currentOverrides };

    if (editUrlValue.trim()) {
      newOverrides[sourceName] = editUrlValue.trim();
    } else {
      delete newOverrides[sourceName];
    }

    setSources((prev) =>
      prev.map((s) =>
        s.name === sourceName
          ? { ...s, urlOverride: editUrlValue.trim() || null }
          : s,
      ),
    );

    await updatePrefs({ source_url_overrides: newOverrides });
    setEditingUrl(null);
  };

  const filtered = activeCategory === 'all'
    ? sources
    : sources.filter((s) =>
       activeCategory === 'sports'
          ? s.category.startsWith('sports')
          : activeCategory === 'stocks'
            ? s.category.startsWith('stocks')
            : s.category === activeCategory,
      );

  if (loading) {
    return (
      <div className="rounded-xl p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg shimmer" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl p-4 md:p-5" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      {/* Category tabs */}
      <div className="flex flex-wrap gap-1 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setActiveCategory(cat.value)}
            className="px-2.5 py-1 rounded-lg font-sans text-xs font-medium transition-colors"
            style={{
              backgroundColor: activeCategory === cat.value ? 'var(--accent)' : 'var(--bg-tertiary)',
              color: activeCategory === cat.value ? 'var(--bg-primary)' : 'var(--text-muted)',
            }}
          >
            {cat.label}
          </button>
        ))}
        {saving && <Loader2 size={14} className="animate-spin ml-2 self-center" style={{ color: 'var(--accent)' }} />}
      </div>

      {/* Source rows */}
      <div className="space-y-1.5">
        {filtered.map((src) => (
          <div
            key={src.name}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg"
            style={{
              backgroundColor: 'var(--bg-primary)',
              opacity: src.isDisabled ? 0.5 : 1,
            }}
          >
            <div className="flex items-center gap-2.5 min-w-0 flex-1">
              {/* Status dot */}
              <Circle
                size={8}
                fill={src.hasRecentSuccess ? 'var(--success)' : 'var(--error)'}
                style={{ color: src.hasRecentSuccess ? 'var(--success)' : 'var(--error)' }}
                className="flex-shrink-0"
              />

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-sans text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    {src.name}
                  </p>
                  <span className="px-1.5 py-0.5 rounded font-sans text-[10px]" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
                    P{src.priority}
                  </span>
                </div>

                {/* URL display / editor */}
                {editingUrl === src.name ? (
                  <div className="flex items-center gap-1 mt-1">
                    <input
                      type="text"
                      value={editUrlValue}
                      onChange={(e) => setEditUrlValue(e.target.value)}
                      onBlur={() => handleUrlSave(src.name)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleUrlSave(src.name); }}
                      className="flex-1 px-2 py-1 rounded font-mono text-xs border-none outline-none"
                      style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
                      autoFocus
                    />
                    <button onClick={() => handleUrlSave(src.name)}>
                      <Check size={12} style={{ color: 'var(--success)' }} />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="font-mono text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                      {src.urlOverride ?? src.url}
                    </p>
                    <button
                      onClick={() => {
                        setEditingUrl(src.name);
                        setEditUrlValue(src.urlOverride ?? src.url);
                      }}
                      className="flex-shrink-0"
                    >
                      <Pencil size={10} style={{ color: 'var(--text-muted)' }} />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Toggle */}
            <button
              onClick={() => handleToggle(src.name)}
              className="flex-shrink-0 w-10 h-5 rounded-full transition-colors relative ml-2"
              style={{
                backgroundColor: src.isDisabled ? 'var(--bg-tertiary)' : 'var(--accent)',
              }}
            >
              <span
                className="absolute top-0.5 w-4 h-4 rounded-full transition-all"
                style={{
                  backgroundColor: 'var(--bg-primary)',
                  left: src.isDisabled ? '2px' : '22px',
                }}
              />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
