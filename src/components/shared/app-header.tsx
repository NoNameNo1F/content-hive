import Link from 'next/link'
import { ThemeToggle } from '@/components/shared/theme-toggle'
import { AppHeaderMenu } from '@/components/shared/app-header-menu'

interface AppHeaderProps {
  user: { id: string; username: string; avatarUrl: string | null } | null
  isAdmin: boolean
}

export function AppHeader({ user, isAdmin }: AppHeaderProps) {
  return (
    <header className="flex h-14 flex-shrink-0 items-center border-b bg-background px-4">
      <div className="flex flex-1 items-center justify-between">
        <Link href="/feed" className="text-sm font-bold tracking-tight">
          ContentHive
        </Link>

        <div className="flex items-center gap-1">
          <ThemeToggle />
          <AppHeaderMenu user={user} isAdmin={isAdmin} />
        </div>
      </div>
    </header>
  )
}
