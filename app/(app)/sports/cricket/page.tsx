/**
 * app/(app)/sports/cricket/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Cricket news feed. Chronological ordering (newest first).
 * Category: 'sports-cricket'
 *
 * Features:
 *   - Chronological feed
 *   - Realtime subscription for new articles
 *   - Shimmer skeleton loading state
 *   - Reading Mode slide-in panel on card click
 *
 * Used by: app/(app)/sports/layout.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import ReadingMode from '@/components/ReadingMode';

const CATEGORY = 'sports-cricket';
const PAGE_SIZE = 20;

export default function CricketPage(): React.ReactElement {
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
      console.error('[Cricket] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('cricket-realtime')
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

  return (
    <>
      <ArticleGrid
        articles={articles}
        loading={loading}
        onOpenReadingMode={(article) => setSelectedArticle(article)}
      />
      <ReadingMode
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}
