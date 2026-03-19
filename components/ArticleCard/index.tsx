/**
 * components/ArticleCard/index.tsx
 * ─────────────────────────────────────────────────────────────────
 * Main article card. Medium density: headline (2 lines) + 2-line summary
 * + source chip + optional thumbnail + tags + stock badges + action bar.
 *
 * Interactions:
 *   Hover:  bg-tertiary + scale(1.01) spring animation
 *   Click:  card body calls onOpenReadingMode (not action buttons)
 *   Update: amber left border when has_update = true
 *   Read:   opacity-60 when marked as read
 *
 * How to change card layout: Edit the JSX structure below.
 * Used by: components/ArticleGrid/index.tsx
 */

'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Bookmark } from 'lucide-react';
import type { Article } from '@/lib/supabase/types';
import SourceChip from '@/components/ArticleCard/SourceChip';
import StockBadge from '@/components/ArticleCard/StockBadge';
import ActionBar from '@/components/ArticleCard/ActionBar';
import WhyThisTooltip from '@/components/WhyThisTooltip';

const hoverSpring = {
  type: 'spring' as const,
  stiffness: 400,
  damping: 30,
};

type ArticleCardProps = {
  /** The article data to render */
  article: Article;
  /** Whether to show the thumbnail image */
  showThumbnail?: boolean;
  /** Callback when card body is clicked to open reading mode */
  onOpenReadingMode: (article: Article) => void;
};

export default function ArticleCard({
  article,
  showThumbnail = false,
  onOpenReadingMode,
}: ArticleCardProps): React.ReactElement {
  const [isHovered, setIsHovered] = useState<boolean>(false);
  const isRead = false; // Will be connected to user_interactions later

  return (
    <motion.article
      className="rounded-xl p-4 md:p-5 cursor-pointer relative overflow-hidden"
      style={{
        backgroundColor: isHovered ? 'var(--bg-tertiary)' : 'var(--bg-secondary)',
        opacity: isRead ? 0.6 : 1,
        borderLeft: article.has_update ? '2px solid var(--accent)' : '2px solid transparent',
      }}
      animate={{ scale: isHovered ? 1.01 : 1 }}
      transition={hoverSpring}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onOpenReadingMode(article)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpenReadingMode(article);
        }
      }}
      aria-label={`Read article: ${article.title}`}
    >
      {/* Row 1: Source chip + badges */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <SourceChip
          sourceName={article.source_name}
          logoUrl={article.source_logo_url}
          publishedAt={article.published_at}
        />
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {article.has_update && (
            <span
              className="flex items-center gap-1 text-xs font-sans font-medium px-1.5 py-0.5 rounded-full"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
              }}
            >
              <RefreshCw size={10} />
              Updated
            </span>
          )}
          {article.watchlist_matches && article.watchlist_matches.length > 0 && (
            <span
              className="flex items-center gap-1 text-xs font-sans font-medium px-1.5 py-0.5 rounded-full"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
              }}
            >
              <Bookmark size={10} />
              Watchlist
            </span>
          )}
        </div>
      </div>

      {/* Row 2: Headline — max 2 lines */}
      <h2
        className="font-display text-base font-semibold leading-snug mb-1.5"
        style={{
          color: 'var(--text-primary)',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {article.title}
      </h2>

      {/* Row 3: Optional thumbnail */}
      {showThumbnail && article.source_logo_url && (
        <div
          className="w-full h-40 rounded-lg mb-2 overflow-hidden"
          style={{ backgroundColor: 'var(--bg-tertiary)' }}
        >
          <img
            src={article.source_logo_url}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Row 4: Summary — max 2 lines */}
      {article.summary && (
        <p
          className="font-serif text-sm leading-relaxed mb-2"
          style={{
            color: 'var(--text-secondary)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {article.summary}
        </p>
      )}

      {/* Row 5: Stock badges + topic tags + Why? tooltip */}
      <div className="flex flex-wrap items-center gap-1.5 mb-2">
        {article.stock_tickers?.map((ticker) => (
          <StockBadge key={ticker} ticker={ticker} />
        ))}
        {article.topic_tags?.map((tag) => (
          <span
            key={tag}
            className="inline-flex px-2 py-0.5 rounded-full font-sans text-xs"
            style={{
              backgroundColor: 'var(--bg-tertiary)',
              color: 'var(--text-muted)',
            }}
          >
            {tag}
          </span>
        ))}
        <WhyThisTooltip articleId={article.id} />
      </div>

      {/* Row 6: Action bar */}
      <ActionBar
        articleId={article.id}
        sourceCount={article.source_count}
      />
    </motion.article>
  );
}
