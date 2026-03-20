/**
 * app/(app)/watchlist/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Watchlist page: WatchlistPanel at top, matching articles below.
 * Filters articles where watchlist_matches IS NOT NULL.
 *
 * Features:
 *   - WatchlistPanel with topic management
 *   - Articles matching watchlist topics
 *   - Realtime subscription
 *   - Reading Mode on card click
 *
 * Used by: app/(app)/layout.tsx (routed via /watchlist)
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import SectionHeader from '@/components/Layout/SectionHeader';
import ReadingMode from '@/components/ReadingMode';
import WatchlistPanel from '@/components/Watchlist/WatchlistPanel';

const PAGE_SIZE = 30;

export default function WatchlistPage(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);

  const fetchArticles = useCallback(async (): Promise<void> => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .not('watchlist_matches', 'is', null)
      .eq('is_cluster_primary', true)
      .eq('ai_processed', true)
      .order('published_at', { ascending: false })
      .limit(PAGE_SIZE);
    if (error) {
      console.error('[Watchlist] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('watchlist-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'articles',
        },
        (payload) => {
          const newArticle = payload.new as Article;
          if (
            newArticle.is_cluster_primary &&
            newArticle.watchlist_matches &&
            newArticle.watchlist_matches.length > 0
          ) {
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
      <SectionHeader
        title="My Watchlist"
        subtitle="Articles matching your tracked topics"
      />
      <WatchlistPanel />
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
