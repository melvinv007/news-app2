/**
 * components/ReadingMode/SourceList.tsx
 * ─────────────────────────────────────────────────────────────────
 * Row of source chips showing all outlets covering this story.
 * Each chip links to the original article URL (opens in new tab).
 *
 * How to change chip style: Edit this file only.
 * Used by: components/ReadingMode/index.tsx
 */

import { ExternalLink } from 'lucide-react';
import type { StorySource } from '@/lib/supabase/types';

type SourceListProps = {
  /** Array of story sources */
  sources: StorySource[];
};

export default function SourceList({
  sources,
}: SourceListProps): React.ReactElement | null {
  if (sources.length === 0) return null;

  return (
    <div>
      <span
        className="font-sans text-xs font-semibold uppercase tracking-wider block mb-3"
        style={{ color: 'var(--text-muted)' }}
      >
        Covered by
      </span>
      <div className="flex flex-wrap gap-2">
        {sources.map((source) => (
          <a
            key={source.id}
            href={source.source_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-sans text-xs font-medium transition-colors"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-secondary)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent-subtle)';
              e.currentTarget.style.color = 'var(--accent)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
              e.currentTarget.style.color = 'var(--text-secondary)';
            }}
          >
            {source.source_name}
            <ExternalLink size={10} />
          </a>
        ))}
      </div>
    </div>
  );
}
