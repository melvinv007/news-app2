/**
 * components/ArticleCard/SourceChip.tsx
 * ─────────────────────────────────────────────────────────────────
 * Displays the article source with an optional logo and relative time.
 * Compact chip format: [logo 20px] [Source name] • [time ago]
 *
 * How to change chip style: Edit this file only.
 * Used by: components/ArticleCard/index.tsx
 */

import { Newspaper } from 'lucide-react';

type SourceChipProps = {
  /** Name of the news source (e.g. "BBC World") */
  sourceName: string;
  /** Optional URL for the source logo/favicon */
  logoUrl?: string | null;
  /** ISO date string for computing relative time */
  publishedAt: string;
};

function getRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = now - then;
  const minutes = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days = Math.floor(diffMs / 86_400_000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  });
}

export default function SourceChip({
  sourceName,
  logoUrl,
  publishedAt,
}: SourceChipProps): React.ReactElement {
  return (
    <div className="flex items-center gap-1.5 font-sans text-xs font-medium min-w-0">
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={`${sourceName} logo`}
          className="w-5 h-5 rounded-full object-cover flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />
      ) : (
        <div
          className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <Newspaper size={12} style={{ color: 'var(--text-muted)' }} />
        </div>
      )}
      <span className="truncate" style={{ color: 'var(--text-muted)' }}>
        {sourceName}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>•</span>
      <span className="flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
        {getRelativeTime(publishedAt)}
      </span>
    </div>
  );
}
