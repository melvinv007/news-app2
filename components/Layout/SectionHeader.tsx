/**
 * components/Layout/SectionHeader.tsx
 * ─────────────────────────────────────────────────────────────────
 * Reusable section header for each category page. Renders the section
 * title in Bricolage Grotesque display font with an optional subtitle,
 * "last updated" timestamp, and right-side action slot.
 *
 * How to use: <SectionHeader title="World" subtitle="Personalised for you" lastUpdated={isoString} />
 * Used by: All category pages (world, india, mumbai, ai-tech, etc.)
 */

'use client';

import { type ReactNode, type ReactElement, useState, useEffect } from 'react';

type SectionHeaderProps = {
  /** Section title displayed in display font */
  title: string;
  /** Optional subtitle / description below the title */
  subtitle?: string;
  /** Optional ISO string — shows "Last updated: X min ago" */
  lastUpdated?: string | null;
  /** Optional slot for action buttons (e.g. filter, refresh) */
  action?: ReactNode;
};

function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'just now';
  const mins = Math.floor(diff / 60);
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}

export default function SectionHeader({
  title,
  subtitle,
  lastUpdated,
  action,
}: SectionHeaderProps): ReactElement {
  const [timeAgo, setTimeAgo] = useState<string>('');

  useEffect(() => {
    if (!lastUpdated) return;
    setTimeAgo(formatTimeAgo(lastUpdated));
    const interval = setInterval(() => {
      setTimeAgo(formatTimeAgo(lastUpdated));
    }, 60_000);
    return () => clearInterval(interval);
  }, [lastUpdated]);

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div>
        <h1
          className="font-display text-xl font-bold leading-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          {title}
        </h1>
        {subtitle && (
          <p
            className="font-sans text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            {subtitle}
          </p>
        )}
        {lastUpdated && timeAgo && (
          <p
            className="font-sans text-xs mt-0.5"
            style={{ color: 'var(--text-muted)' }}
          >
            Last updated: {timeAgo}
          </p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
