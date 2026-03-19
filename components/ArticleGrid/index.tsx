/**
 * components/ArticleGrid/index.tsx
 * ─────────────────────────────────────────────────────────────────
 * Responsive article grid: 2-column on desktop, 1-column on mobile.
 * Uses Framer Motion stagger for card entrance animations and
 * AnimatePresence for new articles popping in via Realtime.
 *
 * Shows SkeletonCard placeholders while loading.
 * Shows empty state when no articles are available.
 *
 * How to change grid columns: Adjust the grid-cols classes below.
 * Used by: All category pages (world, india, mumbai, etc.)
 */

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import type { Article } from '@/lib/supabase/types';
import SkeletonCard from '@/components/ArticleGrid/SkeletonCard';
import ArticleCard from '@/components/ArticleCard';
import { Newspaper } from 'lucide-react';

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 400,
      damping: 30,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.15 },
  },
};

type ArticleGridProps = {
  /** Articles to display in the grid */
  articles: Article[];
  /** Whether articles are currently loading */
  loading: boolean;
  /** Whether to show thumbnails on cards */
  showThumbnails?: boolean;
  /** Callback when a card body is clicked to open reading mode */
  onOpenReadingMode: (article: Article) => void;
};

export default function ArticleGrid({
  articles,
  loading,
  showThumbnails = false,
  onOpenReadingMode,
}: ArticleGridProps): React.ReactElement {
  // Loading state — show 4 skeleton cards
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Empty state
  if (articles.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'var(--bg-secondary)' }}
        >
          <Newspaper size={32} style={{ color: 'var(--text-muted)' }} />
        </div>
        <div className="text-center">
          <p
            className="font-display text-lg font-semibold"
            style={{ color: 'var(--text-primary)' }}
          >
            No articles yet
          </p>
          <p
            className="font-sans text-sm mt-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Check back soon
          </p>
        </div>
        {/* Ghost skeleton outlines for visual structure */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 w-full mt-4 opacity-30">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-dashed p-4 md:p-5 h-48"
              style={{ borderColor: 'var(--bg-tertiary)' }}
            />
          ))}
        </div>
      </div>
    );
  }

  // Populated grid with stagger entrance
  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence mode="popLayout">
        {articles.map((article) => (
          <motion.div
            key={article.id}
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <ArticleCard
              article={article}
              showThumbnail={showThumbnails}
              onOpenReadingMode={onOpenReadingMode}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
}
