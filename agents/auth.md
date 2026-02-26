# agent-auth — Auth Agent

## Read First
- `architecture/db-schema.sql`
- `agents/skills/code-standards.md`

## Responsibility
Auth works before any feature is built. Roles are enforced. Onboarding captures interests.

## Outputs

### 1. Supabase Client Setup
`src/lib/supabase/client.ts` — browser client
`src/lib/supabase/server.ts` — server component client
`src/lib/supabase/middleware.ts` — middleware client

Use `@supabase/ssr` package only. No legacy `@supabase/auth-helpers`.

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database.types'

export function createSupabaseServer() {
  const cookieStore = cookies()
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(),
                 setAll: (c) => c.forEach(({ name, value, options }) =>
                   cookieStore.set(name, value, options)) }}
  )
}
```

### 2. Middleware — `src/middleware.ts`
- Refresh session on every request
- Redirect unauthenticated users away from protected routes
- Protected routes: `/create`, `/profile/edit`, `/admin`

```typescript
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/og).*)']
}
```

### 3. Role System
Roles live in `profiles.role` column: `visitor | member | admin`

```typescript
// src/lib/auth/get-role.ts
export async function getUserRole() {
  const supabase = createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return 'visitor'
  const { data } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()
  return data?.role ?? 'member'
}
```

Trigger to auto-create profile on signup:
```sql
-- In a migration file
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, username, role)
  VALUES (NEW.id, NEW.email, 'member');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 4. Onboarding Flow
Route: `/onboarding` — shown once after first login if `user_interests` is empty.

- Display tag cloud of available tags (fetch distinct tags from `post_tags`)
- User selects 3–5 tags minimum
- Save to `user_interests` table
- Redirect to `/feed`

Component: `src/features/auth/components/interest-selector.tsx`
Action: `src/features/auth/actions/save-interests.ts`

### 5. RBAC Utility
```typescript
// src/lib/auth/require-role.ts
export async function requireRole(minimum: 'member' | 'admin') {
  const role = await getUserRole()
  if (minimum === 'admin' && role !== 'admin')
    redirect('/feed')
  if (minimum === 'member' && role === 'visitor')
    redirect('/login')
}
```

## Done When
- [ ] All 3 Supabase client files created
- [ ] `middleware.ts` refreshes session and protects routes
- [ ] Profile auto-created on signup via DB trigger
- [ ] `getUserRole()` and `requireRole()` exported from `src/lib/auth/`
- [ ] Onboarding page renders, saves interests, redirects to feed
- [ ] Login / register pages functional
