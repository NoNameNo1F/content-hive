/**
 * Strip query params and fragment from a full tiktok.com URL.
 * Short-link domains (vt.tiktok.com, vm.tiktok.com) are left untouched —
 * they are resolved server-side via the oEmbed API.
 *
 * Examples:
 *   https://www.tiktok.com/@user/video/123?is_from_webapp=1  →  https://www.tiktok.com/@user/video/123
 *   https://vt.tiktok.com/ZSm7cA7G5/                        →  (unchanged)
 */
export function cleanTiktokUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    // Short-link domains: return as-is, oEmbed resolves them server-side
    if (host === 'vt.tiktok.com' || host === 'vm.tiktok.com') return url
    // Full tiktok.com URLs: strip query params and fragment
    if (host === 'tiktok.com' || host === 'www.tiktok.com') {
      return `${parsed.origin}${parsed.pathname}`
    }
    return url
  } catch {
    return url
  }
}

/**
 * Extract the @handle from a canonical tiktok.com URL.
 *
 * Example:
 *   https://www.tiktok.com/@nguyenducduong9699/video/7286089738790898949
 *   → "@nguyenducduong9699"
 */
export function extractTiktokHandle(url: string): string | null {
  try {
    const match = url.match(/tiktok\.com\/@([^/?#]+)/)
    return match ? `@${match[1]}` : null
  } catch {
    return null
  }
}
