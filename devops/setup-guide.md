# ContentHive — Developer Setup Guide

> One-time environment setup for new developers. Follow in order.

---

## Prerequisites

- Node.js 20+
- npm 10+
- [Supabase CLI](https://supabase.com/docs/guides/cli) (`npm install -g supabase`)
- [Vercel CLI](https://vercel.com/docs/cli) (`npm install -g vercel`)
- Git access to the repo

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd contenthive
npm install
```

---

## 2. Environment Variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in all values (see step 3 for where to find them).

---

## 3. Supabase Setup

### Create a Supabase project (first time only)
1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Choose a name (`contenthive-dev`) and strong DB password
4. Select region closest to your users

### Get your API keys
Dashboard → Project Settings → API:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon / public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`

### Configure Auth redirect URLs
Dashboard → Authentication → URL Configuration:
- Add `http://localhost:3000/**` for local dev
- Add `https://*.vercel.app/**` for preview deploys

### Link CLI to your project

```bash
npx supabase login
npx supabase link --project-ref <your-project-ref>
```

The project ref is found in: Dashboard → Project Settings → General → Reference ID

### Apply migrations

```bash
npx supabase db push
```

### Generate TypeScript types

```bash
npx supabase gen types typescript --linked > src/types/database.types.ts
```

Run this command again after every schema change.

---

## 4. MCP Setup (Claude Code Only)

If you use Claude Code with MCP:

```bash
cp .mcp.json.example .mcp.json
```

Then fill in `.mcp.json` with your Supabase URL and service role key.

> `.mcp.json` is gitignored — it contains your service role key.

---

## 5. Vercel Setup

```bash
npx vercel link
```

Follow the prompts to connect to the Vercel project.

Then add environment variables to Vercel:

```bash
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```

For each variable, set it for **Production**, **Preview**, and **Development** environments.

---

## 6. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Day-to-Day Workflows

### Create a new DB migration

```bash
npx supabase migration new <descriptive-name>
# Edit the generated file in supabase/migrations/
npx supabase db push
npx supabase gen types typescript --linked > src/types/database.types.ts
```

### Supabase free tier warning

The Supabase free tier **pauses the database after 7 days of inactivity**.
When the team begins daily use, upgrade to Pro ($25/mo) via the dashboard.

---

## GitHub Actions

The `.github/workflows/migrate.yml` workflow automatically runs migrations on push to `main`.

Add these secrets to your GitHub repo (Settings → Secrets → Actions):
- `SUPABASE_ACCESS_TOKEN` — from [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens)
- `SUPABASE_DB_PASSWORD` — the DB password you set when creating the project

---

## Cost Tracking

| Service | Plan | Cost |
|---------|------|------|
| Supabase | Free (dev) / Pro (prod) | $0 / $25/mo |
| Vercel | Hobby | $0 |
| **Total** | | **$0–$25/mo** |

Hard budget cap: **$50/month**. Flag any deviation to the team.
