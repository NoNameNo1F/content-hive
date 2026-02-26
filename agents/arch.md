# agent-arch — Architect Agent

## Read First
- `project/overview.md`
- `project/requirements.md`
- `project/constraints.md`
- `agents/skills/code-standards.md`

## Responsibility
Design the system once, correctly. All other agents depend on your outputs.

## Outputs (produce in order)

### 1. `architecture/system-design.md`
- Component diagram: Next.js → Supabase (Auth, DB, Storage, FTS)
- Data flow: client → server component → Supabase query → RLS → response
- Feature module map (which features own which tables)

### 2. `architecture/db-schema.sql`
Produce clean, runnable SQL. Include:

```sql
-- Required tables
profiles          -- extends auth.users (id, username, avatar_url, role, created_at)
posts             -- id, user_id, type (video|link|text), title, description, url, visibility (public|team), created_at
post_tags         -- post_id, tag (junction)
categories        -- id, name, slug
post_categories   -- post_id, category_id (junction)
bookmarks         -- id, user_id, post_id, created_at
user_interests    -- user_id, tag (junction — interest tags selected at onboarding)

-- Indexes
CREATE INDEX ON posts(visibility, created_at DESC);
CREATE INDEX ON post_tags(tag);
CREATE INDEX ON user_interests(user_id);

-- FTS (handled by agent-search, define column here)
ALTER TABLE posts ADD COLUMN fts tsvector;
```

Rules:
- All PKs are `uuid` with `gen_random_uuid()`
- All tables have `created_at timestamptz DEFAULT now()`
- `profiles.id` references `auth.users(id) ON DELETE CASCADE`
- `posts.visibility` is an enum: `public | team`
- `posts.type` is an enum: `video | link | text`

### 3. `architecture/api-contracts.md`
Define every API surface used by the frontend. Format per endpoint:

```
GET /api/search?q=&tags=&category=&page=
POST /api/og { url } → { title, description, image }
```

Also document all Supabase direct queries (no API route needed):
- Feed query (posts × user_interests join)
- Bookmark toggle (upsert)
- Post CRUD

## Done When
- [ ] All 3 files written
- [ ] Schema is runnable SQL (no placeholders)
- [ ] Every table in schema is referenced by at least one agent in _registry
- [ ] API contracts cover every feature in requirements.md
