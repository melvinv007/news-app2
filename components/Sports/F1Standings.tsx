/**
 * components/Sports/F1Standings.tsx
 * ─────────────────────────────────────────────────────────────────
 * F1 standings proxy. No official free API — standings come from
 * race-result articles in the DB.
 *
 * Queries the last 3 articles with 'standings' in the title
 * from category 'sports-f1' and displays them as mini cards.
 *
 * How to change: If a free standings API becomes available, replace here.
 * Used by: app/(app)/sports/f1/page.tsx
 */

'use client';

import { useState, useEffect } from 'react';
import { BarChart3, ExternalLink } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import type { Article } from '@/lib/supabase/types';

export default function F1Standings(): React.ReactElement {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchStandingsArticles(): Promise<void> {
      const supabase = createClient();
      const { data } = await supabase
        .from('articles')
        .select('*')
        .eq('category', 'sports-f1')
        .ilike('title', '%standings%')
        .order('published_at', { ascending: false })
        .limit(3);

      if (data) {
        setArticles(data);
      }
      setLoading(false);
    }

    fetchStandingsArticles();
  }, []);

  return (
    <div
      className="rounded-xl p-4 md:p-5"
      style={{ backgroundColor: 'var(--bg-secondary)' }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 size={16} style={{ color: 'var(--accent)' }} />
        <span
          className="font-sans text-xs font-semibold uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          Standings
        </span>
      </div>

      {/* Info message */}
      <p className="font-sans text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Standings are updated via race result articles below.
      </p>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-lg shimmer" />
          ))}
        </div>
      ) : articles.length === 0 ? (
        <p className="font-sans text-sm py-4 text-center" style={{ color: 'var(--text-muted)' }}>
          No standings articles yet
        </p>
      ) : (
        <div className="space-y-2">
          {articles.map((article) => (
            <a
              key={article.id}
              href={article.full_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors group"
              style={{ backgroundColor: 'var(--bg-primary)' }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)')}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'var(--bg-primary)')}
            >
              <div className="min-w-0">
                <p
                  className="font-sans text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {article.title}
                </p>
                <p className="font-sans text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  {article.source_name} •{' '}
                  {new Date(article.published_at).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                  })}
                </p>
              </div>
              <ExternalLink
                size={14}
                className="flex-shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ color: 'var(--text-muted)' }}
              />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
