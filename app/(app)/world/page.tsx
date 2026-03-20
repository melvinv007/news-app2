/**
 * app/(app)/world/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Personalised World News feed. This is the ONLY section that uses
 * pgvector cosine similarity ranking via the get_recommended_articles RPC.
 * All other sections use chronological ordering.
 *
 * Features:
 *   - Personalised ranking via preference vector (pgvector)
 *   - Realtime subscription for new articles (category=eq.world)
 *   - New articles prepended with AnimatePresence
 *   - Shimmer skeleton loading state
 *   - Reading Mode slide-in panel on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /world)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';

const CATEGORY = 'world';
const PAGE_SIZE = 20;

export default function WorldPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  // Fetch personalised articles via RPC
  const fetchArticles = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    // RPC function defined in SQL migration — not in our Database type,
    // so we use a type assertion for the params and cast the result.
    const { data, error } = await (supabase.rpc as CallableFunction)(
      'get_recommended_articles',
      { p_category: CATEGORY, p_limit: PAGE_SIZE },
    ) as { data: Article[] | null; error: { message: string } | null };

    if (error) {
      console.error('[World] Fetch error:', error.message);
    } else if (data) {
      setArticles(data as Article[]);
      setLastUpdated(new Date().toISOString());
    }
    setLoading(false);
  }, []);

  // Initial fetch + Realtime subscription
  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('world-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'articles',
          filter: `category=eq.${CATEGORY}`,
        },
        (payload) => {
          const newArticle = payload.new as Article;
          if (newArticle.is_cluster_primary) {
            setArticles((prev) => [newArticle, ...prev]);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchArticles]);

  const handleOpenReadingMode = useCallback((article: Article): void => {
    setSelectedArticle(article);
  }, []);

  const handleCloseReadingMode = useCallback((): void => {
    setSelectedArticle(null);
  }, []);

  return (
    <>
      <SectionHeader
        title="World"
        subtitle="Personalised for you"
        lastUpdated={lastUpdated}
      />
      <ArticleGrid
        articles={articles}
        loading={loading}
        onOpenReadingMode={handleOpenReadingMode}
      />
      <ReadingMode
        article={selectedArticle}
        onClose={handleCloseReadingMode}
      />
    </>
  );
}
