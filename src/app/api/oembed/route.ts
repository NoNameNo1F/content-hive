import { NextRequest, NextResponse } from 'next/server'
import { OG_FETCH_TIMEOUT_MS } from '@/lib/constants'

const ALLOWED_HOSTS = ['tiktok.com', 'www.tiktok.com']

interface OembedData {
  title: string | null
  authorName: string | null
  thumbnailUrl: string | null
  type: string | null
  hashtags: string[]
  isCarousel: boolean
}

function parseHashtags(text: string): string[] {
  const matches = text.match(/#(\w+)/g) ?? []
  return matches.map((h) => h.slice(1))
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  // SSRF guard: only allow whitelisted domains
  const hostname = parsed.hostname.toLowerCase()
  if (!ALLOWED_HOSTS.some((h) => hostname === h || hostname.endsWith(`.${h}`))) {
    return NextResponse.json({ error: 'Domain not allowed' }, { status: 400 })
  }

  const empty: OembedData = {
    title: null,
    authorName: null,
    thumbnailUrl: null,
    type: null,
    hashtags: [],
    isCarousel: false,
  }

  try {
    const apiUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
      headers: { 'User-Agent': 'ContentHive/1.0 oEmbed-Fetcher' },
    })

    if (!res.ok) return NextResponse.json(empty)

    const json = await res.json()
    const type: string | null = json.type ?? null
    const title: string | null = json.title ?? null

    const data: OembedData = {
      title,
      authorName: json.author_name ?? null,
      thumbnailUrl: json.thumbnail_url ?? null,
      type,
      hashtags: title ? parseHashtags(title) : [],
      isCarousel: type === 'photo',
    }

    return NextResponse.json(data)
  } catch {
    return NextResponse.json(empty)
  }
}
