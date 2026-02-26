import { NextRequest, NextResponse } from 'next/server'
import { getFeedPosts } from '@/features/feed/queries/get-feed-posts'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const userId = searchParams.get('userId') || undefined
  const page = Number(searchParams.get('page') ?? '0')
  const sortBy = (searchParams.get('sortBy') as 'recent' | 'popular') ?? 'recent'

  try {
    const posts = await getFeedPosts({ userId, page, sortBy })
    return NextResponse.json(posts)
  } catch (err) {
    console.error('[api/feed]', err)
    return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 })
  }
}
