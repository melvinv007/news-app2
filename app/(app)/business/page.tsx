/**
 * app/(app)/business/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Business news feed. Chronological ordering (newest first).
 * Not personalised — uses direct query with .order('published_at', desc).
 *
 * Features:
 *   - Chronological feed (no pgvector)
 *   - Realtime subscription for new articles (category=eq.business)
 *   - Shimmer skeleton loading state
 *   - Reading Mode slide-in panel on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /business)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';

const CATEGORY = 'business';
const PAGE_SIZE = 20;

export default function BusinessPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchArticles = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', CATEGORY)
      .eq('is_cluster_primary', true)
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('[Business] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('business-realtime')
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
      <SectionHeader title="Business" />
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
