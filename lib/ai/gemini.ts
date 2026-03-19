/**
 * lib/ai/gemini.ts
 * ─────────────────────────────────────────────────────────────────
 * Gemini AI client. Handles summarization, distillation, embeddings,
 * watchlist confirmation, "why this" tooltips, watchlist keyword generation.
 *
 * FALLBACK CHAIN: gemini-2.5-flash → gemini-1.5-flash → null (graceful degrade)
 * All functions return null on total failure — callers handle null gracefully.
 *
 * NOTE: In Edge Functions, import via relative path not @/ alias.
 * NOTE: process.env does not work in Deno — use Deno.env.get() in Edge Functions.
 *       This file uses process.env for Next.js context only.
 *       Edge Functions must initialize their own GoogleGenerativeAI instance.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { DEFAULT_PROMPTS, FALLBACK_CHAIN } from '@/config/ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY ?? '');

export type SummarizeResult = {
  summary: string | null;
  full_content_cleaned: string;
  clickbait_score: number;
  final_headline: string;
  topic_tags: string[];
};

export type WatchlistKeywordsResult = {
  canonical_name: string;
  search_keywords: string[];
  related_terms: string[];
  type: 'topic' | 'person' | 'company';
};

// ── Core generate helper with fallback chain ──────────────────────
async function generate(
  prompt: string,
  primaryModel = 'gemini-2.5-flash',
): Promise<string | null> {
  const chain: string[] = [primaryModel];
  let next = FALLBACK_CHAIN[primaryModel];
  while (next) { chain.push(next); next = FALLBACK_CHAIN[next] ?? null; }

  for (const modelName of chain) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text().trim();
      if (text) return text;
    } catch (err: unknown) {
      const isQuota = err instanceof Error && (
        err.message.includes('429') ||
        err.message.includes('quota') ||
        err.message.includes('RESOURCE_EXHAUSTED')
      );
      if (!isQuota) throw err;
    }
  }
  return null;
}

// ── Summarize + distill + clickbait (single call) ─────────────────
export async function summarizeArticle(
  title: string,
  fullText: string,
  customPrompt?: string | null,
): Promise<SummarizeResult | null> {
  const template = customPrompt ?? DEFAULT_PROMPTS.summarize;
  const prompt = `${template}\n\nARTICLE TITLE: ${title}\n\nARTICLE TEXT:\n${fullText.slice(0, 8000)}`;
  const raw = await generate(prompt);
  if (!raw) return null;
  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(clean) as SummarizeResult;
    return {
      summary:              parsed.summary ?? null,
      full_content_cleaned: parsed.full_content_cleaned ?? fullText,
      clickbait_score:      Math.min(10, Math.max(0, parsed.clickbait_score ?? 0)),
      final_headline:       parsed.final_headline ?? title,
      topic_tags:           Array.isArray(parsed.topic_tags) ? parsed.topic_tags : [],
    };
  } catch {
    return { summary: null, full_content_cleaned: fullText, clickbait_score: 0, final_headline: title, topic_tags: [] };
  }
}

// ── Watchlist confirmation ────────────────────────────────────────
export async function confirmWatchlistMatch(
  topicLabel: string,
  keywords: string[],
  articleTitle: string,
  articleSummary: string,
  customPrompt?: string | null,
): Promise<boolean> {
  const template = customPrompt ?? DEFAULT_PROMPTS.watchlistConfirm;
  const prompt = template
    .replace('{{TOPIC_LABEL}}', topicLabel)
    .replace('{{KEYWORDS}}', keywords.join(', '))
    .replace('{{TITLE}}', articleTitle)
    .replace('{{SUMMARY}}', articleSummary);
  const result = await generate(prompt);
  if (!result) return false;
  return result.trim().toUpperCase().startsWith('YES');
}

// ── Watchlist keyword generation ──────────────────────────────────
export async function generateWatchlistKeywords(
  topic: string,
): Promise<WatchlistKeywordsResult | null> {
  const prompt = DEFAULT_PROMPTS.watchlistKeywords.replace('{{TOPIC}}', topic);
  const raw = await generate(prompt);
  if (!raw) return null;
  try {
    const clean = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(clean) as WatchlistKeywordsResult;
  } catch {
    return null;
  }
}

// ── "Why am I seeing this?" ───────────────────────────────────────
export async function generateWhyThis(
  userTopTags: string[],
  articleTags: string[],
): Promise<string | null> {
  const prompt = DEFAULT_PROMPTS.whyThis
    .replace('{{TOP_TAGS}}', userTopTags.join(', '))
    .replace('{{ARTICLE_TAGS}}', articleTags.join(', '));
  return generate(prompt);
}

// ── Embeddings ────────────────────────────────────────────────────
export async function generateEmbedding(
  title: string,
  summary: string,
): Promise<number[] | null> {
  try {
    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(`${title}\n\n${summary}`);
    return result.embedding.values;
  } catch {
    return null;
  }
}
