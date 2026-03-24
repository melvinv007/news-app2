-- ================================================================
-- 003_add_cron_jobs.sql
-- ================================================================
-- Configures pg_cron to automatically trigger all Edge Functions
-- on scheduled intervals. Uses Supabase's pg_net extension.
-- ================================================================

-- Enable required extensions
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Helper function to call Edge Functions via HTTP
create or replace function invoke_edge_function(function_name text)
returns bigint
language plpgsql
security definer
as $$
declare
  request_id bigint;
begin
  -- Make async HTTP POST request using pg_net
  select net.http_post(
    url := 'https://sapubobejrostdjxezty.supabase.co/functions/v1/' || function_name,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', 'c5c02546d7a6ae0dbeedbffc9d4c6e4481005cfa806c1a62e7a3a0d3de60c5e2'
    ),
    body := '{}'::jsonb
  ) into request_id;
  
  return request_id;
  
exception when others then
  -- Log errors to system_logs
  insert into system_logs (level, source, message, context)
  values (
    'error',
    'pg_cron',
    'Failed to invoke ' || function_name || ': ' || SQLERRM,
    jsonb_build_object('function', function_name)
  );
  return null;
end;
$$;

-- ================================================================
-- FETCH FUNCTIONS (News Gathering)
-- ================================================================

-- Every 20 minutes: World news
select cron.schedule(
  'fetch-world',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-world'); $$
);

-- Every 20 minutes: India news
select cron.schedule(
  'fetch-india',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-india'); $$
);

-- Every 20 minutes: Mumbai news
select cron.schedule(
  'fetch-mumbai',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-mumbai'); $$
);

-- Every 10 minutes: AI/Tech news (high frequency)
select cron.schedule(
  'fetch-aitech',
  '*/10 * * * *',
  $$ select invoke_edge_function('fetch-aitech'); $$
);

-- Every 20 minutes: Business news
select cron.schedule(
  'fetch-business',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-business'); $$
);

-- Every 20 minutes: Cricket news
select cron.schedule(
  'fetch-cricket',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-cricket'); $$
);

-- Every 20 minutes: F1 news
select cron.schedule(
  'fetch-f1',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-f1'); $$
);

-- Every 20 minutes: Football news
select cron.schedule(
  'fetch-football',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-football'); $$
);

-- Every 20 minutes: Other sports news
select cron.schedule(
  'fetch-sports-other',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-sports-other'); $$
);

-- Every 20 minutes: Stock news
select cron.schedule(
  'fetch-stocks-news',
  '*/20 * * * *',
  $$ select invoke_edge_function('fetch-stocks-news'); $$
);

-- ================================================================
-- PROCESSING FUNCTIONS (AI Summarization)
-- ================================================================

-- Every 5 minutes: Process raw articles with AI summaries
select cron.schedule(
  'process-articles',
  '*/5 * * * *',
  $$ select invoke_edge_function('process-articles'); $$
);

-- Every 15 minutes: Generate embeddings for personalization
select cron.schedule(
  'process-embeddings',
  '*/15 * * * *',
  $$ select invoke_edge_function('process-embeddings'); $$
);

-- ================================================================
-- CLEANUP FUNCTIONS
-- ================================================================

-- Every 6 hours: Delete articles older than 7 days
select cron.schedule(
  'cleanup-articles',
  '0 */6 * * *',
  $$ select invoke_edge_function('cleanup-articles'); $$
);

-- ================================================================
-- NOTES
-- ================================================================
-- To view all scheduled jobs:
--   SELECT * FROM cron.job;
--
-- To view job execution history:
--   SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
--
-- To unschedule a job:
--   SELECT cron.unschedule('job-name');
--
-- To manually trigger a job:
--   SELECT invoke_edge_function('fetch-world');
-- ================================================================
