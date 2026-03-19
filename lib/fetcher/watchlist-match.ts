/**
 * lib/fetcher/watchlist-match.ts
 * ─────────────────────────────────────────────────────────────────
 * Two-step watchlist matching:
 *   Step 1 — Groq keyword first-pass (fast, string match)
 *   Step 2 — Gemini confirmation (prevents false positives)
 *
 * Example: "Tata" keyword fires on any article mentioning Tata.
 * Gemini confirmation filters out unrelated mentions.
 */

import { quickKeywordMatch } from '@/lib/ai/groq';
import { confirmWatchlistMatch } from '@/lib/ai/gemini';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { WatchlistItem } from '@/lib/supabase/types';

export async function matchWatchlistItems(
  articleTitle: string,
  articleSummary: string,
  watchlistItems: WatchlistItem[],
  supabase: SupabaseClient,
  customPrompt?: string | null,
): Promise<string[]> {
  if (watchlistItems.length === 0) return [];

  const articleText = `${articleTitle} ${articleSummary}`;

  // Step 1 — fast string keyword check
  const candidateIds = quickKeywordMatch(
    articleText,
    watchlistItems.map(item => ({
      id: item.id,
      search_keywords: item.search_keywords,
    })),
  );

  if (candidateIds.length === 0) return [];

  // Step 2 — Gemini confirmation for each candidate
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

      // Increment unread count for matched watchlist item
      await supabase
        .from('user_watchlist')
        .update({ unread_count: supabase.rpc('increment', { x: 1 }) as unknown as number })
        .eq('id', id);
    }
  }

  return confirmedIds;
}
