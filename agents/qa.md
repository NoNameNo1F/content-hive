# agent-qa — QA Agent

## Read First
- `architecture/db-schema.sql`
- `agents/skills/code-standards.md`

## Responsibility
Gate keeper. No feature ships with broken RLS. Run after every agent completes.

## The RLS Hard Gate
Run these SQL tests directly in Supabase SQL Editor after agent-backend completes migrations.
Sign off only when ALL pass.

```sql
-- Test 1: Anon user cannot see team posts
SET LOCAL role = anon;
SELECT count(*) FROM posts WHERE visibility = 'team';
-- Expected: 0

-- Test 2: Anon user can see public posts
SET LOCAL role = anon;
SELECT count(*) FROM posts WHERE visibility = 'public';
-- Expected: > 0 (if seed data exists)

-- Test 3: Authenticated user can see both
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<a-valid-user-uuid>"}';
SELECT count(*) FROM posts;
-- Expected: total count including team posts

-- Test 4: User cannot insert post as another user
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<user-a-uuid>"}';
INSERT INTO posts (user_id, title, type, visibility)
VALUES ('<user-b-uuid>', 'Hack', 'text', 'public');
-- Expected: RLS violation error

-- Test 5: User can only see own bookmarks
SET LOCAL role = authenticated;
SET LOCAL request.jwt.claims = '{"sub":"<user-a-uuid>"}';
SELECT count(*) FROM bookmarks;
-- Expected: only user-a's bookmarks
```

**Sign-off message format:**
```
✅ RLS GATE PASSED — [date]
All 5 RLS tests passed. agent-content, agent-feed, agent-search, agent-frontend cleared to proceed.
```

## Per-Feature Checklist (run after each feature agent)

### After agent-auth
- [ ] User can register with email
- [ ] User can log in and session persists across page refresh
- [ ] `/create` redirects to `/login` when not authenticated
- [ ] Profile row created in DB after signup
- [ ] Onboarding saves interests to `user_interests`

### After agent-content
- [ ] Video post with YouTube URL creates embed correctly
- [ ] Link post auto-fetches OG metadata
- [ ] Text post saves without URL
- [ ] User cannot delete another user's post (test with two accounts)
- [ ] Bookmark toggle persists after page refresh

### After agent-feed
- [ ] Member feed shows only posts matching their interest tags
- [ ] Public homepage shows zero team posts when logged out
- [ ] Sort by Popular orders by bookmark count descending
- [ ] Load More appends posts (does not replace)

### After agent-search
- [ ] Search for a word in post title returns that post
- [ ] Search for a word in description returns that post
- [ ] Logged-out search returns zero team posts
- [ ] Tag filter combined with text search narrows correctly

### After agent-frontend
- [ ] All routes load without 500 error
- [ ] Loading skeleton shows before data appears
- [ ] Empty state shows on feed with no interest-matched posts
- [ ] Admin route `/admin` blocked for member role

## Final Pre-Launch Checklist
- [ ] All per-feature checklists above passed
- [ ] `NEXT_PUBLIC_*` vars contain no secrets
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is not in any client-side code (grep for it)
- [ ] RLS enabled on all tables: `SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public'` — all rows show `true`
- [ ] App loads on mobile (375px) without horizontal scroll
- [ ] Supabase monthly cost estimate under $25

## Done When
- [ ] RLS Hard Gate signed off (written sign-off message)
- [ ] All per-feature checklists completed
- [ ] Final pre-launch checklist completed
- [ ] Bug reports filed and resolved for any failures
