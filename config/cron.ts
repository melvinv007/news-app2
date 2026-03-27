/**
 * config/cron.ts
 * ─────────────────────────────────────────────────────────────────
 * Documents cron-job.org schedules. Changing here does NOT auto-update cron-job.org.
 * You must also update the schedule in the cron-job.org dashboard.
 */

export const FETCH_INTERVALS_MINUTES = {
  'fetch-world':        20,
  'fetch-india':        20,
  'fetch-mumbai':       20,
  'fetch-cricket':      20,
  'fetch-football':     20,
  'fetch-f1':           20,
  'fetch-sports-other': 20,
  'fetch-aitech':       10, // Fastest — AI news ASAP
  'fetch-business':     20,
  'process-articles':    5,
  'process-embeddings':  5,
} as const;

export const CRON_EXPRESSIONS = {
  'fetch-world':        '*/20 * * * *',
  'fetch-india':        '*/20 * * * *',
  'fetch-mumbai':       '*/20 * * * *',
  'fetch-cricket':      '*/20 * * * *',
  'fetch-football':     '*/20 * * * *',
  'fetch-f1':           '*/20 * * * *',
  'fetch-sports-other': '*/20 * * * *',
  'fetch-aitech':       '*/10 * * * *',
  'fetch-business':     '*/20 * * * *',
  'process-articles':   '*/5 * * * *',
  'process-embeddings': '*/5 * * * *',
} as const;
