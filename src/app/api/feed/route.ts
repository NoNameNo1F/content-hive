import { NextRequest, NextResponse } from 'next/server'
import { getFeedPosts } from '@/features/feed/queries/get-feed-posts'
import type { ContentStatus } from '@/types'

const VALID_STATUSES = new Set(['available', 'in_use', 'used', 'rejected'])

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId') || undefined
  const page = Number(searchParams.get('page') ?? '0')
  const sortBy = (searchParams.get('sortBy') as 'recent' | 'popular') ?? 'recent'
  const statusParam = searchParams.get('status')
  const status = VALID_STATUSES.has(statusParam ?? '') ? (statusParam as ContentStatus) : undefined

  try {
    const posts = await getFeedPosts({ userId, page, sortBy, status })
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[api/feed]', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}
