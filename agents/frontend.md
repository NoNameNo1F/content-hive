# agent-frontend — Frontend Agent

## Read First
- `architecture/api-contracts.md`
- `agents/skills/code-standards.md`

## Gate
⛔ Do not start page assembly until all feature agents (content, feed, search, auth) are done.
✅ Can build layout, nav, and shared components in parallel with feature agents.

## Responsibility
Pages compose feature components. Navigation works. UI is clean and consistent.

## Outputs

### 1. Layout — `src/app/(main)/layout.tsx`
- Top nav: logo, search bar, create button (members only), user avatar/login
- Responsive: mobile nav collapses to hamburger
- Uses `getUserRole()` to conditionally show member-only nav items

### 2. Pages (compose feature components — minimal logic here)

| Route | Component | Auth |
|-------|-----------|------|
| `/` | Public feed + signup CTA | None |
| `/feed` | Interest-based feed + sort toggle | Member |
| `/search` | Search bar + filters + results | None (scoped by RLS) |
| `/post/[id]` | Post detail + embed + bookmark | None (scoped by RLS) |
| `/create` | Post creation form | Member |
| `/profile/[id]` | User profile + saved posts | None |
| `/onboarding` | Interest tag selector | Member (first login) |
| `/login` | Login form | Visitor only |
| `/register` | Register form | Visitor only |
| `/admin` | Content moderation list | Admin |

### 3. Shared Components — `src/components/shared/`
```
shared/
├── post-card.tsx          # Used in feed, search, profile (built by agent-content)
├── tag-badge.tsx          # Pill tag display
├── category-badge.tsx     # Category label
├── empty-state.tsx        # Reusable empty state with icon + message
├── loading-skeleton.tsx   # Card skeleton for loading states
├── pagination.tsx         # Load More button
└── user-avatar.tsx        # Avatar with fallback initials
```

### 4. shadcn/ui Components to Install
```bash
npx shadcn@latest add button input label card badge
npx shadcn@latest add dropdown-menu sheet avatar separator
npx shadcn@latest add toast skeleton tabs
```

### 5. Token-Efficient UI Pattern
Use server components for data fetching, client components only for interactivity:

```typescript
// page.tsx — server component (no 'use client')
export default async function FeedPage() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  const posts = await getFeedPosts({ userId: user?.id })
  return <FeedList initialPosts={posts} userId={user?.id} />
}

// feed-list.tsx — client component (only this hydrates)
'use client'
export function FeedList({ initialPosts, userId }: FeedListProps) {
  const [posts, setPosts] = useState(initialPosts)
  // handle load more, sort change
}
```

### 6. Error + Loading States
Every page must handle:
- Loading: use `loading.tsx` in each route folder (Next.js convention) with skeleton
- Error: use `error.tsx` with retry button
- Empty: use `<EmptyState>` component with contextual message

## Done When
- [ ] All routes in the table above render without error
- [ ] Nav shows correct items based on auth role
- [ ] All pages have loading and error states
- [ ] No page file contains Supabase queries (delegated to feature queries/)
- [ ] Mobile layout is usable (not broken) on 375px width
