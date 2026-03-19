/**
 * components/ReadingMode/StoryTimeline.tsx
 * ─────────────────────────────────────────────────────────────────
 * Vertical timeline showing the evolution of a story across sources.
 * Only renders when source_count >= 2 (i.e., multiple outlets cover it).
 *
 * Each entry shows: source name + date, connected by a vertical line
 * with dots at each node.
 *
 * How to change timeline style: Edit this file only.
 * Used by: components/ReadingMode/index.tsx
 */

import type { StorySource } from '@/lib/supabase/types';

type StoryTimelineProps = {
  /** Array of story sources sorted by added_at ascending */
  sources: StorySource[];
};

function formatDate(dateString: string): string {
  const d = new Date(dateString);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / 86_400_000);

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function StoryTimeline({
  sources,
}: StoryTimelineProps): React.ReactElement | null {
  if (sources.length < 2) return null;

  // Sort by added_at ascending (earliest first)
  const sorted = [...sources].sort(
    (a, b) => new Date(a.added_at).getTime() - new Date(b.added_at).getTime(),
  );

  return (
    <div>
      <span
        className="font-sans text-xs font-semibold uppercase tracking-wider block mb-4"
        style={{ color: 'var(--text-muted)' }}
      >
        Story Timeline
      </span>
      <div className="relative pl-6">
        {/* Vertical line */}
        <div
          className="absolute left-[7px] top-2 bottom-2 w-px"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        />

        {sorted.map((source, index) => (
          <div key={source.id} className="relative flex items-start gap-3 pb-4 last:pb-0">
            {/* Dot */}
            <div
              className="absolute left-[-17px] top-1.5 w-[9px] h-[9px] rounded-full border-2 flex-shrink-0"
              style={{
                borderColor: index === sorted.length - 1 ? 'var(--accent)' : 'var(--text-muted)',
                backgroundColor: index === sorted.length - 1 ? 'var(--accent)' : 'transparent',
              }}
            />
            {/* Content */}
            <div className="min-w-0">
              <a
                href={source.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-sans text-sm font-medium hover:underline"
                style={{ color: 'var(--text-primary)' }}
              >
                {source.source_name}
              </a>
              <p
                className="font-sans text-xs mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                {formatDate(source.added_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
