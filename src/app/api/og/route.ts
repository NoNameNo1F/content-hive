import { NextRequest, NextResponse } from 'next/server'
import { OG_FETCH_TIMEOUT_MS } from '@/lib/constants'

interface OgData {
  title: string | null
  description: string | null
  image: string | null
  siteName: string | null
}

function extractMeta(html: string, property: string): string | null {
  // Handles both attribute orders: property/name before content, and content before property/name
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']*?)["']`, 'i'),
    new RegExp(`<meta[^>]+content=["']([^"']*?)["'][^>]+(?:property|name)=["']${property}["']`, 'i'),
  ]
  for (const pattern of patterns) {
    const match = html.match(pattern)
    if (match?.[1]) return match[1]
  }
  return null
}

async function fetchOgMetadata(url: string): Promise<OgData> {
  const res = await fetch(url, {
    signal: AbortSignal.timeout(OG_FETCH_TIMEOUT_MS),
    headers: { 'User-Agent': 'ContentHive/1.0 OG-Fetcher' },
  })

  if (!res.ok) return { title: null, description: null, image: null, siteName: null }

  const html = await res.text()

  return {
    title: extractMeta(html, 'og:title') ?? extractMeta(html, 'twitter:title'),
    description: extractMeta(html, 'og:description') ?? extractMeta(html, 'twitter:description'),
    image: extractMeta(html, 'og:image') ?? extractMeta(html, 'twitter:image'),
    siteName: extractMeta(html, 'og:site_name'),
  }
}

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 })
  }

  try {
    new URL(url) // validate URL format
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  try {
    const data = await fetchOgMetadata(url)
    return NextResponse.json(data)
  } catch {
    // Return partial data on timeout or fetch error — never block the user
    return NextResponse.json({ title: null, description: null, image: null, siteName: null })
  }
}
