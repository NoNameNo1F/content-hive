import { Suspense } from 'react'
import { createSupabaseServer } from '@/lib/supabase/server'
import { searchPosts } from '@/features/search/queries/search-posts'
import { SearchBar } from '@/features/search/components/search-bar'
import { SearchFilters } from '@/features/search/components/search-filters'
import { SearchResults } from '@/features/search/components/search-results'
import type { Category, ContentStatus } from '@/types'

export const metadata = { title: 'Search — ContentHive' }

const VALID_STATUSES = new Set(['available', 'in_use', 'used', 'rejected'])

interface SearchPageProps {
  searchParams: Promise<{
    q?: string
    tags?: string | string[]
    categoryId?: string
    status?: string
    page?: string
  }>
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams
  const q = params.q ?? ''
  const tags = params.tags
    ? Array.isArray(params.tags)
      ? params.tags
      : [params.tags]
    : []
  const categoryId = params.categoryId
  const status = VALID_STATUSES.has(params.status ?? '') ? (params.status as ContentStatus) : undefined
  const page = Number(params.page ?? '0')

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const [{ posts, total }, categoriesResult] = await Promise.all([
    searchPosts({ q, tags, categoryId, status, page }),
    supabase.from('categories').select('id, name, slug, created_at').order('name'),
  ])

  const categories = (categoriesResult.data ?? []) as Category[]

  // Fetch bookmarked IDs for authenticated user
  let bookmarkedIds: string[] = []
  if (user && posts.length > 0) {
    const postIds = posts.map((p) => p.id)
    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', user.id)
      .in('post_id', postIds)
    bookmarkedIds = bookmarks?.map((b) => b.post_id) ?? []
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Search</h1>
        <p className="text-muted-foreground">
          Find posts by keyword, tag, or category.
        </p>
      </div>

      <Suspense>
        <SearchBar />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        {/* Filters sidebar */}
        <aside>
          <Suspense>
            <SearchFilters categories={categories} />
          </Suspense>
        </aside>

        {/* Results */}
        <SearchResults
          posts={posts}
          total={total}
          bookmarkedIds={bookmarkedIds}
          currentUserId={user?.id ?? null}
          query={q}
        />
      </div>
    </div>
  )
}
