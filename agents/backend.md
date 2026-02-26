# agent-backend — Backend Agent

## Read First
- `architecture/db-schema.sql`
- `architecture/api-contracts.md`
- `agents/skills/code-standards.md`

## Responsibility
Migrations are clean. RLS is airtight. API routes handle what Supabase client queries cannot.

## Outputs

### 1. Migration Files
Location: `supabase/migrations/`
One file per logical change. Naming: `YYYYMMDDHHMMSS_description.sql`

Order:
```
001_enums.sql           -- post_type, post_visibility, user_role
002_profiles.sql        -- profiles table + trigger
003_posts.sql           -- posts table
004_tags.sql            -- post_tags, categories, post_categories
005_bookmarks.sql       -- bookmarks table
006_user_interests.sql  -- user_interests table
007_indexes.sql         -- all performance indexes
008_rls.sql             -- ALL RLS policies (see below)
```

After each migration: `npx supabase db push && npx supabase gen types typescript --linked > src/types/database.types.ts`

### 2. RLS Policies — CRITICAL
Every table must have RLS enabled. These are the exact policies needed:

```sql
-- POSTS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Anyone can read public posts
CREATE POLICY "public posts visible to all"
  ON posts FOR SELECT
  USING (visibility = 'public');

-- Authenticated members can read team posts
CREATE POLICY "team posts visible to members"
  ON posts FOR SELECT
  TO authenticated
  USING (visibility = 'team');

-- Users can only insert their own posts
CREATE POLICY "users insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can only update/delete their own posts
CREATE POLICY "users manage own posts"
  ON posts FOR UPDATE, DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- BOOKMARKS
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own bookmarks"
  ON bookmarks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- USER_INTERESTS
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own interests"
  ON user_interests FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles visible to all"
  ON profiles FOR SELECT USING (true);

CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);
```

### 3. API Routes (Next.js)

#### `src/app/api/og/route.ts`
Fetch Open Graph metadata for a URL.
```typescript
// GET /api/og?url=https://...
// Returns: { title, description, image, url }
// Use cheerio to parse <meta og:*> tags
// Timeout: 5s max — return partial data on timeout, never throw to client
```

#### `src/app/api/search/route.ts`
Full-text search with RLS-aware scoping.
```typescript
// GET /api/search?q=&tags=&category=&page=0
// Use Supabase server client (inherits user session → RLS applies automatically)
// Return: { posts: Post[], total: number, page: number }
```

## Done When
- [ ] All 8 migration files created and pushed to dev DB
- [ ] `npx supabase gen types` runs clean after migrations
- [ ] RLS enabled on ALL tables — verify with: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'`
- [ ] agent-qa has signed off (see qa.md for exact test queries)
- [ ] `/api/og` route returns metadata within 5s or graceful fallback
- [ ] `/api/search` route scopes results by auth session
