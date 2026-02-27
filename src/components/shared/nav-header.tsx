import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { NavMenu } from '@/components/shared/nav-menu'
import { ThemeToggle } from '@/components/shared/theme-toggle'

export async function NavHeader() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  let navUser: { id: string; username: string; avatarUrl: string | null } | null = null
  let isAdmin = false

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('username, avatar_url, role')
      .eq('id', user.id)
      .single()

    if (profile) {
      navUser = {
        id: user.id,
        username: profile.username,
        avatarUrl: profile.avatar_url,
      }
      isAdmin = profile.role === 'admin'
    }
  }

  return (
    <header className="border-b bg-background">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link href={user ? '/feed' : '/'} className="text-lg font-bold tracking-tight">
          ContentHive
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <NavMenu user={navUser} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  )
}
