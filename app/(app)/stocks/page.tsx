/**
 * app/(app)/stocks/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Stocks page: StocksWidget at top, news feed below.
 * Fetches articles from both stocks-india and stocks-us categories.
 *
 * Features:
 *   - Full stocks dashboard widget
 *   - Combined stocks news feed (stocks-india + stocks-us)
 *   - Realtime subscription for new articles
 *   - Reading Mode on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /stocks)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';
import StocksWidget from '@/components/Stocks/StocksWidget';

const PAGE_SIZE = 20;

export default function StocksPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchArticles = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .in('category', ['stocks-india', 'stocks-us'])
      .eq('is_cluster_primary', true)
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);

    if (error) {
      console.error('[Stocks] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('stocks-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'articles',
          filter: 'category=in.(stocks-india,stocks-us)',
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
      <SectionHeader title="Stocks" />
      <StocksWidget />
      <div className="mt-6">
        <ArticleGrid
          articles={articles}
          loading={loading}
          onOpenReadingMode={(article) => setSelectedArticle(article)}
        />
      </div>
      <ReadingMode
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
      />
    </>
  );
}
