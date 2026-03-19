/**
 * supabase/functions/_shared/vectors.ts
 * Preference vector update logic — copied from lib/recommendation/vectors.ts.
 */

import type { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const INTERACTION_WEIGHTS: Record<string, number> = {
  like:        +0.15,
  dislike:     -0.08,
  read_long:   +0.08,
  read_medium: +0.04,
  read_short:  +0.01,
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

  const { data: article } = await supabase
    .from('articles')
    .select('embedding')
    .eq('id', articleId)
    .single();

  if (!article?.embedding) return;

  await supabase.rpc('update_preference_vector', {
    p_article_embedding: article.embedding,
    p_weight: weight,
  });
}
