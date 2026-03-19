/**
 * components/ArticleCard/ActionBar.tsx
 * ─────────────────────────────────────────────────────────────────
 * Article interaction buttons: Like, Dislike, Mark Read, Track.
 * Each button POSTs to /api/interactions with { action, article_id }.
 *
 * Framer Motion whileTap={{ scale: 0.9 }} on every button.
 * Small amber spinner replaces icon while action is pending.
 * Source count shown on the right side.
 *
 * How to add an action: Add to ACTIONS array + handle in API route.
 * Used by: components/ArticleCard/index.tsx
 */

'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
  Pin,
  Loader2,
  Layers,
  type LucideIcon,
} from 'lucide-react';

type ActionType = 'like' | 'dislike' | 'read' | 'track';

type ActionDef = {
  action: ActionType;
  icon: LucideIcon;
  label: string;
  activeColor: string;
};

const ACTIONS: ActionDef[] = [
  { action: 'like',    icon: ThumbsUp,      label: 'Like',    activeColor: 'var(--accent)' },
  { action: 'dislike', icon: ThumbsDown,    label: 'Dislike', activeColor: 'var(--error)' },
  { action: 'read',    icon: CheckCircle2,  label: 'Read',    activeColor: 'var(--success)' },
  { action: 'track',   icon: Pin,           label: 'Track',   activeColor: 'var(--accent)' },
];

const tapAnimation = { scale: 0.9 };
const springTransition = { type: 'spring' as const, stiffness: 400, damping: 20 };

type ActionBarProps = {
  /** Article ID for the API call */
  articleId: string;
  /** Number of sources covering this story */
  sourceCount: number;
  /** Currently active actions for this article (e.g. already liked) */
  activeActions?: ActionType[];
  /** Callback when source count badge is clicked */
  onViewSources?: () => void;
};

export default function ActionBar({
  articleId,
  sourceCount,
  activeActions = [],
  onViewSources,
}: ActionBarProps): React.ReactElement {
  const [pending, setPending] = useState<ActionType | null>(null);
  const [active, setActive] = useState<Set<ActionType>>(new Set(activeActions));

  const handleAction = useCallback(
    async (action: ActionType): Promise<void> => {
      if (pending) return; // prevent double-clicks
      setPending(action);

      try {
        const response = await fetch('/api/interactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, article_id: articleId }),
        });

        if (response.ok) {
          setActive((prev) => {
            const next = new Set(prev);
            if (next.has(action)) {
              next.delete(action);
            } else {
              // Like and dislike are mutually exclusive
              if (action === 'like') next.delete('dislike');
              if (action === 'dislike') next.delete('like');
              next.add(action);
            }
            return next;
          });
        }
      } catch {
        // Silently fail — graceful degrade
      } finally {
        setPending(null);
      }
    },
    [articleId, pending],
  );

  return (
    <div className="flex items-center justify-between pt-2">
      {/* Action buttons */}
      <div className="flex items-center gap-1">
        {ACTIONS.map(({ action, icon: Icon, label, activeColor }) => {
          const isActive = active.has(action);
          const isPending = pending === action;

          return (
            <motion.button
              key={action}
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                handleAction(action);
              }}
              whileTap={tapAnimation}
              transition={springTransition}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors"
              style={{
                color: isActive ? activeColor : 'var(--text-muted)',
                backgroundColor: isActive ? 'var(--accent-subtle)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              }}
              onMouseLeave={(e) => {
                if (!isActive) e.currentTarget.style.backgroundColor = 'transparent';
              }}
              disabled={isPending}
              aria-label={label}
              title={label}
            >
              {isPending ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                  style={{ color: 'var(--accent)' }}
                />
              ) : (
                <Icon size={16} strokeWidth={isActive ? 2.4 : 1.8} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Source count */}
      {sourceCount > 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewSources?.();
          }}
          className="flex items-center gap-1 px-2 py-1 rounded-lg font-sans text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
            e.currentTarget.style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <Layers size={14} />
          <span>{sourceCount} sources</span>
        </button>
      )}
    </div>
  );
}
