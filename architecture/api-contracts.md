# ContentHive — API Contracts

> Version: V1
> Defines every API surface between the frontend and backend.
> Two kinds of surface: (1) Next.js API Routes, (2) Supabase direct queries.

---

## 1. Next.js API Routes

These are server-side endpoints in `src/app/api/`. They run on Vercel.
All routes return `application/json`.

---

### `GET /api/og`

**Purpose:** Fetch Open Graph metadata for a URL when a user creates a link post.

**Auth:** None required (server-to-server fetch).

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | Yes | The external URL to scrape OG metadata from |

**Success response `200`:**
```json
{
  "title": "string | null",
  "description": "string | null",
  "image": "string | null",
  "siteName": "string | null"
}
```

**Error response `400`:**
```json
{ "error": "Missing url parameter" }
```

**Error response `500`:**
```json
{ "error": "Failed to fetch metadata" }
```

**Implementation notes:**
- Fetch is performed server-side to avoid CORS issues
- Timeout: 5 seconds — return null fields if timeout exceeded
- Only follows 1 redirect
- Does NOT store the result; caller caches it client-side

---

### `GET /api/search`

**Purpose:** Full-text search across posts. Scoped by user role via RLS.

**Auth:** Optional. If authenticated, team content is included in results.
Session is read from the request cookie by the server Supabase client.

**Query params:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `q` | string | Yes | Search query (min 2 chars) |
| `tags` | string | No | Comma-separated tag filter (e.g. `react,design`) |
| `category` | string | No | Category slug (e.g. `engineering`) |
| `type` | string | No | Post type: `video`, `link`, or `text` |
| `page` | number | No | Page number, 0-indexed (default: 0) |

**Success response `200`:**
```json
{
  "posts": [
    {
      "id": "uuid",
      "title": "string",
      "description": "string | null",
      "url": "string | null",
      "thumbnail": "string | null",
      "type": "video | link | text",
      "visibility": "public | team",
      "saves_count": 0,
      "created_at": "ISO8601",
      "author": {
        "id": "uuid",
        "username": "string",
        "avatar_url": "string | null"
      },
      "tags": ["string"],
      "categories": [{ "id": "uuid", "name": "string", "slug": "string" }]
    }
  ],
  "total": 42,
  "page": 0,
  "pageSize": 20
}
```

**Error response `400`:**
```json
{ "error": "Query must be at least 2 characters" }
```

**Implementation notes:**
- Uses Supabase FTS: `posts.fts @@ plainto_tsquery('english', q)`
- Tags are included in the tsvector (injected on post_tag write)
- RLS automatically scopes team content — no manual role check needed
- Page size: 20 (constant `DEFAULT_PAGE_SIZE`)

---

## 2. Supabase Direct Queries

These queries are executed directly from the browser (client components) or
server (server components / server actions) using the Supabase JS SDK.
They live in `src/features/[feature]/queries/`.

---

### Feed Queries (`features/feed/queries/`)

#### `getFeedPosts(userId, page)`
**Purpose:** Return posts matching the authenticated user's interest tags.

```typescript
/** Returns paginated posts matching the user's interest tags, newest first. */
export async function getFeedPosts(userId: string, page: number = 0): Promise<Post[]>
```

**SQL equivalent:**
```sql
SELECT p.*, pr.username, pr.avatar_url
FROM posts p
JOIN profiles pr ON pr.id = p.user_id
WHERE p.id IN (
    SELECT DISTINCT pt.post_id
    FROM post_tags pt
    JOIN user_interests ui ON ui.tag = pt.tag
    WHERE ui.user_id = :userId
)
ORDER BY p.created_at DESC
LIMIT 20 OFFSET :page * 20;
```

**RLS:** Applied automatically. Team posts filtered for non-members.

---

#### `getPublicFeedPosts(page)`
**Purpose:** Return latest public posts for unauthenticated visitors.

```typescript
/** Returns paginated public posts, newest first. For the visitor homepage. */
export async function getPublicFeedPosts(page: number = 0): Promise<Post[]>
```

**SQL equivalent:**
```sql
SELECT p.*, pr.username, pr.avatar_url
FROM posts p
JOIN profiles pr ON pr.id = p.user_id
WHERE p.visibility = 'public'
ORDER BY p.created_at DESC
LIMIT 20 OFFSET :page * 20;
```

---

#### `getFeedPostsByPopularity(userId, page)`
**Purpose:** Same as `getFeedPosts` but sorted by `saves_count DESC`.

```typescript
/** Returns interest-matched posts sorted by save count (most saved first). */
export async function getFeedPostsByPopularity(userId: string, page: number): Promise<Post[]>
```

---

### Content Queries (`features/content/queries/`)

#### `getPostById(id)`
**Purpose:** Fetch a single post with full details (tags, category, author).

```typescript
/** Returns a post with related author, tags, and categories by id. */
export async function getPostById(id: string): Promise<PostDetail | null>
```

**Supabase query:**
```typescript
supabase
  .from('posts')
  .select(`
    *,
    profiles(id, username, avatar_url),
    post_tags(tag),
    post_categories(categories(id, name, slug))
  `)
  .eq('id', id)
  .single()
```

---

#### `getPostsByUser(userId, page)`
**Purpose:** All posts created by a given user (used on profile page).

```typescript
/** Returns all posts created by userId, newest first. */
export async function getPostsByUser(userId: string, page: number): Promise<Post[]>
```

---

### Content Server Actions (`features/content/actions/`)

#### `createPost(input)`
**Purpose:** Insert a new post with its tags and category.

```typescript
type CreatePostInput = {
  type: 'video' | 'link' | 'text'
  title: string
  description?: string
  url?: string
  thumbnail?: string
  visibility: 'public' | 'team'
  tags: string[]           // max 10 tags
  categoryId?: string
}

export async function createPost(input: CreatePostInput): Promise<ActionResult<Post>>
```

**Steps:**
1. Validate session (throw if unauthenticated)
2. Insert into `posts`
3. Insert tags into `post_tags` (batch)
4. Insert into `post_categories` if categoryId provided
5. Return `{ success: true, data: post }`

---

#### `updatePost(id, input)`
**Purpose:** Edit own post (or any post if admin).

```typescript
type UpdatePostInput = Partial<Pick<CreatePostInput, 'title' | 'description' | 'visibility' | 'tags' | 'categoryId'>>

export async function updatePost(id: string, input: UpdatePostInput): Promise<ActionResult<Post>>
```

---

#### `deletePost(id)`
**Purpose:** Delete own post (or any post if admin).

```typescript
export async function deletePost(id: string): Promise<ActionResult<void>>
```

---

#### `toggleBookmark(postId)`
**Purpose:** Save or unsave a post. Idempotent upsert/delete pattern.

```typescript
export async function toggleBookmark(postId: string): Promise<ActionResult<{ saved: boolean }>>
```

**Steps:**
1. Check if bookmark exists for (userId, postId)
2. If exists → DELETE bookmark, return `{ saved: false }`
3. If not → INSERT bookmark, return `{ saved: true }`

*Note: `saves_count` on `posts` is maintained automatically by a Postgres trigger.*

---

### Auth / Profile Queries (`features/auth/queries/`)

#### `getProfile(userId)`
**Purpose:** Fetch a user's public profile.

```typescript
/** Returns a user's profile by id. */
export async function getProfile(userId: string): Promise<UserProfile | null>
```

---

#### `getUserInterests(userId)`
**Purpose:** Fetch tags selected by a user during onboarding.

```typescript
/** Returns the list of interest tags for a user. */
export async function getUserInterests(userId: string): Promise<string[]>
```

---

### Auth Server Actions (`features/auth/actions/`)

#### `updateInterests(tags)`
**Purpose:** Replace user's interest tags (onboarding + settings update).

```typescript
export async function updateInterests(tags: string[]): Promise<ActionResult<void>>
```

**Steps:**
1. Validate: 3–5 tags required
2. DELETE all existing `user_interests` for userId
3. INSERT new tags
4. Return `{ success: true }`

---

## 3. Type Definitions (Shared)

These types live in `src/types/index.ts` and are used across features:

```typescript
// Derived from database.types.ts (auto-generated)
import type { Database } from '@/types/database.types'

type PostRow = Database['public']['Tables']['posts']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']

// Extended types for API responses
export type Post = PostRow & {
  author: Pick<ProfileRow, 'id' | 'username' | 'avatar_url'>
  tags: string[]
  categories: { id: string; name: string; slug: string }[]
}

export type PostDetail = Post  // same shape, used for detail page

export type UserProfile = ProfileRow & {
  interests: string[]
  savedPosts?: Post[]  // only when fetching own profile
}

export type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string }
```

---

## 4. Constants

Defined in `src/lib/constants.ts`:

```typescript
export const DEFAULT_PAGE_SIZE = 20
export const MAX_TAGS_PER_POST = 10
export const MIN_INTEREST_TAGS = 3
export const MAX_INTEREST_TAGS = 5
export const OG_FETCH_TIMEOUT_MS = 5_000
export const SEARCH_MIN_QUERY_LENGTH = 2
```
