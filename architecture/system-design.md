# ContentHive — System Design

> Version: V1 | Status: Phase 0 (Foundation)

---

## 1. Component Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        BROWSER                              │
│                                                             │
│   Next.js Client Components (React 19)                      │
│   - Feed page, Search page, Post detail, Profile           │
│   - shadcn/ui + Tailwind 4 for all UI                      │
│   - Supabase JS browser client (anon key)                   │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTPS
┌────────────────────────▼────────────────────────────────────┐
│                   VERCEL (Hobby)                            │
│                                                             │
│   Next.js Server Components + App Router                   │
│   ├── app/(auth)/         → login, register pages          │
│   ├── app/(main)/         → feed, search, post, profile    │
│   ├── app/api/og/         → OG metadata fetch (server)     │
│   └── app/api/search/     → Full-text search (server)      │
│                                                             │
│   Next.js Middleware (src/middleware.ts)                    │
│   └── Route protection: checks session cookie              │
│                                                             │
│   Server Actions                                            │
│   └── createPost, toggleBookmark, updateInterests          │
└────────────────────────┬────────────────────────────────────┘
                         │ Supabase JS (service role — server only)
                         │ Supabase JS (anon key — client/server)
┌────────────────────────▼────────────────────────────────────┐
│                   SUPABASE (Free → Pro)                     │
│                                                             │
│   ┌─────────────┐  ┌──────────────┐  ┌───────────────┐    │
│   │  Auth       │  │  PostgreSQL  │  │  Storage      │    │
│   │  - Email    │  │  - 7 tables  │  │  (future use) │    │
│   │  - OAuth    │  │  - RLS all   │  │               │    │
│   │    (V2)     │  │  - FTS index │  │               │    │
│   └─────────────┘  └──────────────┘  └───────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Session Flow

```
1. User visits /login
2. Next.js serves login page (server component)
3. User submits credentials → Supabase Auth
4. Supabase issues JWT → stored in httpOnly cookie via @supabase/ssr
5. Next.js middleware reads cookie on every request
6. Middleware refreshes session if near expiry
7. Server components read user from cookie session
8. RLS on Postgres enforces data access by role
```

**Client identification:**
- Visitors: no session (anon Supabase key, public data only)
- Members: JWT in cookie (`role = member`)
- Admins: JWT in cookie (`role = admin`)

---

## 3. Data Flow — Standard Request

```
Browser Client Component
  │
  ├─(read)──▶ Supabase JS (browser client, anon key)
  │            └─▶ Postgres + RLS filter by role
  │                 └─▶ Returns only allowed rows
  │
  └─(write)─▶ Next.js Server Action
               └─▶ Supabase JS (server client, reads cookie)
                    └─▶ Validates user session
                         └─▶ Postgres INSERT/UPDATE/DELETE
```

**API Route flow** (OG metadata, full-text search):
```
Browser
  └─▶ fetch('/api/og?url=...')
       └─▶ Next.js API Route (server)
            └─▶ Supabase admin client (service role) OR external fetch
                 └─▶ Returns JSON
```

---

## 4. Row-Level Security Model

| Table | Visitor (anon) | Member (auth) | Admin |
|-------|---------------|---------------|-------|
| `profiles` | Read (public fields) | Read all, write own | Full |
| `posts` (public) | Read | Read + Write own | Full |
| `posts` (team) | **BLOCKED** | Read + Write own | Full |
| `post_tags` | Follows post visibility | Follows post | Full |
| `post_categories` | Follows post visibility | Follows post | Full |
| `categories` | Read | Read | Full |
| `bookmarks` | **BLOCKED** | Read/Write own | Full |
| `user_interests` | **BLOCKED** | Read/Write own | Full |

> RLS is enforced at the Postgres layer, not in application code. Application code is defense-in-depth only.

---

## 5. Feature Module Map

| Feature | Tables Owned | API Routes | Server Actions |
|---------|-------------|------------|----------------|
| `auth` | `profiles`, `user_interests` | — | `updateInterests` |
| `content` | `posts`, `post_tags`, `post_categories`, `categories`, `bookmarks` | — | `createPost`, `updatePost`, `deletePost`, `toggleBookmark` |
| `feed` | reads `posts` × `user_interests` | — | — |
| `search` | reads `posts` (fts) | `/api/search` | — |
| `profile` | reads `profiles`, `bookmarks`, `user_interests` | — | — |

---

## 6. Project Directory Structure

Follows code-standards.md feature-based pattern:

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (main)/
│   │   ├── feed/page.tsx
│   │   ├── search/page.tsx
│   │   ├── post/[id]/page.tsx
│   │   └── profile/[id]/page.tsx
│   ├── api/
│   │   ├── og/route.ts
│   │   └── search/route.ts
│   └── layout.tsx
├── features/
│   ├── auth/
│   ├── content/
│   ├── feed/
│   ├── search/
│   └── profile/
├── components/
│   ├── ui/           ← shadcn/ui components
│   └── shared/       ← cross-feature components
├── lib/
│   ├── supabase/
│   │   ├── client.ts      ← browser Supabase client
│   │   ├── server.ts      ← server Supabase client (SSR)
│   │   └── middleware.ts  ← middleware Supabase client
│   ├── utils.ts
│   └── constants.ts
└── types/
    ├── database.types.ts  ← auto-generated from Supabase
    └── index.ts           ← shared domain types
```

---

## 7. Key Technical Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Auth storage | httpOnly cookie via `@supabase/ssr` | Prevents XSS access to JWT |
| Search | Supabase FTS (tsvector) | No extra service, within budget |
| Business logic | Next.js Server Actions + API routes | Portable, no Supabase edge functions |
| OG fetch | Server-side API route | Avoids CORS, hides origin fetching |
| RLS enforcement | Postgres RLS (not app code) | Cannot be bypassed by bugs in application layer |
| Component library | shadcn/ui | No dedicated designer, copy-owned components |
| Type safety | Supabase generated types → `database.types.ts` | Single source of truth for DB shape |

---

## 8. V2/V3 Extension Points

These are **not built in V1** but architecture accounts for them:

- `posts.fts` column → drop-in for AI embedding column in V3
- `categories` table → extensible to hierarchical categories in V2
- `bookmarks` table → extensible to collections/folders in V2
- Supabase Auth → OAuth providers add without auth refactor
- `profiles.role` enum → additional roles (moderator, contributor) without schema change
