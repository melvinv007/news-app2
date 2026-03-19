/**
 * components/ReadingMode/FullArticle.tsx
 * ─────────────────────────────────────────────────────────────────
 * Renders the cleaned full article text in Lora serif.
 * If full_content is null (not yet extracted), shows a fallback
 * message with a link to the original URL.
 *
 * How to change article rendering: Edit this file only.
 * Used by: components/ReadingMode/index.tsx
 */

import { ExternalLink } from 'lucide-react';

type FullArticleProps = {
  /** Cleaned full article text (null if extraction hasn't run) */
  fullContent: string | null;
  /** Original article URL for fallback link */
  originalUrl: string;
};

export default function FullArticle({
  fullContent,
  originalUrl,
}: FullArticleProps): React.ReactElement {
  if (!fullContent) {
    return (
      <div
        className="rounded-xl p-6 text-center"
        style={{ backgroundColor: 'var(--bg-tertiary)' }}
      >
        <p
          className="font-sans text-sm mb-3"
          style={{ color: 'var(--text-muted)' }}
        >
          Full article unavailable
        </p>
        <a
          href={originalUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg font-sans text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--accent)',
            color: 'var(--bg-primary)',
          }}
        >
          Read on original site
          <ExternalLink size={14} />
        </a>
      </div>
    );
  }

  return (
    <div className="font-serif text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text-secondary)' }}>
      {fullContent}
    </div>
  );
}
