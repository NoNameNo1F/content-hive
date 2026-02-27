'use client'

import Link from 'next/link'
import { useState } from 'react'
import {
  Rss,
  BarChart2,
  Kanban,
  Network,
  Search,
  MessageSquare,
  Shield,
  Plus,
  LogOut,
  User,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { UserAvatar } from '@/components/shared/user-avatar'
import { signOut } from '@/features/auth/actions/sign-out'

const MOBILE_NAV = [
  { label: 'Feed',        href: '/feed',      icon: Rss },
  { label: 'Dashboard',   href: '/dashboard', icon: BarChart2 },
  { label: 'Board',       href: '/board',     icon: Kanban },
  { label: 'Graph',       href: '/graph',     icon: Network },
  { label: 'Search',      href: '/search',    icon: Search },
  { label: 'Chat',        href: '/chat',      icon: MessageSquare },
]

interface AppHeaderMenuProps {
  user: { id: string; username: string; avatarUrl: string | null } | null
  isAdmin: boolean
}

export function AppHeaderMenu({ user, isAdmin }: AppHeaderMenuProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user) return null

  return (
    <div className="flex items-center gap-1">
      {/* Desktop: avatar dropdown — Profile, Settings, Sign out only */}
      <div className="hidden sm:block">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label="User menu"
            >
              <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <div className="px-2 py-1.5 text-xs text-muted-foreground truncate">
              {user.username}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/profile/${user.id}`} className="flex items-center gap-2">
                <User className="h-3.5 w-3.5" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={signOut} className="w-full">
                <button type="submit" className="flex w-full items-center gap-2 text-sm">
                  <LogOut className="h-3.5 w-3.5" /> Sign out
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Mobile: hamburger → Sheet with full nav */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="sm" className="sm:hidden h-8 w-8 p-0">
            <span className="text-base">☰</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetHeader className="border-b p-4">
            <SheetTitle className="text-left text-sm font-bold tracking-tight">ContentHive</SheetTitle>
          </SheetHeader>

          {/* User info */}
          <div className="flex items-center gap-3 border-b px-4 py-3">
            <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
            <span className="text-sm font-medium truncate">{user.username}</span>
          </div>

          {/* Nav links */}
          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {MOBILE_NAV.map(({ label, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                {label}
              </Link>
            ))}

            {isAdmin && (
              <>
                <div className="my-2 border-t" />
                <Link
                  href="/admin"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
                >
                  <Shield className="h-4 w-4 flex-shrink-0" />
                  Admin
                </Link>
              </>
            )}
          </nav>

          {/* Bottom actions */}
          <div className="border-t p-3 space-y-2">
            <Link
              href="/create"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <Plus className="h-4 w-4" />
              New post
            </Link>
            <Link
              href={`/profile/${user.id}`}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
            >
              <User className="h-4 w-4" />
              Profile
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm font-medium text-muted-foreground hover:bg-accent/50 hover:text-foreground transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
