# Contributing to Neptune

Thank you for your interest in contributing to Neptune! This document provides guidelines and instructions for setting up your development environment.

## Development Setup

### Prerequisites

- Node.js 18+ and npm
- Git
- A Supabase account (free tier works)
- A Groq API key (free tier available at https://console.groq.com)
- (Optional) Google Cloud project with Drive API enabled for Drive storage

### Initial Setup

1. Clone the repository:
```bash
git clone https://github.com/your-org/neptune.git
cd neptune
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and fill in your credentials:

```env
# Supabase (get from https://app.supabase.com/project/_/settings/api)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Groq (get from https://console.groq.com/keys)
GROQ_API_KEY=your-groq-api-key

# Google OAuth (optional, for Drive storage)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Set up Supabase database:

Run these SQL commands in your Supabase SQL editor:

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

-- Create storage bucket for workspace outputs
insert into storage.buckets (id, name, public) values ('workspace-outputs', 'workspace-outputs', false);

-- Storage policies (allow authenticated users to access their own workspaces)
create policy "Users can read their own workspace outputs"
  on storage.objects for select
  using (bucket_id = 'workspace-outputs' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can write their own workspace outputs"
  on storage.objects for insert
  with check (bucket_id = 'workspace-outputs' and auth.uid()::text = (storage.foldername(name))[1]);
```

5. Start the development server:
```bash
npm run dev
```

Open http://localhost:3000 to see the app.

## Project Structure

```
neptune/
├── app/                    # Next.js App Router pages
│   ├── api/               # API routes
│   ├── dashboard/         # Authenticated dashboard
│   ├── workspace/         # Per-workspace viewer
│   └── page.js            # Public preview
├── components/            # React components
│   ├── graph/            # Graph visualization
│   ├── ui/               # UI components
│   └── workspace/        # Workspace-specific components
├── context/              # React context providers
├── lib/                  # Utility functions
├── public/               # Static assets
└── docs/                 # Documentation
```

## Development Workflow

### Running Tests

```bash
npm run test
```

### Linting

```bash
npm run lint
```

### Building for Production

```bash
npm run build
```

### Type Checking

The project uses JSDoc comments for type hints. VS Code will show type errors inline.

## Code Style

- Use functional React components with hooks
- Prefer `const` over `let`
- Use template literals for string interpolation
- Keep components small and focused
- Add JSDoc comments to complex functions
- Use inline styles for component-specific styling (Neptune uses a custom design system)

## Key Files to Understand

### Pipeline
- `app/api/process/start/route.js` — Core ingestion pipeline (entity extraction, graph building)

### Visualization
- `components/graph/GraphCanvas.js` — Custom Canvas 2D graph renderer with 3D perspective

### Authentication
- `context/AuthContext.js` — Supabase Auth context provider
- `app/dashboard/withAuth.js` — HOC for protecting routes

### AI Integration
- `lib/groq.js` — Groq API wrapper
- `app/api/ai/query/route.js` — AI query endpoint

## Common Tasks

### Adding a New API Route

1. Create a new file in `app/api/your-route/route.js`
2. Export `GET`, `POST`, `PUT`, or `DELETE` functions
3. Use `NextResponse.json()` for responses
4. Add authentication checks if needed

### Adding a New Component

1. Create a new file in `components/category/YourComponent.js`
2. Use `'use client'` directive if it needs client-side interactivity
3. Export as default
4. Add JSDoc comments for props

### Modifying the Graph Renderer

The graph renderer (`GraphCanvas.js`) is a custom Canvas 2D implementation. Key concepts:

- **Force-directed layout**: Pre-simulated for 120 ticks before first render
- **3D projection**: Custom perspective transform with rotation
- **Domain clustering**: Nodes are positioned by domain using `CLUSTER_POS`
- **Inertia**: Mouse drag applies velocity that decays over time

## Debugging

### Common Issues

**"Supabase client error"**
- Check your `.env.local` has correct Supabase credentials
- Verify the Supabase project is not paused

**"Groq API error"**
- Check your `GROQ_API_KEY` is valid
- Verify you haven't hit rate limits (free tier: 30 requests/minute)

**"Graph not loading"**
- Check the workspace has completed processing (status = 'done')
- Verify the graph.json file exists in storage
- Check browser console for API errors

**"Processing job stuck"**
- Check Vercel function logs if deployed
- Verify `maxDuration = 300` is exported in `app/api/process/start/route.js`
- Check source URLs are accessible

### Logging

Add debug logs to API routes:

```javascript
console.log('[DEBUG]', { variable, anotherVariable })
```

In development, logs appear in the terminal. On Vercel, check the Functions logs.

## Submitting Changes

1. Create a new branch: `git checkout -b feature/your-feature`
2. Make your changes
3. Test thoroughly
4. Commit with a clear message: `git commit -m "Add feature: description"`
5. Push: `git push origin feature/your-feature`
6. Open a pull request

## Questions?

Open an issue on GitHub or reach out to the maintainers.

---

Happy coding! 🚀
