import { NextRequest, NextResponse } from 'next/server'
import { searchPosts } from '@/features/search/queries/search-posts'
import { SEARCH_MIN_QUERY_LENGTH } from '@/lib/constants'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const q = searchParams.get('q') ?? ''
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) ?? []
  const categoryId = searchParams.get('category') ?? undefined
  const page = Math.max(0, parseInt(searchParams.get('page') ?? '0', 10))

  if (q && q.length < SEARCH_MIN_QUERY_LENGTH) {
    return NextResponse.json(
      { error: `Query must be at least ${SEARCH_MIN_QUERY_LENGTH} characters` },
      { status: 400 }
    )
  }

  try {
    const result = await searchPosts({ q, tags, categoryId, page })
    return NextResponse.json({ ...result, page })
  } catch {
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }
}
