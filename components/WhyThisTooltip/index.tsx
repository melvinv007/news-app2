/**
 * components/WhyThisTooltip/index.tsx
 * ─────────────────────────────────────────────────────────────────
 * "Why am I seeing this?" tooltip. Built on @radix-ui/react-tooltip
 * for automatic positioning that never goes off-screen.
 *
 * Shows a small "Why?" text button in muted text.
 * On hover: fetches /api/why-this?articleId=xxx and shows result.
 * Caches the result in component state after first fetch.
 *
 * How to change tooltip style: Edit this file.
 * Used by: components/ArticleCard/index.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Loader2 } from 'lucide-react';

type WhyThisTooltipProps = {
  /** Article ID to query why-this for */
  articleId: string;
};

export default function WhyThisTooltip({
  articleId,
}: WhyThisTooltipProps): React.ReactElement {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [fetched, setFetched] = useState<boolean>(false);

  const handleOpen = useCallback(
    async (open: boolean): Promise<void> => {
      if (!open || fetched) return;

      setLoading(true);
      try {
        const res = await fetch(`/api/why-this?articleId=${articleId}`);
        if (res.ok) {
          const data = (await res.json()) as { text: string };
          setText(data.text);
        } else {
          setText('Recommended for you.');
        }
      } catch {
        setText('Recommended for you.');
      } finally {
        setLoading(false);
        setFetched(true);
      }
    },
    [articleId, fetched],
  );

  return (
    <Tooltip.Provider delayDuration={300}>
      <Tooltip.Root onOpenChange={handleOpen}>
        <Tooltip.Trigger asChild>
          <button
            className="font-sans text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--accent)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            onClick={(e) => e.stopPropagation()}
          >
            Why?
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="max-w-xs px-3 py-2 rounded-lg shadow-lg font-sans text-xs leading-relaxed z-[60]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-secondary)',
              border: '1px solid var(--bg-tertiary)',
            }}
            sideOffset={4}
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2
                  size={12}
                  className="animate-spin"
                  style={{ color: 'var(--accent)' }}
                />
                <span style={{ color: 'var(--text-muted)' }}>Loading…</span>
              </div>
            ) : (
              <span>{text ?? 'Recommended for you.'}</span>
            )}
            <Tooltip.Arrow
              style={{ fill: 'var(--bg-secondary)' }}
            />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
