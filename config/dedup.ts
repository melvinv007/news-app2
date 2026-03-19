/**
 * config/dedup.ts
 * ─────────────────────────────────────────────────────────────────
 * Deduplication thresholds per category.
 * Higher = stricter (more cards). Lower = looser (fewer cards).
 * AI/Tech is intentionally looser — better to see two similar stories than miss one.
 * To adjust: change the value. Takes effect on next fetch cycle.
 */

export const DEDUP_THRESHOLDS: Record<string, number> = {
  'world':           0.85,
  'india':           0.85,
  'mumbai':          0.85,
  'sports-cricket':  0.80,
  'sports-football': 0.80,
  'sports-f1':       0.80,
  'sports-other':    0.80,
  'ai-tech':         0.75,
  'business':        0.85,
  'stocks-india':    0.80,
  'stocks-us':       0.80,
};

export const DEDUP_LOOKBACK_HOURS = 48;
export const MAX_SOURCES_PER_CLUSTER = 10;
