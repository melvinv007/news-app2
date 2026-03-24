# Cron Job Configuration for news-app-v2

## ✅ Edge Functions Successfully Deployed!

All 13 Edge Functions are live and working. `fetch-india` confirmed inserting articles.

---

## 🔄 Configure Automatic Execution with cron-job.org

Go to: **https://console.cron-job.org**

### Required Configuration for Each Job

**Headers (Required for ALL jobs):**
```
x-cron-secret: c5c02546d7a6ae0dbeedbffc9d4c6e4481005cfa806c1a62e7a3a0d3de60c5e2
```

**Method:** POST  
**Timeout:** 30 seconds (free tier limit)

---

## 📋 Cron Jobs to Create (13 Total)

| # | Job Title | URL | Schedule | Notes |
|---|-----------|-----|----------|-------|
| 1 | fetch-world | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-world` | Every 20 minutes | Guardian + NYT world news |
| 2 | fetch-india | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-india` | Every 20 minutes | India-specific news |
| 3 | fetch-mumbai | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-mumbai` | Every 20 minutes | Mumbai-specific news |
| 4 | fetch-aitech | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-aitech` | **Every 10 minutes** | AI/Tech news (high frequency) |
| 5 | fetch-business | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-business` | Every 20 minutes | Business news |
| 6 | fetch-cricket | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-cricket` | Every 20 minutes | Cricket news |
| 7 | fetch-f1 | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-f1` | Every 20 minutes | Formula 1 news + sessions |
| 8 | fetch-football | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-football` | Every 20 minutes | Football scores + news |
| 9 | fetch-sports-other | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-sports-other` | Every 20 minutes | Other sports news |
| 10 | fetch-stocks-news | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-stocks-news` | Every 20 minutes | Stock-related news |
| 11 | process-articles | `https://sapubobejrostdjxezty.supabase.co/functions/v1/process-articles` | **Every 5 minutes** | AI summarization + embeddings |
| 12 | process-embeddings | `https://sapubobejrostdjxezty.supabase.co/functions/v1/process-embeddings` | Every 15 minutes | Generate vector embeddings |
| 13 | cleanup-articles | `https://sapubobejrostdjxezty.supabase.co/functions/v1/cleanup-articles` | **Every 6 hours** | Delete articles older than 7 days |

---

## 🎯 Recommended Schedule (Stagger to Avoid Overload)

### Every 10 Minutes
- `:00` - fetch-aitech
- `:10` - fetch-aitech
- `:20` - fetch-aitech
- `:30` - fetch-aitech
- `:40` - fetch-aitech
- `:50` - fetch-aitech

### Every 20 Minutes (Stagger by 2 minutes each)
- `:00` - fetch-world
- `:02` - fetch-india
- `:04` - fetch-mumbai
- `:06` - fetch-business
- `:08` - fetch-cricket
- `:10` - fetch-f1
- `:12` - fetch-football
- `:14` - fetch-sports-other
- `:16` - fetch-stocks-news

### Every 5 Minutes
- `:01` - process-articles
- `:06` - process-articles
- `:11` - process-articles
- `:16` - process-articles
- `:21` - process-articles
- `:26` - process-articles
- `:31` - process-articles
- `:36` - process-articles
- `:41` - process-articles
- `:46` - process-articles
- `:51` - process-articles
- `:56` - process-articles

### Every 15 Minutes
- `:03` - process-embeddings
- `:18` - process-embeddings
- `:33` - process-embeddings
- `:48` - process-embeddings

### Every 6 Hours
- `00:00` - cleanup-articles
- `06:00` - cleanup-articles
- `12:00` - cleanup-articles
- `18:00` - cleanup-articles

---

## 📝 Step-by-Step Configuration

### For Each Cron Job:

1. **Create New Job**
   - Click "Create cronjob"

2. **Basic Settings**
   - Title: (see table above)
   - URL: (see table above)
   - Request method: `POST`

3. **Schedule**
   - Choose frequency from table above
   - Use advanced cron notation if needed: `*/10 * * * *` (every 10 min)

4. **Add Headers** ⚠️ CRITICAL
   - Click "Headers"
   - Add header:
     - Name: `x-cron-secret`
     - Value: `c5c02546d7a6ae0dbeedbffc9d4c6e4481005cfa806c1a62e7a3a0d3de60c5e2`

5. **Advanced Settings**
   - Timeout: 30 seconds
   - Enabled: ✓ Yes

6. **Save**

---

## ✅ Verification

After configuring all jobs:

1. **Wait 5 minutes** for first execution cycle
2. **Check cron-job.org dashboard** - should see green checkmarks
3. **Check your app** at https://news-app2-lemon.vercel.app
4. **Check Settings → Health Dashboard** for real-time monitoring

### Expected Results After:
- **5 minutes**: 10-20 articles
- **20 minutes**: 50-100 articles across all categories
- **1 hour**: 150-250 articles with AI summaries
- **24 hours**: 500+ articles, full personalization working

---

## 🐛 Troubleshooting

### Red X in cron-job.org execution history
- Check "Details" → Look for HTTP error code
- **401**: Wrong CRON_SECRET header value
- **404**: Function name typo in URL
- **500**: Function crashed (check Supabase Edge Function logs)
- **Timeout**: Function took >30s (expected for large batches)

### No articles showing in app
- Check Supabase → Table Editor → `articles` table
- If empty: cron jobs not running OR functions crashing
- If populated: UI issue (check browser console)

### 0 articles inserted
- Normal if articles already exist (duplicate detection working)
- Try triggering manually: `fetch-cricket` or `fetch-f1` (always fresh)

---

## 🎉 You're Done!

Once all 13 cron jobs are configured and showing green checkmarks, your news app will:
- ✅ Fetch articles automatically every 10-20 minutes
- ✅ Generate AI summaries within 5 minutes
- ✅ Cluster stories from multiple sources
- ✅ Create vector embeddings for personalization
- ✅ Clean up old articles every 6 hours

**No manual intervention needed!**
