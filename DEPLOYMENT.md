# Deploying Neptune to Vercel

This guide walks you through deploying Neptune to Vercel with Supabase as the backend.

## Prerequisites

- A Vercel account (free tier works)
- A Supabase project (free tier works)
- A Groq API key (free tier available)
- (Optional) Google Cloud project for Drive storage

## Step 1: Prepare Your Supabase Project

### 1.1 Create Database Tables

Run these SQL commands in your Supabase SQL editor (https://app.supabase.com/project/_/sql):

```sql
-- Workspaces table
create table workspaces (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references auth.users not null,
  name text not null,
  description text,
  domains text[],
  storage_backend text default 'supabase',
  google_folder_id text,
  google_access_token text,
  google_refresh_token text,
  node_count int default 0,
  edge_count int default 0,
  created_at timestamptz default now(),
  last_opened_at timestamptz
);

-- Sources per workspace
create table workspace_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces on delete cascade,
  owner_id uuid references auth.users not null,
  type text not null,
  url text,
  keyword text,
  status text default 'pending',
  last_fetched timestamptz,
  created_at timestamptz default now()
);

-- Processing jobs
create table processing_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid references workspaces on delete cascade,
  owner_id uuid references auth.users not null,
  status text default 'pending',
  progress int default 0,
  current_step text,
  sources_total int default 0,
  sources_done int default 0,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
```

### 1.2 Create Storage Bucket

```sql
-- Create storage bucket for workspace outputs
insert into storage.buckets (id, name, public) values ('workspace-outputs', 'workspace-outputs', false);
```

### 1.3 Set Up Storage Policies

```sql
-- Allow authenticated users to read their own workspace outputs
create policy "Users can read their own workspace outputs"
  on storage.objects for select
  using (bucket_id = 'workspace-outputs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to write their own workspace outputs
create policy "Users can write their own workspace outputs"
  on storage.objects for insert
  with check (bucket_id = 'workspace-outputs' and auth.uid()::text = (storage.foldername(name))[1]);

-- Allow authenticated users to update their own workspace outputs
create policy "Users can update their own workspace outputs"
  on storage.objects for update
  using (bucket_id = 'workspace-outputs' and auth.uid()::text = (storage.foldername(name))[1]);
```

### 1.4 Configure Authentication

1. Go to Authentication > Providers in Supabase
2. Enable Email provider
3. (Optional) Enable Google OAuth if you want social login
4. Set Site URL to your Vercel domain (e.g., `https://neptune.vercel.app`)
5. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `http://localhost:3000/auth/callback` (for local development)

## Step 2: Get Your API Keys

### Supabase
1. Go to Project Settings > API
2. Copy:
   - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
   - `anon` `public` key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - `service_role` `secret` key (`SUPABASE_SERVICE_ROLE_KEY`)

### Groq
1. Go to https://console.groq.com/keys
2. Create a new API key
3. Copy the key (`GROQ_API_KEY`)

### Google OAuth (Optional)
1. Go to https://console.cloud.google.com
2. Create a new project or select existing
3. Enable Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`
6. Copy Client ID and Client Secret

## Step 3: Deploy to Vercel

### 3.1 Connect Repository

1. Go to https://vercel.com/new
2. Import your Neptune repository
3. Vercel will auto-detect Next.js

### 3.2 Configure Environment Variables

Add these environment variables in Vercel project settings:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq (server-side only)
GROQ_API_KEY=your-groq-api-key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.vercel.app/api/auth/google/callback

# App URL
NEXT_PUBLIC_APP_URL=https://your-domain.vercel.app
```

**Important:** Do NOT add `NEXT_PUBLIC_` prefix to `GROQ_API_KEY` or `SUPABASE_SERVICE_ROLE_KEY` — these must remain server-side only.

### 3.3 Deploy

Click "Deploy" and wait for the build to complete.

## Step 4: Post-Deployment Configuration

### 4.1 Update Supabase Site URL

1. Go to Supabase > Authentication > URL Configuration
2. Set Site URL to your Vercel domain: `https://your-domain.vercel.app`
3. Add redirect URLs:
   - `https://your-domain.vercel.app/auth/callback`
   - `https://your-domain.vercel.app/api/auth/google/callback`

### 4.2 Update Google OAuth Redirect URI

If using Google Drive storage:
1. Go to Google Cloud Console > APIs & Services > Credentials
2. Edit your OAuth 2.0 Client ID
3. Add authorized redirect URI: `https://your-domain.vercel.app/api/auth/google/callback`

### 4.3 Test the Deployment

1. Visit your Vercel URL
2. Try the public preview (should work immediately)
3. Sign up for an account
4. Create a test workspace
5. Verify the processing pipeline completes

## Vercel Configuration

### Function Timeout

The ingestion pipeline (`/api/process/start`) can take several minutes. Vercel's default timeout is 10 seconds on Hobby plan, 60 seconds on Pro.

The code already exports `maxDuration = 300` (5 minutes), but this requires:
- **Vercel Pro plan** or higher
- Or, move long-running jobs to a background queue (see "Production Optimizations" below)

### Build Settings

Vercel auto-detects these from `package.json`:
- Build Command: `npm run build`
- Output Directory: `.next`
- Install Command: `npm install`

No changes needed unless you have custom requirements.

## Monitoring

### Vercel Logs

View function logs in Vercel dashboard:
1. Go to your project
2. Click "Functions" tab
3. Select a function to see logs

### Supabase Logs

View database queries and errors:
1. Go to Supabase > Logs
2. Select "Postgres Logs" or "API Logs"

### Error Tracking

Consider adding error tracking:
- Sentry: https://sentry.io
- LogRocket: https://logrocket.com

## Production Optimizations

### 1. Move to Background Jobs

For production scale, move the ingestion pipeline to a background job queue:

**Option A: Vercel Cron + Queue**
- Use Vercel Cron to trigger jobs
- Store job queue in Supabase
- Process jobs in batches

**Option B: External Worker**
- Deploy a separate worker service (e.g., Railway, Render)
- Use BullMQ or similar queue
- Trigger via webhook from Next.js

### 2. Add Rate Limiting

Protect API routes from abuse:

```bash
npm install @upstash/ratelimit @upstash/redis
```

Add to API routes:

```javascript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '10 s'),
})

export async function POST(request) {
  const ip = request.headers.get('x-forwarded-for')
  const { success } = await ratelimit.limit(ip)
  if (!success) return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  // ... rest of handler
}
```

### 3. Enable Caching

Add caching headers to API routes:

```javascript
return NextResponse.json(data, {
  headers: {
    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
  },
})
```

### 4. Optimize Graph Loading

For large graphs (>1000 nodes):
- Implement pagination or lazy loading
- Use WebGL renderer (Three.js) instead of Canvas 2D
- Add graph simplification (hide low-importance nodes)

### 5. Add Analytics

Track usage with Vercel Analytics:

```bash
npm install @vercel/analytics
```

Add to `app/layout.js`:

```javascript
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

## Troubleshooting

### "Function execution timed out"

The ingestion pipeline is taking too long. Options:
1. Upgrade to Vercel Pro for longer timeouts
2. Reduce number of sources per workspace
3. Move to background job queue

### "Supabase connection error"

- Verify environment variables are set correctly
- Check Supabase project is not paused (free tier pauses after 1 week inactivity)
- Verify service role key has correct permissions

### "Groq API rate limit"

Free tier limits:
- 30 requests per minute
- 14,400 requests per day

Solutions:
- Upgrade to paid Groq plan
- Add request queuing with delays
- Cache AI responses

### "Storage upload failed"

- Verify storage bucket exists: `workspace-outputs`
- Check storage policies allow authenticated users
- Verify file size is under Supabase limits (50MB default)

## Security Checklist

Before going live:

- [ ] `GROQ_API_KEY` is server-side only (no `NEXT_PUBLIC_` prefix)
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is server-side only
- [ ] Supabase RLS policies are enabled on all tables
- [ ] Storage policies restrict access to workspace owners
- [ ] API routes verify user authentication
- [ ] Rate limiting is enabled on public endpoints
- [ ] CORS is configured correctly
- [ ] Environment variables are set in Vercel (not committed to git)

## Scaling Considerations

### Database
- Supabase free tier: 500MB database, 1GB file storage
- Upgrade to Pro for more capacity
- Add database indexes on frequently queried columns

### API Routes
- Vercel Hobby: 100GB bandwidth/month
- Vercel Pro: 1TB bandwidth/month
- Consider CDN for static assets

### AI Costs
- Groq free tier: 14,400 requests/day
- Monitor usage in Groq console
- Consider caching AI responses

---

## Support

If you encounter issues:
1. Check Vercel function logs
2. Check Supabase logs
3. Review this guide's troubleshooting section
4. Open an issue on GitHub

Happy deploying! 🚀
