/**
 * components/Settings/PromptViewer.tsx
 * ─────────────────────────────────────────────────────────────────
 * AI prompt editor. Loads DEFAULT_PROMPTS from config and custom
 * overrides from user_preferences. Each prompt is editable.
 *
 * "Save" → update correct column in user_preferences.
 * "Reset to default" → set column to null.
 * Shows which model uses each prompt.
 *
 * How to change: Edit this file only.
 * Used by: app/(app)/settings/prompts/page.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  DEFAULT_PROMPTS,
  PROMPT_LABELS,
  MODEL_ASSIGNMENTS,
} from '@/config/ai';
import { Save, RotateCcw, Loader2, Cpu } from 'lucide-react';
import type { UserPreferences } from '@/lib/supabase/types';

type PromptKey = keyof typeof DEFAULT_PROMPTS;

/** Map prompt keys to the user_preferences column that stores the custom override */
const PREF_COLUMN_MAP: Record<PromptKey, keyof UserPreferences | null> = {
  fingerprint:      null, // No custom override column
  summarize:        'custom_summary_prompt',
  watchlistConfirm: null,
  whyThis:          'custom_whythis_prompt',
  stockTicker:      null,
  watchlistKeywords:'custom_watchlist_prompt',
};

/** Map prompt keys to the model assignment key for display */
const MODEL_MAP: Record<PromptKey, string> = {
  fingerprint:      MODEL_ASSIGNMENTS.fingerprinting,
  summarize:        MODEL_ASSIGNMENTS.summarization,
  watchlistConfirm: MODEL_ASSIGNMENTS.watchlistConfirmation,
  whyThis:          MODEL_ASSIGNMENTS.whyThisTooltip,
  stockTicker:      MODEL_ASSIGNMENTS.stockTickerMatch,
  watchlistKeywords:MODEL_ASSIGNMENTS.summarization,
};

export default function PromptViewer(): React.ReactElement {
  const [prefs, setPrefs] = useState<UserPreferences | null>(null);
  const [values, setValues] = useState<Record<PromptKey, string>>({} as Record<PromptKey, string>);
  const [saving, setSaving] = useState<PromptKey | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchPrefs = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data } = await supabase
      .from('user_preferences')
      .select('*')
      .limit(1)
      .single();

    const userPrefs = data as UserPreferences | null;
    setPrefs(userPrefs);

    // Initialize values: custom override if set, else default
    const initial: Record<string, string> = {};
    for (const key of Object.keys(DEFAULT_PROMPTS) as PromptKey[]) {
      const col = PREF_COLUMN_MAP[key];
      const customValue = col && userPrefs ? (userPrefs[col] as string | null) : null;
      initial[key] = customValue ?? DEFAULT_PROMPTS[key];
    }
    setValues(initial as Record<PromptKey, string>);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchPrefs();
  }, [fetchPrefs]);

  const handleSave = async (key: PromptKey): Promise<void> => {
    const col = PREF_COLUMN_MAP[key];
    if (!col) return; // No override column available

    setSaving(key);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_preferences') as any)
      .update({ [col]: values[key] })
      .eq('id', prefs?.id ?? 1);
    setSaving(null);
  };

  const handleReset = async (key: PromptKey): Promise<void> => {
    const col = PREF_COLUMN_MAP[key];
    if (!col) return;

    setValues((prev) => ({ ...prev, [key]: DEFAULT_PROMPTS[key] }));
    setSaving(key);
    const supabase = createClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from('user_preferences') as any)
      .update({ [col]: null })
      .eq('id', prefs?.id ?? 1);
    setSaving(null);
  };

  const promptKeys = Object.keys(DEFAULT_PROMPTS) as PromptKey[];

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl p-5 shimmer h-40" style={{ backgroundColor: 'var(--bg-secondary)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {promptKeys.map((key) => {
        const canEdit = PREF_COLUMN_MAP[key] !== null;
        const isModified = values[key] !== DEFAULT_PROMPTS[key];

        return (
          <div
            key={key}
            className="rounded-xl p-4 md:p-5"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="font-sans text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                  {PROMPT_LABELS[key]}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <Cpu size={10} style={{ color: 'var(--text-muted)' }} />
                  <span className="font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    {MODEL_MAP[key]}
                  </span>
                  {isModified && (
                    <span
                      className="px-1.5 py-0.5 rounded-full font-sans text-[10px] font-semibold"
                      style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
                    >
                      Modified
                    </span>
                  )}
                </div>
              </div>

              {canEdit && (
                <div className="flex items-center gap-1.5">
                  {isModified && (
                    <button
                      onClick={() => handleReset(key)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-sans text-xs transition-colors"
                      style={{ color: 'var(--text-muted)' }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--error)')}
                      onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
                    >
                      <RotateCcw size={12} />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => handleSave(key)}
                    disabled={saving === key}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors"
                    style={{ backgroundColor: 'var(--accent)', color: 'var(--bg-primary)' }}
                  >
                    {saving === key ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Save size={12} />
                    )}
                    Save
                  </button>
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              value={values[key] ?? ''}
              onChange={(e) => setValues((prev) => ({ ...prev, [key]: e.target.value }))}
              readOnly={!canEdit}
              rows={6}
              className="w-full rounded-lg px-3 py-2.5 font-mono text-xs leading-relaxed resize-y border-none outline-none"
              style={{
                backgroundColor: 'var(--bg-primary)',
                color: canEdit ? 'var(--text-secondary)' : 'var(--text-muted)',
              }}
            />
            {!canEdit && (
              <p className="font-sans text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                This prompt is not user-customizable.
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
