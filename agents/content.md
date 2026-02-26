# agent-content — Content Agent

## Read First
- `architecture/db-schema.sql`
- `architecture/api-contracts.md`
- `agents/skills/code-standards.md`

## Gate
⛔ Do not start until agent-qa has signed off on RLS.

## Responsibility
Users can create, view, and save content. Three post types work correctly.

## Outputs

### 1. Content Creation — `src/features/content/`
```
content/
├── components/
│   ├── post-form.tsx          # Type switcher + fields
│   ├── url-input.tsx          # Input that triggers OG fetch
│   ├── tag-input.tsx          # Multi-tag input with suggestions
│   └── video-embed.tsx        # YouTube/Vimeo iframe
├── actions/
│   ├── create-post.ts         # Server Action
│   └── delete-post.ts         # Server Action
├── queries/
│   └── get-post.ts            # fetch single post by id
└── types.ts
```

### 2. Post Form Logic
Type switcher shows/hides fields:
- `video`: URL field → extract embed ID → show preview
- `link`: URL field → auto-fetch OG on blur → populate title/description
- `text`: title + rich text area only

OG fetch pattern:
```typescript
// url-input.tsx — on blur
const res = await fetch(`/api/og?url=${encodeURIComponent(url)}`)
const og = await res.json()
// populate form fields if empty
```

YouTube embed extraction:
```typescript
function getYouTubeId(url: string): string | null {
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return match?.[1] ?? null
}
// iframe src: `https://www.youtube.com/embed/${id}`
```

### 3. Server Action — `create-post.ts`
```typescript
'use server'
// 1. getUser() — throw if not authenticated
// 2. validate input (title required, URL valid if type=video|link)
// 3. insert into posts
// 4. insert tags into post_tags (bulk)
// 5. insert category into post_categories
// 6. return ActionResult<Post>
```

### 4. Content Card — `src/components/shared/post-card.tsx`
Shared across feed, search, profile. Props:
```typescript
interface PostCardProps {
  post: Post & { profiles: Profile; post_tags: { tag: string }[] }
  isBookmarked?: boolean
  onBookmark?: (id: string) => void
}
```
Renders: thumbnail/embed preview, title, author, tags, type badge, bookmark button.

### 5. Bookmark Toggle — `src/features/content/actions/toggle-bookmark.ts`
```typescript
'use server'
// upsert into bookmarks if not exists, delete if exists
// return { bookmarked: boolean }
```

### 6. Post Detail Page — `src/app/(main)/post/[id]/page.tsx`
Server component. Fetch post + related tags + author profile.
Show video embed or link preview. Show bookmark button (client component island).

## Done When
- [ ] All 3 post types create successfully and appear in DB
- [ ] OG metadata auto-populates for link posts
- [ ] YouTube embed renders in form preview and detail page
- [ ] Bookmark toggle works and persists
- [ ] PostCard component renders correctly with all post types
- [ ] Delete only available to post owner
