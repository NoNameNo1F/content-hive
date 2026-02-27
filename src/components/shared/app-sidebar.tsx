'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  Rss,
  BarChart2,
  Kanban,
  Network,
  Search,
  MessageSquare,
  Shield,
  Plus,
  PanelLeft,
  PanelLeftClose,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

const NAV_ITEMS = [
  { label: 'Feed',        href: '/feed',      icon: Rss },
  { label: 'Dashboard',   href: '/dashboard', icon: BarChart2 },
  { label: 'Board',       href: '/board',     icon: Kanban },
  { label: 'Graph',       href: '/graph',     icon: Network },
  { label: 'Search',      href: '/search',    icon: Search },
  { label: 'Chat',        href: '/chat',      icon: MessageSquare },
]

interface AppSidebarProps {
  isAdmin: boolean
}

export function AppSidebar({ isAdmin }: AppSidebarProps) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const saved = localStorage.getItem('sidebar-collapsed')
    if (saved !== null) setCollapsed(JSON.parse(saved))
  }, [])

  function toggle() {
    setCollapsed((v) => {
      const next = !v
      localStorage.setItem('sidebar-collapsed', JSON.stringify(next))
      return next
    })
  }

  function isActive(href: string) {
    if (href === '/feed') return pathname === '/feed'
    if (href === '/chat') return pathname === '/chat' || pathname.startsWith('/chat/')
    return pathname === href || pathname.startsWith(href + '/')
  }

  // Prevent width-flash before localStorage is read
  const width = !mounted ? 'w-56' : collapsed ? 'w-14' : 'w-56'

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r bg-background flex-shrink-0 transition-[width] duration-200 overflow-hidden',
        width,
      )}
    >
      {/* Collapse toggle row */}
      <div className={cn('flex h-14 items-center border-b px-2', collapsed ? 'justify-center' : 'justify-end')}>
        <Button
          variant="ghost"
          size="sm"
          onClick={toggle}
          className="h-8 w-8 p-0"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeft className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        {NAV_ITEMS.map(({ label, href, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            title={collapsed ? label : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
              isActive(href)
                ? 'bg-accent text-foreground'
                : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
              collapsed && 'justify-center gap-0 px-0',
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}

        {isAdmin && (
          <>
            <div className="my-2 border-t" />
            <Link
              href="/admin"
              title={collapsed ? 'Admin' : undefined}
              className={cn(
                'flex items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors',
                isActive('/admin')
                  ? 'bg-accent text-foreground'
                  : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                collapsed && 'justify-center gap-0 px-0',
              )}
            >
              <Shield className="h-4 w-4 flex-shrink-0" />
              {!collapsed && <span>Admin</span>}
            </Link>
          </>
        )}
      </nav>

      {/* New post button */}
      <div className={cn('border-t p-2')}>
        <Link
          href="/create"
          title={collapsed ? 'New post' : undefined}
          className={cn(
            'flex items-center gap-2 rounded-md px-2 py-2 text-sm font-medium transition-colors',
            'bg-primary/10 text-primary hover:bg-primary/20',
            collapsed && 'justify-center gap-0 px-0',
          )}
        >
          <Plus className="h-4 w-4 flex-shrink-0" />
          {!collapsed && <span>New post</span>}
        </Link>
      </div>
    </aside>
  )
}
