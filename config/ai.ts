/**
 * config/ai.ts
 * ─────────────────────────────────────────────────────────────────
 * All AI model assignments, prompts, and fallback chain.
 *
 * TO SWAP A MODEL: Change the string in MODEL_ASSIGNMENTS.
 * TO ADJUST A PROMPT: Edit DEFAULT_PROMPTS below, OR use Settings → Prompts in app.
 * User prompt overrides in user_preferences take precedence over these defaults.
 */

export const MODEL_ASSIGNMENTS = {
  fingerprinting:        'llama-3.1-8b-instant', // Groq — every article
  watchlistKeywordCheck: 'llama-3.1-8b-instant', // Groq — every article × watchlist items
  stockTickerMatch:      'llama-3.1-8b-instant', // Groq — every article
  summarization:         'gemini-2.5-flash',      // Gemini — new stories only
  watchlistConfirmation: 'gemini-2.5-flash',      // Gemini — on keyword match
  whyThisTooltip:        'gemini-2.5-flash',      // Gemini — on hover, cached
  embedding:             'text-embedding-004',    // Gemini — 768-dim vectors
} as const;

// Fallback chain: if primary fails (quota/error), try next.
// null = graceful degrade (article shows without summary, retried next cycle)
export const FALLBACK_CHAIN: Record<string, string | null> = {
  'gemini-2.5-flash': 'gemini-1.5-flash',
  'gemini-1.5-flash': null,
};

export const DEFAULT_PROMPTS = {
  fingerprint: `
You are extracting a canonical event identifier from a news article.
Given the title and excerpt, output a short slug (5-8 words, hyphen-separated)
that uniquely identifies the real-world event.

Examples:
- "india-wins-test-series-australia-2026"
- "openai-releases-gpt5-model-may-2026"
- "tesla-recalls-50000-vehicles-brake-issue"

Rules:
- Include key named entities (country, organisation, person)
- All lowercase, hyphens only, no special characters
- Output ONLY the slug. Nothing else.
`.trim(),

  summarize: `
You are a ruthlessly concise news editor. Strip every article to only real information.

Given the article title and full text, return a JSON object:
{
  "summary": string | null,
  "full_content_cleaned": string,
  "clickbait_score": number,
  "final_headline": string,
  "topic_tags": string[]
}

SUMMARY RULES (3-4 sentences max, or null if no real news):
- Sentence 1: What exactly happened? (specific facts only)
- Sentence 2: Who is involved? (only if adds meaning)
- Sentence 3: Why it matters? (skip if not significant)
- Sentence 4: What happens next? (only if confirmed, never speculative)
- NO background context, NO "experts say" padding, NO speculation
- If pure clickbait with no real content: return null

FULL_CONTENT_CLEANED: Remove filler, SEO padding, repeated facts, author bios.
Keep: unique facts, quotes that ARE the news, statistics, data.

CLICKBAIT_SCORE (0-10): 0=factual headline, 10=pure manipulation

FINAL_HEADLINE: Return original if score < 6. Rewrite to be factual if score >= 6.

TOPIC_TAGS: 2-5 specific strings like ["AI", "regulation", "OpenAI"]

Return ONLY valid JSON. No markdown fences. No explanation.
`.trim(),

  watchlistConfirm: `
A user is tracking: "{{TOPIC_LABEL}}"
Keywords: {{KEYWORDS}}

Article title: {{TITLE}}
Article summary: {{SUMMARY}}

Does this article genuinely cover this topic, or just mention keywords incidentally?
Reply with only: YES or NO
`.trim(),

  whyThis: `
User frequently reads about: {{TOP_TAGS}}
This article covers: {{ARTICLE_TAGS}}

Write ONE sentence (max 12 words) explaining why this article was recommended.
Start with "You often read about..." or "Similar to articles you've read on..."
Output only the sentence.
`.trim(),

  stockTicker: `
Given this article, identify publicly traded companies from the user's watchlist.
User's watchlist: {{WATCHLIST_TICKERS}}
Article title: {{TITLE}}
Article summary: {{SUMMARY}}

Only return tickers that are genuinely the subject (not passing mentions).
Return ONLY a JSON array: ["TATAMOTORS.NS", "AAPL"] or []
`.trim(),

  watchlistKeywords: `
A user wants to track: "{{TOPIC}}"

Generate tracking metadata as JSON:
{
  "canonical_name": "slug-form-of-topic",
  "search_keywords": ["keyword1", "keyword2", "keyword3"],
  "related_terms": ["term1", "term2"],
  "type": "topic" | "person" | "company"
}

search_keywords: 3-6 specific terms that would appear in articles about this topic.
related_terms: 2-4 broader context terms.
type: "person" if tracking a person, "company" if tracking a company, "topic" otherwise.

Return ONLY valid JSON. No markdown fences.
`.trim(),
};

export const PROMPT_LABELS: Record<keyof typeof DEFAULT_PROMPTS, string> = {
  fingerprint:      'Story Fingerprint Extraction',
  summarize:        'Summarization + Distillation + Clickbait Detection',
  watchlistConfirm: 'Watchlist Match Confirmation',
  whyThis:          '"Why am I seeing this?" Tooltip',
  stockTicker:      'Stock Ticker Matching',
  watchlistKeywords:'Watchlist Keyword Generation',
};
