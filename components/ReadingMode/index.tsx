/**
 * components/ReadingMode/index.tsx
 * ─────────────────────────────────────────────────────────────────
 * Full article reading panel. Slides in from the right over the feed.
 * Built on @radix-ui/react-dialog for free focus trapping, ESC to close,
 * and screen reader support. Framer Motion for slide-in spring animation.
 *
 * Desktop: w-1/2 max-w-2xl, anchored right. Mobile: full screen.
 * Backdrop: dark overlay with backdrop-blur.
 *
 * Read timer:
 *   useRef(Date.now()) on open → POST /api/interactions with
 *   action='read' and read_time_seconds on close/unmount.
 *
 * On open: fetches story_sources from DB using article.id.
 *
 * Layout: Back ← | Open Original ↗  →  headline → source + date + read time
 *   → optional thumbnail → Summary → divider → FullArticle → divider
 *   → StoryTimeline (if source_count >= 2) → SourceList
 *
 * How to add sections to reading mode: Add below the existing sections.
 * Used by: All category pages (world, india, mumbai, etc.)
 */

'use client';

import { useRef, useEffect, useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ExternalLink, Clock } from 'lucide-react';
import type { Article, StorySource } from '@/lib/supabase/types';
import { createClient } from '@/lib/supabase/client';
import Summary from '@/components/ReadingMode/Summary';
import FullArticle from '@/components/ReadingMode/FullArticle';
import StoryTimeline from '@/components/ReadingMode/StoryTimeline';
import SourceList from '@/components/ReadingMode/SourceList';

const slideSpring = {
  type: 'spring' as const,
  stiffness: 300,
  damping: 30,
};

type ReadingModeProps = {
  /** The article to display, or null if closed */
  article: Article | null;
  /** Callback to close/dismiss reading mode */
  onClose: () => void;
};

function formatPublishedDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function estimateReadTime(text: string | null): string {
  if (!text) return '1 min read';
  const words = text.split(/\s+/).length;
  const minutes = Math.max(1, Math.ceil(words / 220));
  return `${minutes} min read`;
}

export default function ReadingMode({
  article,
  onClose,
}: ReadingModeProps): React.ReactElement {
  const openTimeRef = useRef<number>(0);
  const [storySources, setStorySources] = useState<StorySource[]>([]);

  // Track open time for read duration
  useEffect(() => {
    if (article) {
      openTimeRef.current = Date.now();
    }
  }, [article]);

  // Fetch story sources when article opens
  useEffect(() => {
    if (!article) {
      setStorySources([]);
      return;
    }

    async function fetchSources(): Promise<void> {
      const supabase = createClient();
      const { data } = await supabase
        .from('story_sources')
        .select('*')
        .eq('story_id', article!.id)
        .order('added_at', { ascending: true });

      if (data) {
        setStorySources(data);
      }
    }

    if (article.source_count >= 2) {
      fetchSources();
    }
  }, [article]);

  // Post read time on close
  const handleClose = useCallback((): void => {
    if (article && openTimeRef.current > 0) {
      const readTimeSeconds = Math.floor((Date.now() - openTimeRef.current) / 1000);
      // Fire-and-forget — don't block the close animation
      fetch('/api/interactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'read',
          article_id: article.id,
          read_time_seconds: readTimeSeconds,
        }),
      }).catch(() => {
        // Graceful degrade — silently fail
      });
      openTimeRef.current = 0;
    }
    onClose();
  }, [article, onClose]);

  const isOpen = article !== null;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <AnimatePresence>
        {isOpen && article && (
          <Dialog.Portal forceMount>
            {/* Backdrop */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(4px)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Panel */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed top-0 right-0 z-50 h-screen w-full md:w-1/2 md:max-w-2xl overflow-y-auto"
                style={{ backgroundColor: 'var(--bg-primary)' }}
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={slideSpring}
              >
                {/* Header */}
                <div
                  className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 md:px-6 border-b"
                  style={{
                    backgroundColor: 'var(--bg-primary)',
                    borderColor: 'var(--bg-tertiary)',
                  }}
                >
                  <button
                    onClick={handleClose}
                    className="flex items-center gap-1.5 font-sans text-sm font-medium rounded-lg px-2 py-1.5 transition-colors"
                    style={{ color: 'var(--text-muted)' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)';
                      e.currentTarget.style.color = 'var(--text-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-muted)';
                    }}
                  >
                    <ArrowLeft size={16} />
                    Back
                  </button>

                  <a
                    href={article.full_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-sans text-sm font-medium rounded-lg px-3 py-1.5 transition-colors"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--bg-primary)',
                    }}
                  >
                    Open Original
                    <ExternalLink size={14} />
                  </a>
                </div>

                {/* Content */}
                <div className="px-4 py-6 md:px-6 md:py-8 space-y-6">
                  {/* Headline */}
                  <h1
                    className="font-display text-2xl font-bold leading-tight"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {article.title}
                  </h1>

                  {/* Meta: source + date + read time */}
                  <div
                    className="flex flex-wrap items-center gap-2 font-sans text-sm"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {article.source_name}
                    </span>
                    <span>•</span>
                    <span>{formatPublishedDate(article.published_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      {estimateReadTime(article.full_content)}
                    </span>
                  </div>

                  {/* Optional thumbnail */}
                  {article.source_logo_url && (
                    <div
                      className="w-full h-56 rounded-xl overflow-hidden"
                      style={{ backgroundColor: 'var(--bg-secondary)' }}
                    >
                      <img
                        src={article.source_logo_url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}

                  {/* Summary */}
                  <Summary summary={article.summary} />

                  {/* Divider */}
                  <hr style={{ borderColor: 'var(--bg-tertiary)' }} />

                  {/* Full Article */}
                  <FullArticle
                    fullContent={article.full_content}
                    originalUrl={article.full_url}
                  />

                  {/* Divider + Timeline (only if multi-source) */}
                  {storySources.length >= 2 && (
                    <>
                      <hr style={{ borderColor: 'var(--bg-tertiary)' }} />
                      <StoryTimeline sources={storySources} />
                    </>
                  )}

                  {/* Source List */}
                  {storySources.length > 0 && (
                    <>
                      <hr style={{ borderColor: 'var(--bg-tertiary)' }} />
                      <SourceList sources={storySources} />
                    </>
                  )}
                </div>

                {/* Dialog title for screen readers (visually hidden) */}
                <Dialog.Title className="sr-only">
                  {article.title}
                </Dialog.Title>
                <Dialog.Description className="sr-only">
                  Article reading mode for {article.source_name}
                </Dialog.Description>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
