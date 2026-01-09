# Database Solution - MySQL Migration

## ✅ Migration Complete

**The application now uses MySQL instead of SQLite.**

All database functions have been migrated to MySQL. See `MYSQL_SETUP.md` for setup instructions.

---

## Previous Problem (Resolved)

**SQLite file-based databases don't persist in Vercel's serverless environment.**

### Why?
- Vercel functions are **stateless** and **ephemeral**
- Each function invocation gets a fresh environment
- File system writes are temporary and cleared on:
  - New deployments
  - Function cold starts
  - After function execution completes

### Current Situation
- ✅ Works locally (data persists in `data/slack_messages.db`)
- ❌ **Won't work on Vercel** (data lost on every deployment/restart)

## Solutions

### Option 1: Vercel Postgres (Recommended) ⭐

**Best for:** Production-ready, managed PostgreSQL database

**Pros:**
- Native Vercel integration
- Free tier available
- Automatic backups
- Persistent data
- Easy setup

**Setup:**
1. Go to Vercel Dashboard → Your Project → Storage
2. Click "Create Database" → Select "Postgres"
3. Copy connection string
4. Add to environment variables: `POSTGRES_URL`

**Cost:** Free tier: 256 MB storage, 60 hours compute/month

---

### Option 2: Supabase (Free & Easy)

**Best for:** Free PostgreSQL with great developer experience

**Pros:**
- Completely free tier (500 MB database)
- Easy setup
- Great dashboard
- Auto-generated APIs

**Setup:**
1. Go to https://supabase.com
2. Create free account
3. Create new project
4. Copy connection string
5. Add to environment variables: `DATABASE_URL`

**Cost:** Free tier: 500 MB database, unlimited API requests

---

### Option 3: MongoDB Atlas (Free)

**Best for:** NoSQL database, flexible schema

**Pros:**
- Free tier (512 MB)
- NoSQL (easier for some use cases)
- Good for document storage

**Setup:**
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free cluster
3. Get connection string
4. Add to environment variables: `MONGODB_URI`

**Cost:** Free tier: 512 MB storage

---

### Option 4: PlanetScale (MySQL)

**Best for:** MySQL-compatible, serverless-friendly

**Pros:**
- Free tier
- MySQL-compatible
- Serverless-optimized

**Cost:** Free tier: 1 database, 1 GB storage

---

## Recommended: Vercel Postgres

I recommend **Vercel Postgres** because:
1. ✅ Native integration with Vercel
2. ✅ Zero configuration
3. ✅ Automatic connection pooling
4. ✅ Free tier sufficient for most use cases
5. ✅ Easy to scale later

## Migration Steps

Once you choose a database, I can help you:
1. Install the database driver (e.g., `@vercel/postgres`, `pg`, `mongodb`)
2. Update `lib/db.ts` to use the cloud database
3. Migrate the schema
4. Test the connection
5. Deploy

## Quick Decision Guide

- **Want simplest setup?** → Vercel Postgres
- **Want most free storage?** → Supabase (500 MB)
- **Prefer NoSQL?** → MongoDB Atlas
- **Need MySQL?** → PlanetScale

---

## Current Status

⚠️ **Current SQLite setup will NOT persist on Vercel**

Data will be lost on:
- Every new deployment
- Function cold starts
- Server restarts

**Action Required:** Choose a cloud database solution before production deployment.

---

## Quick Setup Guide (Vercel Postgres - Recommended)

### Step 1: Create Vercel Postgres Database

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Postgres**
6. Choose a name (e.g., `slack-messages-db`)
7. Select region closest to you
8. Click **Create**

### Step 2: Get Connection String

1. After creation, click on your database
2. Go to **Settings** tab
3. Copy the **Connection String** (looks like: `postgres://...`)

### Step 3: Add Environment Variable

1. In Vercel Dashboard → Your Project → **Settings** → **Environment Variables**
2. Add new variable:
   - **Name:** `POSTGRES_URL` (or `DATABASE_URL`)
   - **Value:** Paste the connection string
   - **Environment:** Production, Preview, Development (select all)
3. Click **Save**

### Step 4: Install Package

```bash
npm install @vercel/postgres
```

### Step 5: Initialize Schema

Run this once to create tables:

```bash
# Create a migration script or run in Vercel dashboard SQL editor
```

Or use the SQL editor in Vercel Dashboard:
1. Go to your Postgres database
2. Click **Query** tab
3. Run this SQL:

```sql
CREATE TABLE IF NOT EXISTS slack_messages (
  id SERIAL PRIMARY KEY,
  message_id TEXT UNIQUE NOT NULL,
  channel_id TEXT NOT NULL,
  channel_name TEXT,
  user_id TEXT NOT NULL,
  user_name TEXT,
  message_text TEXT NOT NULL,
  message_type TEXT,
  timestamp TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_channel_id ON slack_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_user_id ON slack_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_timestamp ON slack_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_message_type ON slack_messages(message_type);
```

### Step 6: Update Code

I've created a database adapter (`lib/db-adapter.ts`) that automatically switches between SQLite (local) and PostgreSQL (production).

**The code will automatically:**
- Use SQLite when `POSTGRES_URL` is not set (local development)
- Use PostgreSQL when `POSTGRES_URL` is set (production)

**No code changes needed!** Just set the environment variable and the adapter handles the rest.

---

## Alternative: Supabase (Free & Easy)

### Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign up (free)
3. Click **New Project**
4. Fill in details:
   - Name: `slack-messages`
   - Database Password: (choose a strong password)
   - Region: (choose closest)
5. Click **Create new project**

### Step 2: Get Connection String

1. Go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Copy the **URI** (looks like: `postgresql://...`)

### Step 3: Add to Vercel

1. In Vercel Dashboard → Environment Variables
2. Add:
   - **Name:** `DATABASE_URL`
   - **Value:** Paste the Supabase connection string
3. Save

### Step 4: Initialize Schema

Use Supabase SQL Editor:
1. Go to **SQL Editor** in Supabase dashboard
2. Click **New query**
3. Paste the same SQL from above
4. Click **Run**

---

## Testing

After setup, test the connection:

1. Visit: `https://your-app.vercel.app/api/slack/test`
2. Should show: `databaseAvailable: true`
3. Send a test message in Slack
4. Check if it appears in the database

---

## Migration Notes

- ✅ **Existing code will work** - adapter handles everything
- ✅ **Local development unchanged** - still uses SQLite
- ✅ **Production uses PostgreSQL** - data persists
- ✅ **No data migration needed** - fresh start (or I can help migrate if needed)

---

## Cost Comparison

| Solution | Free Tier | Paid Starts At |
|----------|-----------|----------------|
| Vercel Postgres | 256 MB, 60 hrs/month | $20/month |
| Supabase | 500 MB, unlimited API | $25/month |
| MongoDB Atlas | 512 MB | $9/month |
| PlanetScale | 1 GB | $29/month |

**For your use case (Slack messages):** All free tiers are sufficient! 🎉

