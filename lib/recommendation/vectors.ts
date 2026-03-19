/**
 * lib/recommendation/vectors.ts
 * ─────────────────────────────────────────────────────────────────
 * Preference vector update logic.
 * Called by app/api/interactions/route.ts on every user interaction.
 *
 * To adjust learning speed: change weight values in INTERACTION_WEIGHTS.
 * Higher weights = faster learning but more volatile recommendations.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

export const INTERACTION_WEIGHTS: Record<string, number> = {
  like:        +0.15,
  dislike:     -0.08,
  read_long:   +0.08,  // >= 60 seconds
  read_medium: +0.04,  // 20-59 seconds
  read_short:  +0.01,  // < 20 seconds
  dismiss:     -0.02,
};

export function getWeight(action: string, readTimeSeconds?: number): number {
  if (action === 'read') {
    const secs = readTimeSeconds ?? 0;
    if (secs >= 60)  return INTERACTION_WEIGHTS.read_long;
    if (secs >= 20)  return INTERACTION_WEIGHTS.read_medium;
    return INTERACTION_WEIGHTS.read_short;
  }
  return INTERACTION_WEIGHTS[action] ?? 0;
}

export async function updatePreferenceVector(
  supabase: SupabaseClient,
  articleId: string,
  action: string,
  readTimeSeconds?: number,
): Promise<void> {
  const weight = getWeight(action, readTimeSeconds);
  if (weight === 0) return;

  // Fetch article embedding
  const { data: article } = await supabase
    .from('articles')
    .select('embedding')
    .eq('id', articleId)
    .single();

  // No embedding yet (still being processed) — skip silently
  if (!article?.embedding) return;

  // Update preference vector using Postgres function
  await supabase.rpc('update_preference_vector', {
    p_article_embedding: article.embedding,
    p_weight: weight,
  });
}
