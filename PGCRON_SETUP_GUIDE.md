# pg_cron Setup Guide (UPDATED - No cron-job.org Needed!)

## ✅ **Good News: pg_cron is FREE on Supabase!**

You don't need cron-job.org at all. Everything can run directly in your Supabase database using `pg_cron` + `pg_net`.

---

## 🚀 **One-Click Setup (3 Steps)**

### **Step 1: Open Supabase SQL Editor**

Go to: **https://supabase.com/dashboard/project/sapubobejrostdjxezty/sql/new**

### **Step 2: Copy & Paste SQL File**

Open the file: **`SETUP_PGCRON.sql`**

Copy the ENTIRE contents and paste into the SQL Editor.

### **Step 3: Click "Run"**

That's it! All 13 cron jobs will be scheduled automatically.

---

## 📊 **What Gets Scheduled**

| Job | Frequency | What It Does |
|-----|-----------|--------------|
| **fetch-world** | Every 20 min | Guardian + NYT world news |
| **fetch-india** | Every 20 min | India-specific news |
| **fetch-mumbai** | Every 20 min | Mumbai-specific news |
| **fetch-aitech** | Every 10 min ⚡ | AI/Tech news (high priority) |
| **fetch-business** | Every 20 min | Business news |
| **fetch-cricket** | Every 20 min | Cricket news |
| **fetch-f1** | Every 20 min | Formula 1 news + sessions |
| **fetch-football** | Every 20 min | Football scores + news |
| **fetch-sports-other** | Every 20 min | Other sports |
| **fetch-stocks-news** | Every 20 min | Stock-related news |
| **process-articles** | Every 5 min ⚡ | AI summaries + embeddings |
| **process-embeddings** | Every 15 min | Vector embeddings for personalization |
| **cleanup-articles** | Every 6 hours | Delete articles older than 7 days |

---

## ✅ **Verify It's Working**

After running the SQL file, check your jobs are scheduled:

```sql
-- View all scheduled jobs
SELECT jobid, jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
```

You should see 13 rows (all with `active = true`).

---

## 📈 **Monitor Job Execution**

To see if jobs are running successfully:

```sql
-- View last 20 job runs
SELECT 
  job_id,
  (SELECT jobname FROM cron.job WHERE jobid = job_id) as job_name,
  start_time,
  end_time,
  status,
  return_message
FROM cron.job_run_details 
ORDER BY start_time DESC 
LIMIT 20;
```

Look for:
- ✅ `status = 'succeeded'` - job ran successfully
- ❌ `status = 'failed'` - check `return_message` for error

---

## 🐛 **Troubleshooting**

### Jobs not running?
```sql
-- Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- If empty, enable it:
CREATE EXTENSION pg_cron;
```

### Need to restart a job?
```sql
-- Unschedule it
SELECT cron.unschedule('fetch-world');

-- Re-run the specific SELECT cron.schedule(...) statement from SETUP_PGCRON.sql
```

### Want to unschedule ALL jobs?
```sql
-- Remove all fetch/process/cleanup jobs
SELECT cron.unschedule(jobname) 
FROM cron.job 
WHERE jobname LIKE 'fetch-%' 
   OR jobname LIKE 'process-%' 
   OR jobname = 'cleanup-articles';
```

---

## 🎯 **Expected Results**

**After 5 minutes:**
- 10-20 articles appear in database
- AI summaries start generating

**After 1 hour:**
- 150-250 articles across all categories
- Story clustering working (multiple sources for same event)
- Personalization starting to kick in

**After 24 hours:**
- 500+ articles
- Full personalization based on reading behavior
- All features operational

---

## 🔄 **Differences from cron-job.org**

| Feature | cron-job.org | pg_cron |
|---------|--------------|---------|
| Setup | Manual 13 jobs in web UI | One SQL file, done ✅ |
| Maintenance | External website | In your Supabase dashboard |
| Reliability | Depends on external service | Same infrastructure as your DB |
| Cost | Free (with limits) | Free (Supabase tier) |
| Monitoring | cron-job.org dashboard | SQL queries in Supabase |
| Timeout | 30s hard limit | Configurable (default: no limit) |

---

## ✨ **Why This is Better**

1. **Everything in one place** - No external dependencies
2. **Better monitoring** - Direct SQL queries for job history
3. **More reliable** - Runs on same infrastructure as your database
4. **Easier debugging** - Check `cron.job_run_details` table for errors
5. **No timeout issues** - Functions can run as long as needed (150s Edge Function limit still applies)

---

**Ready to go! Just paste `SETUP_PGCRON.sql` into Supabase SQL Editor and click Run.** 🚀
