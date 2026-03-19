/**
 * lib/ai/groq.ts
 * ─────────────────────────────────────────────────────────────────
 * Groq client for fast, high-volume tasks.
 * Fires on EVERY article — must be fast and cheap.
 * Free limit: 14,400 req/day, resets midnight UTC.
 *
 * NOTE: In Edge Functions use Deno.env.get('GROQ_API_KEY') not process.env.
 *       Edge Functions must initialize their own Groq instance.
 */

import Groq from 'groq-sdk';
import { DEFAULT_PROMPTS } from '@/config/ai';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY ?? '' });
const MODEL = 'llama-3.1-8b-instant';

async function complete(prompt: string, maxTokens = 200): Promise<string | null> {
  try {
    const res = await groq.chat.completions.create({
      model: MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: maxTokens,
      temperature: 0.1,
    });
    return res.choices[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

// ── Story fingerprint extraction ──────────────────────────────────
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

// ── Watchlist keyword first-pass (string match, no AI needed) ─────
export function quickKeywordMatch(
  articleText: string,
  watchlistItems: Array<{ id: string; search_keywords: string[] }>,
): string[] {
  const text = articleText.toLowerCase();
  return watchlistItems
    .filter(item => item.search_keywords.some(kw => text.includes(kw.toLowerCase())))
    .map(item => item.id);
}

// ── Stock ticker matching ─────────────────────────────────────────
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
