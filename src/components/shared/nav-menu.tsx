'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { UserAvatar } from '@/components/shared/user-avatar'
import { signOut } from '@/features/auth/actions/sign-out'

interface NavMenuProps {
  user: { id: string; username: string; avatarUrl: string | null } | null
  isAdmin: boolean
}

export function NavMenu({ user, isAdmin }: NavMenuProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [mobileOpen, setMobileOpen] = useState(false)

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setMobileOpen(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {/* Search — desktop only */}
      <form onSubmit={handleSearch} className="hidden sm:flex">
        <Input
          type="search"
          placeholder="Search…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-8 w-44"
        />
      </form>

      {user ? (
        <>
          {/* Create button — desktop */}
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
            <Link href="/create">+ New post</Link>
          </Button>

          {/* Avatar dropdown — desktop */}
          <div className="hidden sm:block">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <UserAvatar username={user.username} avatarUrl={user.avatarUrl} size="sm" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem asChild>
                  <Link href={`/profile/${user.id}`}>Profile</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/board">Board</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/chat">Chat</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/create">New post</Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">Admin</Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signOut} className="w-full">
                    <button type="submit" className="w-full text-left text-sm">
                      Sign out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="sm:hidden px-2">
                <span className="text-lg">☰</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <form onSubmit={handleSearch}>
                  <Input
                    type="search"
                    placeholder="Search…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </form>
                <Link
                  href="/feed"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Feed
                </Link>
                <Link
                  href="/board"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Board
                </Link>
                <Link
                  href="/chat"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  href="/create"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  New post
                </Link>
                <Link
                  href={`/profile/${user.id}`}
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Profile
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    className="text-sm font-medium hover:underline"
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin
                  </Link>
                )}
                <form action={signOut}>
                  <Button variant="outline" size="sm" type="submit" className="w-full">
                    Sign out
                  </Button>
                </form>
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : (
        <>
          {/* Unauthenticated — desktop */}
          <div className="hidden sm:flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Get started</Link>
            </Button>
          </div>

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="sm" className="sm:hidden px-2">
                <span className="text-lg">☰</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-6 flex flex-col gap-4">
                <form onSubmit={handleSearch}>
                  <Input
                    type="search"
                    placeholder="Search…"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="w-full"
                  />
                </form>
                <Link
                  href="/login"
                  className="text-sm font-medium hover:underline"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign in
                </Link>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link href="/register">Get started</Link>
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  )
}
