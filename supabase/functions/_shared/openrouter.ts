/**
 * supabase/functions/_shared/openrouter.ts
 * ─────────────────────────────────────────────────────────────────
 * OpenRouter client for fallback summarization (DeepSeek V3).
 */

import { DEFAULT_PROMPTS } from './ai-config.ts';
import type { SummarizeResult } from './mistral.ts';

export async function summarizeWithOpenRouter(
  title: string,
  fullText: string,
  customPrompt?: string | null,
): Promise<SummarizeResult | null> {
  const apiKey = Deno.env.get('OPENROUTER_API_KEY');
  if (!apiKey) return null;

  const basePrompt = customPrompt || DEFAULT_PROMPTS.summarize;
  const prompt = `${basePrompt}\n\nARTICLE TITLE: ${title}\n\nARTICLE TEXT:\n${fullText.slice(0, 8000)}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://newsapp.local', // Required by OpenRouter
        'X-Title': 'News App v2',
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      console.error('[OpenRouter] API error:', await response.text());
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return null;

    return JSON.parse(content) as SummarizeResult;
  } catch (error) {
    console.error('[OpenRouter] Request failed:', String(error));
    return null;
  }
}
