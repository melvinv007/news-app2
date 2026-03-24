# 🚀 DEPLOYMENT GUIDE - Ready to Go Live

## ✅ PRE-DEPLOYMENT STATUS

- [x] All code issues fixed
- [x] Build succeeds (zero errors)
- [x] TypeScript compilation clean
- [x] Guardian API key configured in Supabase
- [x] Codebase audit complete

---

## 📋 STEP-BY-STEP DEPLOYMENT

### **Step 1: Deploy Edge Functions to Supabase** (5 minutes)

Open PowerShell in your project directory:

```powershell
cd C:\Melvin\Coding\Projects\news-app-v2

# Deploy all 13 functions
supabase functions deploy fetch-world --no-verify-jwt
supabase functions deploy fetch-india --no-verify-jwt
supabase functions deploy fetch-mumbai --no-verify-jwt
supabase functions deploy fetch-aitech --no-verify-jwt
supabase functions deploy fetch-business --no-verify-jwt
supabase functions deploy fetch-cricket --no-verify-jwt
supabase functions deploy fetch-f1 --no-verify-jwt
supabase functions deploy fetch-football --no-verify-jwt
supabase functions deploy fetch-sports-other --no-verify-jwt
supabase functions deploy fetch-stocks-news --no-verify-jwt
supabase functions deploy process-articles --no-verify-jwt
supabase functions deploy process-embeddings --no-verify-jwt
supabase functions deploy cleanup-articles --no-verify-jwt
```

**Wait for:** Each deployment should show "Deployed function XYZ" successfully.

---

### **Step 2: Test One Function Manually** (2 minutes)

Test fetch-world to verify it works:

```powershell
$headers = @{ "x-cron-secret" = "c5c02546d7a6ae0dbeedbffc9d4c6e4481005cfa806c1a62e7a3a0d3de60c5e2" }
$url = "https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-world"

Invoke-RestMethod -Uri $url -Method POST -Headers $headers
```

**Expected output:**
```json
{
  "ok": true,
  "inserted": 5
}
```

If you get 401: Check your CRON_SECRET matches.
If you get 500: Check Supabase → Edge Functions → fetch-world → Logs for error details.

---

### **Step 3: Check Articles in Database** (1 minute)

1. Go to: https://supabase.com/dashboard
2. Select your project: `sapubobejrostdjxezty`
3. Go to: **Table Editor** → **articles** table
4. You should see 5-10 new articles from the Guardian API

**If empty:** Check Edge Function logs for errors.

---

### **Step 4: Configure cron-job.org** (5 minutes)

Go to: https://cron-job.org/en/members/jobs/

Edit or create these jobs:

| Job Name | URL | Schedule | Timeout | Header |
|----------|-----|----------|---------|--------|
| fetch-world | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-world` | `*/10 * * * *` (every 10 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-india | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-india` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-mumbai | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-mumbai` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-aitech | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-aitech` | `*/10 * * * *` (every 10 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-business | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-business` | `*/15 * * * *` (every 15 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-cricket | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-cricket` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-f1 | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-f1` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-football | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-football` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-sports-other | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-sports-other` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| fetch-stocks-news | `https://sapubobejrostdjxezty.supabase.co/functions/v1/fetch-stocks-news` | `*/20 * * * *` (every 20 min) | 30s | `x-cron-secret: c5c02546...` |
| process-articles | `https://sapubobejrostdjxezty.supabase.co/functions/v1/process-articles` | `*/5 * * * *` (every 5 min) | 30s | `x-cron-secret: c5c02546...` |
| process-embeddings | `https://sapubobejrostdjxezty.supabase.co/functions/v1/process-embeddings` | `*/5 * * * *` (every 5 min) | 30s | `x-cron-secret: c5c02546...` |
| cleanup-articles | `https://sapubobejrostdjxezty.supabase.co/functions/v1/cleanup-articles` | `0 2 * * *` (daily at 2 AM) | 30s | `x-cron-secret: c5c02546...` |

**Important:**
- Timeout MUST be exactly **30 seconds** (free tier limit)
- Header key: `x-cron-secret` (lowercase, with dash)
- Header value: Your full CRON_SECRET from .env.local

---

### **Step 5: Wait 20 Minutes & Check** (20 minutes)

Let the cron jobs run a few cycles:
- After 5 min: `process-articles` should have run once
- After 10 min: `fetch-world`, `fetch-aitech` should have run once
- After 20 min: All other fetchers should have run once

**Check:** Go back to Supabase → articles table. You should have 50-100 articles by now.

---

### **Step 6: Open Your App** (1 minute)

Go to: https://news-app2-lemon.vercel.app

**You should see:**
- Articles populating in all categories
- AI summaries (may take 5-10 min for first batch)
- Dark mode UI working
- Sidebar navigation working

---

## 🎯 SUCCESS CRITERIA

✅ Edge Functions deployed without errors
✅ At least 1 manual function test succeeds
✅ Articles appearing in database
✅ Cron jobs configured and running
✅ App loads and shows articles
✅ No console errors in browser

---

## 🚨 TROUBLESHOOTING

### **Issue: 401 Unauthorized on manual test**
**Fix:** CRON_SECRET in PowerShell doesn't match Supabase secret.
```powershell
# Check what's actually set
supabase secrets list
```

### **Issue: 500 Internal Server Error**
**Fix:** Check Edge Function logs:
1. Supabase Dashboard → Edge Functions
2. Click the failing function
3. Click "Logs" tab
4. Look for red error messages

### **Issue: No articles in database after 20 min**
**Fix:** Check cron-job.org execution history:
1. Go to cron-job.org → Jobs
2. Click "Execution history" for each job
3. Should show "Successful" (green checkmark)
4. If "Failed" → click to see error details

### **Issue: Articles appear but no summaries**
**Normal:** AI processing runs separately every 5 minutes. First summaries appear 5-10 min after articles.

### **Issue: "GEMINI_API_KEY not set" in logs**
**Fix:** Set in Supabase:
```powershell
supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here
```
Then redeploy functions that use it:
```powershell
supabase functions deploy process-articles --no-verify-jwt
```

---

## 📊 MONITORING

After deployment, check these regularly:

1. **Supabase → Edge Functions → Logs** - Watch for errors
2. **Supabase → Table Editor → system_logs** - Application logs
3. **cron-job.org → Execution History** - Cron job success/failure
4. **App → Settings → Health Dashboard** - In-app monitoring

---

## 🎉 YOU'RE DONE!

Your news app is now live and fully automated:
- Articles fetch every 10-20 minutes
- AI processes them within 5 minutes
- Personalization learns from your reading
- Everything runs on free tiers

**Your app:** https://news-app2-lemon.vercel.app
**Admin:** https://news-app2-lemon.vercel.app/settings

Enjoy your AI-powered personal news dashboard! 🚀
