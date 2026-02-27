import { NextRequest, NextResponse } from 'next/server'
import { getFeedPosts, type FeedSortBy } from '@/features/feed/queries/get-feed-posts'
import type { ContentStatus } from '@/types'

const VALID_STATUSES = new Set(['available', 'in_use', 'used', 'rejected'])
const VALID_SORTS    = new Set<string>(['new', 'hot', 'top'])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId      = searchParams.get('userId') || undefined
  const page        = Number(searchParams.get('page') ?? '0')
  const sortParam   = searchParams.get('sortBy')
  const sortBy: FeedSortBy = VALID_SORTS.has(sortParam ?? '') ? (sortParam as FeedSortBy) : 'hot'
  const statusParam = searchParams.get('status')
  const status      = VALID_STATUSES.has(statusParam ?? '') ? (statusParam as ContentStatus) : undefined
  const categoryId  = searchParams.get('categoryId') || null

  try {
    const posts = await getFeedPosts({ userId, page, sortBy, status, categoryId })
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[api/feed]', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}
