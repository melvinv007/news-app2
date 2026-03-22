/**
 * app/(app)/ai-tech/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * AI & Tech news feed. Chronological ordering (newest first).
 * This section fetches every 10 minutes (fastest interval).
 * Not personalised — uses direct query with .order('published_at', desc).
 *
 * Features:
 *   - Chronological feed (no pgvector)
 *   - Realtime subscription for new articles (category=eq.ai-tech)
 *   - Shimmer skeleton loading state
 *   - Reading Mode slide-in panel on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /ai-tech)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';

const CATEGORY = 'ai-tech';
const PAGE_SIZE = 30;

export default function AiTechPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
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
      .limit(PAGE_SIZE);
    if (error) {
      console.error('[AI/Tech] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
      setLastUpdated(new Date().toISOString());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('aitech-realtime')
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
        title="AI / Tech"
        subtitle="Updated every 10 minutes"
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
