import { createSupabaseServer } from '@/lib/supabase/server'
import { AppHeader } from '@/components/shared/app-header'
import { AppSidebar } from '@/components/shared/app-sidebar'

export default async function MainLayout({ children }: { children: React.ReactNode }) {
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
      navUser = { id: user.id, username: profile.username, avatarUrl: profile.avatar_url }
      isAdmin = profile.role === 'admin'
    }
  }

  return (
    <div className="flex h-screen flex-col bg-background">
      <AppHeader user={navUser} isAdmin={isAdmin} />

      <div className="flex flex-1 min-h-0">
        <AppSidebar isAdmin={isAdmin} />

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto max-w-5xl px-4 py-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
