/**
 * app/(app)/india/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * India news feed. Chronological ordering (newest first).
 * Not personalised — uses direct query with .order('published_at', desc).
 *
 * Features:
 *   - Chronological feed (no pgvector)
 *   - Realtime subscription for new articles (category=eq.india)
 *   - Shimmer skeleton loading state
 *   - Reading Mode slide-in panel on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /india)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';

const CATEGORY = 'india';
const PAGE_SIZE = 50;

export default function IndiaPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);

  const fetchArticles = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('category', CATEGORY)
      .eq('is_cluster_primary', true)
      .eq('ai_processed', true)
      .order('published_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) {
      console.error('[India] Fetch error:', error.message);
    } else if (data) {
      if (data.length < PAGE_SIZE) setHasMore(false);
      if (offset === 0) setArticles(data);
      else setArticles(prev => [...prev, ...data]);
      setLastUpdated(new Date().toISOString());
    }
    setLoading(false);
  }, [offset]);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('india-realtime')
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
  }, [offset]);

  const handleCloseReadingMode = useCallback((): void => {
    setSelectedArticle(null);
  }, [offset]);

  return (
    <>
      <SectionHeader title="India" lastUpdated={lastUpdated} />
      <ArticleGrid 
        articles={articles}
        loading={loading}
        onOpenReadingMode={handleOpenReadingMode}
      />
      {hasMore && (
        <button
          onClick={() => setOffset(prev => prev + 50)}
          className="mx-auto mt-8 px-6 py-3 rounded-lg font-sans text-sm font-medium transition-colors block"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          Load more
        </button>
      )}
      <ReadingMode
        article={selectedArticle}
        onClose={handleCloseReadingMode}
      />
    </>
  );
}
