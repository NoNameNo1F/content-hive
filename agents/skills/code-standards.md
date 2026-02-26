# Skill: Code Standards & Architecture
> Every agent must read and apply this skill before writing any code.
> Stack: Next.js (App Router) + Supabase + TypeScript
> Pattern: Feature-based Modular
> Standard: Balanced — guidelines applied, not hard blockers

---

## 1. Project Structure

Organize by **feature**, not by layer. Each feature is self-contained.

```
src/
├── app/                        # Next.js App Router (routing only)
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
│
├── features/                   # Core of the application
│   ├── feed/
│   │   ├── components/         # UI components scoped to this feature
│   │   ├── hooks/              # Custom React hooks
│   │   ├── actions/            # Next.js Server Actions
│   │   ├── queries/            # Supabase data fetching functions
│   │   └── types.ts            # Feature-specific types
│   ├── content/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions/
│   │   ├── queries/
│   │   └── types.ts
│   ├── search/
│   ├── auth/
│   └── profile/
│
├── components/                 # Shared, reusable UI components
│   ├── ui/                     # shadcn/ui base components
│   └── shared/                 # App-level shared components
│
├── lib/                        # Utilities and configuration
│   ├── supabase/
│   │   ├── client.ts           # Browser client
│   │   ├── server.ts           # Server client
│   │   └── middleware.ts       # Middleware client
│   ├── utils.ts                # General utilities (cn, formatDate, etc.)
│   └── constants.ts            # App-wide constants
│
├── types/                      # Global TypeScript types
│   ├── database.types.ts       # Auto-generated from Supabase
│   └── index.ts                # Shared domain types
│
└── supabase/
    ├── migrations/             # SQL migration files
    └── seed.sql                # Dev seed data
```

**Rules:**
- `app/` contains routing and page composition only — no business logic
- `features/` is where all real logic lives — one folder per feature
- A component in `features/feed/` must never import from `features/content/` directly — use `components/shared/` for cross-feature UI
- `lib/` is for pure utilities with no feature knowledge

---

## 2. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Files | kebab-case | `post-card.tsx`, `use-feed.ts` |
| Components | PascalCase | `PostCard`, `FeedList` |
| Functions | camelCase | `fetchPosts`, `formatDate` |
| Types / Interfaces | PascalCase | `Post`, `UserProfile` |
| Constants | UPPER_SNAKE_CASE | `MAX_TAGS`, `DEFAULT_PAGE_SIZE` |
| Database tables | snake_case | `posts`, `user_interests` |
| Supabase queries | descriptive verb | `getPostsByInterests`, `searchPosts` |
| Server Actions | verb + noun | `createPost`, `toggleBookmark` |
| API routes | REST nouns | `/api/og`, `/api/search` |

---

## 3. TypeScript Standards

**Always type explicitly — never use `any`.**

```typescript
// ❌ Bad
const fetchPosts = async (filters: any) => { ... }

// ✅ Good
interface PostFilters {
  tags?: string[]
  categoryId?: string
  visibility?: 'public' | 'team'
  page?: number
}
const fetchPosts = async (filters: PostFilters): Promise<Post[]> => { ... }
```

**Use Supabase generated types as the source of truth:**
```typescript
// types/database.types.ts — auto-generated via:
// supabase gen types typescript --linked > src/types/database.types.ts

import type { Database } from '@/types/database.types'

type Post = Database['public']['Tables']['posts']['Row']
type NewPost = Database['public']['Tables']['posts']['Insert']
```

**Prefer `type` over `interface` for data shapes, `interface` for contracts:**
```typescript
// Data shape → type
type Post = { id: string; title: string; ... }

// Contract / extendable → interface
interface PostRepository {
  findById(id: string): Promise<Post | null>
  findByTags(tags: string[]): Promise<Post[]>
}
```

---

## 4. Clean Code Rules (Balanced)

### Functions
- **One responsibility per function** — if you need "and" to describe it, split it
- **Max ~30 lines** per function — if longer, extract helpers
- **Descriptive names** — `getUserInterestTags()` not `getData()`
- **Early returns** over nested ifs

```typescript
// ❌ Bad — nested, hard to read
async function handlePost(id: string, userId: string) {
  if (id) {
    const post = await getPost(id)
    if (post) {
      if (post.userId === userId) {
        // do thing
      }
    }
  }
}

// ✅ Good — early returns, flat
async function handlePost(id: string, userId: string) {
  if (!id) return null
  const post = await getPost(id)
  if (!post) return null
  if (post.userId !== userId) throw new Error('Unauthorized')
  // do thing
}
```

### Components
- **One component per file**
- **Props interface defined above the component**
- **No business logic in components** — delegate to hooks or server actions
- **Keep JSX readable** — extract sub-components if JSX exceeds ~50 lines

```typescript
// ✅ Good component structure
interface PostCardProps {
  post: Post
  onBookmark?: (id: string) => void
}

export function PostCard({ post, onBookmark }: PostCardProps) {
  return (
    <div className="...">
      <PostCardHeader post={post} />
      <PostCardBody post={post} />
      <PostCardFooter postId={post.id} onBookmark={onBookmark} />
    </div>
  )
}
```

### SOLID (Applied Pragmatically)

| Principle | What it means in this project |
|-----------|-------------------------------|
| **S** — Single Responsibility | Each file/function does one thing |
| **O** — Open/Closed | Add new post types via config/union types, not if-else chains |
| **L** — Liskov | N/A at this scale |
| **I** — Interface Segregation | Don't pass entire `user` object when only `user.id` is needed |
| **D** — Dependency Inversion | Supabase calls live in `queries/`, not inside components or actions |

---

## 5. Supabase Query Pattern

All database calls live in `features/[feature]/queries/`. Never write Supabase calls inside components, pages, or actions directly.

```typescript
// features/feed/queries/get-feed-posts.ts
import { createServerClient } from '@/lib/supabase/server'
import type { Post } from '@/types'

export async function getFeedPosts(
  userId: string,
  page: number = 0
): Promise<Post[]> {
  const supabase = createServerClient()
  const pageSize = 20

  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      profiles(username, avatar_url),
      post_tags(tag)
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (error) throw new Error(`getFeedPosts: ${error.message}`)
  return data ?? []
}
```

```typescript
// features/feed/actions/bookmark-post.ts — Server Action
'use server'
import { createServerClient } from '@/lib/supabase/server'

export async function toggleBookmark(postId: string): Promise<void> {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthenticated')

  // upsert pattern — idempotent
  const { error } = await supabase
    .from('bookmarks')
    .upsert({ post_id: postId, user_id: user.id })

  if (error) throw new Error(`toggleBookmark: ${error.message}`)
}
```

---

## 6. Error Handling

**Never swallow errors silently.**

```typescript
// ❌ Bad
const { data } = await supabase.from('posts').select('*')
return data // could be null, error ignored

// ✅ Good
const { data, error } = await supabase.from('posts').select('*')
if (error) throw new Error(`fetchPosts failed: ${error.message}`)
return data ?? []
```

**In Server Actions — return typed results, don't throw to client:**
```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }

export async function createPost(input: NewPost): Promise<ActionResult<Post>> {
  try {
    const post = await insertPost(input)
    return { success: true, data: post }
  } catch (err) {
    return { success: false, error: 'Failed to create post. Please try again.' }
  }
}
```

---

## 7. Comments & Documentation

Write comments for **why**, not **what**. Code should explain what it does.

```typescript
// ❌ Bad — explains what, which is obvious
// Loop through posts
posts.forEach(post => { ... })

// ✅ Good — explains why
// Supabase RLS already filters by visibility, but we double-check
// here to guard against misconfigured policies in dev environments
const publicPosts = posts.filter(p => p.visibility === 'public')
```

Document all query functions with a one-line JSDoc:
```typescript
/** Returns paginated posts matching the user's interest tags, newest first. */
export async function getFeedPosts(userId: string, page: number) { ... }
```

---

## 8. What Agents Must NOT Do

- ❌ Write Supabase queries inside React components or page files
- ❌ Use `any` type — find the correct type or create one
- ❌ Put cross-feature imports between `features/` folders
- ❌ Write business logic inside `app/` route files
- ❌ Ignore Supabase errors (`const { data } = await ...` without checking `error`)
- ❌ Create god files — one responsibility per file
- ❌ Hardcode strings that should be constants (`'public'`, `20`, URLs)
- ❌ Skip loading and error states in UI components

---

## 9. Agent Self-Check Before Submitting Code

Before any agent marks a task complete, run this checklist:

```
[ ] All functions have a single, clear responsibility
[ ] No `any` types used
[ ] Supabase calls are in queries/ not in components or pages
[ ] Errors are handled — no silent failures
[ ] Component props are typed with an interface
[ ] No business logic in app/ routing files
[ ] No cross-feature imports between features/ folders
[ ] Constants extracted — no magic strings or numbers
[ ] At least one JSDoc comment on exported query functions
[ ] Loading and error states handled in any new UI component
```
