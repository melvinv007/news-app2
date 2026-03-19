/**
 * app/(app)/sports/football/page.tsx
 * ─────────────────────────────────────────────────────────────────
 * Football news feed with live scores widget.
 * Category: 'sports-football'. Shows FootballScores above article feed.
 *
 * Features:
 *   - Live/upcoming scores from football-data.org (EPL + UCL only)
 *   - Chronological article feed
 *   - Realtime subscription
 *   - Reading Mode on card click
 *
 * Used by: app/(app)/sports/layout.tsx
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';
import ArticleGrid from '@/components/ArticleGrid';
import ReadingMode from '@/components/ReadingMode';
import FootballScores from '@/components/Sports/FootballScores';

const CATEGORY = 'sports-football';
const PAGE_SIZE = 20;

export default function FootballPage(): React.ReactElement {
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
      console.error('[Football] Fetch error:', error.message);
    } else if (data) {
      setArticles(data);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchArticles();

    const supabase = createClient();
    const channel = supabase
      .channel('football-realtime')
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
      <FootballScores />
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
