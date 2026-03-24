/**
 * supabase/functions/_shared/groq.ts
 * Groq client for Edge Functions — uses esm.sh + Deno.env.
 */

import Groq from 'https://esm.sh/groq-sdk@0.13.0';
import { DEFAULT_PROMPTS } from './ai-config.ts';

// Validate API key at module load
const groqKey = Deno.env.get('GROQ_API_KEY');
if (!groqKey) {
  console.error('[GROQ] GROQ_API_KEY not set - Groq functions will fail');
}
const groq = new Groq({ apiKey: groqKey ?? 'dummy-key-for-init' });
const MODEL = 'llama-3.1-8b-instant';

async function complete(
  prompt: string,
  maxTokens = 200,
  model: string = MODEL,
): Promise<string | null> {
  try {
    const res = await groq.chat.completions.create({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function extractFingerprint(
  title: string,
  excerpt: string,
): Promise<string | null> {
  const prompt = `${DEFAULT_PROMPTS.fingerprint}\n\nTITLE: ${title}\nEXCERPT: ${excerpt.slice(0, 500)}`;
  const result = await complete(prompt, 50);
  if (!result) return null;
  const slug = result.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-');
  return slug.length > 3 ? slug : null;
}

export function quickKeywordMatch(
  articleText: string,
  watchlistItems: Array<{ id: string; search_keywords: string[] }>,
): string[] {
  const text = articleText.toLowerCase();
  return watchlistItems
    .filter(item => item.search_keywords.some(kw => text.includes(kw.toLowerCase())))
    .map(item => item.id);
}

export async function matchStockTickers(
  articleTitle: string,
  articleSummary: string,
  watchlistTickers: Array<{ ticker: string; display_name: string }>,
): Promise<string[]> {
  if (watchlistTickers.length === 0) return [];
  const tickerList = watchlistTickers.map(t => `${t.ticker} (${t.display_name})`).join(', ');
  const prompt = DEFAULT_PROMPTS.stockTicker
    .replace('{{WATCHLIST_TICKERS}}', tickerList)
    .replace('{{TITLE}}', articleTitle)
    .replace('{{SUMMARY}}', articleSummary.slice(0, 500));
  const result = await complete(prompt, 100);
  if (!result) return [];
  try {
    const clean = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return Array.isArray(parsed) ? parsed.filter((t: unknown) => typeof t === 'string') : [];
  } catch {
    return [];
  }
}

export type SummarizeResult = {
  summary: string | null;
  full_content_cleaned: string;
  clickbait_score: number;
  final_headline: string;
  topic_tags: string[];
};

export async function summarizeWithGroq(
  title: string,
  fullText: string,
  model: 'llama-3.3-70b-versatile' | 'llama-3.1-8b-instant' = 'llama-3.3-70b-versatile',
): Promise<SummarizeResult | null> {
  const prompt = `${DEFAULT_PROMPTS.summarize}\n\nARTICLE TITLE: ${title}\n\nARTICLE TEXT:\n${fullText.slice(0, 8000)}`;
  const result = await complete(prompt, 1000, model);
  if (!result) return null;
  try {
    const clean = result.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean);
    return {
      summary:              parsed.summary ?? null,
      full_content_cleaned: parsed.full_content_cleaned ?? fullText,
      clickbait_score:      Math.min(10, Math.max(0, parsed.clickbait_score ?? 0)),
      final_headline:       parsed.final_headline ?? title,
      topic_tags:           Array.isArray(parsed.topic_tags) ? parsed.topic_tags : [],
    };
  } catch {
    return null;
  }
}
