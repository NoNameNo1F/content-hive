# agent-devops — DevOps Agent

## Read First
- `project/constraints.md`
- `architecture/system-design.md` (after agent-arch completes)
- `agents/skills/code-standards.md`

## Responsibility
Environment is running before any feature code is written. Run once at project start, once at launch.

## Phase 0 Tasks (run immediately)

### 1. Supabase Setup
```bash
npx supabase init
npx supabase login
npx supabase link --project-ref <ref>
```
- Create two environments: `dev` and `prod`
- Enable Email auth provider in Supabase dashboard
- Set redirect URLs: `http://localhost:3000/**` (dev), `https://*.vercel.app/**` (prod)

### 2. Next.js Project Init
```bash
npx create-next-app@latest . --typescript --tailwind --app --src-dir --import-alias "@/*"
npx shadcn@latest init
```

### 3. Environment Variables
Create `.env.local` (never commit):
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only, never NEXT_PUBLIC_
```

Commit `.env.example` with empty values and comments.

### 4. Vercel Setup
```bash
npx vercel link
npx vercel env add NEXT_PUBLIC_SUPABASE_URL
npx vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
npx vercel env add SUPABASE_SERVICE_ROLE_KEY
```
- Set environment for each: Production, Preview, Development

### 5. MCP — Supabase (Claude Code only)
Add to `.mcp.json` in project root:
```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase@latest",
               "--supabase-url", "<SUPABASE_URL>",
               "--supabase-key", "<SERVICE_ROLE_KEY>"]
    }
  }
}
```
This allows agent-backend and agent-arch to run migrations and inspect schema directly via Claude Code without manual copy-paste.

### 6. Migration Workflow
```bash
# New migration
npx supabase migration new <name>
# Push to dev
npx supabase db push
# Generate types
npx supabase gen types typescript --linked > src/types/database.types.ts
```
Run type generation after every schema change.

### 7. GitHub Actions (optional but recommended)
Create `.github/workflows/migrate.yml`:
```yaml
on:
  push:
    branches: [main]
    paths: ['supabase/migrations/**']
jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db push
        env:
          SUPABASE_ACCESS_TOKEN: ${{ secrets.SUPABASE_ACCESS_TOKEN }}
          SUPABASE_DB_PASSWORD: ${{ secrets.SUPABASE_DB_PASSWORD }}
```

## Cost Monitor
Check monthly at Supabase dashboard:
- Free tier: 500MB DB, 1GB storage, 50MB file uploads
- Upgrade trigger: daily active use begins → move to Pro ($25/mo)
- Hard limit: $50/mo total — Vercel Hobby ($0) + Supabase Pro ($25) = $25/mo headroom

## Done When
- [ ] `supabase/` directory initialised
- [ ] `.env.example` committed
- [ ] Vercel project linked, env vars set in dashboard
- [ ] `.mcp.json` created with Supabase MCP config
- [ ] Type generation command runs without error
- [ ] `devops/setup-guide.md` written for future devs
