/**
 * supabase/functions/_shared/watchlist-match.ts
 * Watchlist matching for Edge Functions — relative imports only.
 */

import { quickKeywordMatch } from './groq.ts';
import { confirmWatchlistMatch } from './gemini.ts';
import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

/** Minimal WatchlistItem type for Edge Functions (avoids importing full types) */
export type WatchlistItem = {
  id: string;
  label: string;
  canonical_name: string;
  search_keywords: string[];
  related_terms: string[] | null;
  type: 'topic' | 'person' | 'company';
  pinned_story_id: string | null;
  unread_count: number;
  created_at: string;
  last_checked_at: string;
};

export async function matchWatchlistItems(
  articleTitle: string,
  articleSummary: string,
  watchlistItems: WatchlistItem[],
  supabase: SupabaseClient,
  customPrompt?: string | null,
): Promise<string[]> {
  if (watchlistItems.length === 0) return [];

  const articleText = `${articleTitle} ${articleSummary}`;

  const candidateIds = quickKeywordMatch(
    articleText,
    watchlistItems.map(item => ({
      id: item.id,
      search_keywords: item.search_keywords,
    })),
  );

  if (candidateIds.length === 0) return [];

  const confirmedIds: string[] = [];

  for (const id of candidateIds) {
    const item = watchlistItems.find(w => w.id === id);
    if (!item) continue;

    const confirmed = await confirmWatchlistMatch(
      item.label,
      item.search_keywords,
      articleTitle,
      articleSummary,
      customPrompt,
    );

    if (confirmed) {
      confirmedIds.push(id);

      await supabase
        .from('user_watchlist')
        .update({ unread_count: supabase.rpc('increment', { x: 1 }) as unknown as number })
        .eq('id', id);
    }
  }

  return confirmedIds;
}
