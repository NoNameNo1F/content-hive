import { NextRequest, NextResponse } from 'next/server'

/**
 * GET /api/resolve-url?url=<encoded-url>
 *
 * Follows HTTP redirects server-side and returns the final resolved URL.
 * Used primarily to expand Douyin short links (v.douyin.com/xxx) into
 * their full form (douyin.com/video/1234567890) so VideoEmbed can extract
 * the numeric video ID needed for the open.douyin.com embed player.
 */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url')
  if (!raw) {
    return NextResponse.json({ error: 'url param required' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // Only allow Douyin short-link domains to keep the surface small
  const allowed = ['v.douyin.com', 'www.douyin.com', 'douyin.com']
  if (!allowed.includes(parsed.hostname)) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 })
  }

  try {
    const res = await fetch(raw, {
      method: 'HEAD',
      redirect: 'follow',
      // Mimic a mobile browser so the redirect chain completes
      headers: {
        'User-Agent':
          'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
      },
    })
    const resolved = res.url
    return NextResponse.json({ url: resolved })
  } catch {
    return NextResponse.json({ error: 'Failed to resolve URL' }, { status: 502 })
  }
}
