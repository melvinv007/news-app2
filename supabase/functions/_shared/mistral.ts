/**
 * supabase/functions/_shared/mistral.ts
 * ─────────────────────────────────────────────────────────────────
 * Mistral AI client for fallback summarization via REST API.
 */

import { DEFAULT_PROMPTS } from './ai-config.ts';

export type SummarizeResult = {
  summary: string | null;
  full_content_cleaned: string;
  clickbait_score: number;
  final_headline: string;
  topic_tags: string[];
};

export async function summarizeWithMistral(
  title: string,
  fullText: string,
  customPrompt?: string | null,
): Promise<SummarizeResult | null> {
  const apiKey = Deno.env.get('MISTRAL_API_KEY');
  if (!apiKey) return null;

  const basePrompt = customPrompt || DEFAULT_PROMPTS.summarize;
  const prompt = `${basePrompt}\n\nARTICLE TITLE: ${title}\n\nARTICLE TEXT:\n${fullText.slice(0, 8000)}`;

  try {
    const response = await fetch('https://api.mistral.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'mistral-small-latest',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('[Mistral] API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as SummarizeResult;
  } catch (error) {
    console.error('[Mistral] Request failed:', String(error));
    return null;
  }
}
