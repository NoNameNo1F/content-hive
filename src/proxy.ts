import { NextResponse, type NextRequest } from 'next/server'
import { createSupabaseMiddleware } from '@/lib/supabase/middleware'

/** Routes that require authentication. Visitors are redirected to /login. */
const PROTECTED_ROUTES = ['/create', '/profile/edit', '/admin', '/onboarding']

/** Dynamic route patterns that require authentication. */
const PROTECTED_PATTERNS = [/^\/post\/[^/]+\/edit$/]

/** Routes that authenticated users should not visit (e.g. login when logged in). */
const AUTH_ROUTES = ['/login', '/register']

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createSupabaseMiddleware(request)

  // Refresh the session — must be called before any redirect logic.
  // This keeps the session cookie alive on each request.
  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Redirect unauthenticated users away from protected routes
  const isProtected =
    PROTECTED_ROUTES.some((route) => pathname.startsWith(route)) ||
    PROTECTED_PATTERNS.some((pattern) => pattern.test(pathname))

  if (!user && isProtected) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (user && AUTH_ROUTES.some((route) => pathname.startsWith(route))) {
    const feedUrl = request.nextUrl.clone()
    feedUrl.pathname = '/feed'
    return NextResponse.redirect(feedUrl)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    // Run on all paths except static assets, images, and favicon
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
