interface VideoEmbedProps {
  url: string
  autoplay?: boolean
}

function getEmbedInfo(url: string, autoplay?: boolean): { src: string; isPortrait?: boolean } | null {
  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    const params = autoplay ? '?autoplay=1&mute=1' : ''
    return { src: `https://www.youtube.com/embed/${ytMatch[1]}${params}` }
  }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return { src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }

  // Douyin: douyin.com/video/ID (must check before TikTok — both have /video/ID pattern)
  const douyinMatch = url.match(/douyin\.com\/video\/(\d+)/)
  if (douyinMatch) {
    return {
      src: `https://open.douyin.com/player/video?vid=${douyinMatch[1]}&autoplay=0`,
      isPortrait: true,
    }
  }

  // TikTok: tiktok.com/@user/video/ID
  const tiktokMatch = url.match(/tiktok\.com\/.*\/video\/(\d+)/)
  if (tiktokMatch) {
    const params = autoplay ? '?autoplay=1' : ''
    return { src: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}${params}`, isPortrait: true }
  }

  return null
}

/** Renders an iframe embed for YouTube, Vimeo, TikTok, and Douyin URLs. Returns null for unsupported URLs. */
export function VideoEmbed({ url, autoplay }: VideoEmbedProps) {
  const embedInfo = getEmbedInfo(url, autoplay)

  if (!embedInfo) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Unsupported video URL — YouTube, Vimeo, TikTok, and Douyin are supported.
      </div>
    )
  }

  // Portrait aspect ratio for TikTok and Douyin
  const containerClass = embedInfo.isPortrait
    ? 'relative w-full h-[740px] max-h-[80vh] overflow-hidden rounded-lg bg-black'
    : 'aspect-video w-full overflow-hidden rounded-lg bg-black'

  return (
    <div className={containerClass}>
      <iframe
        src={embedInfo.src}
        className="h-full w-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Video embed"
      />
    </div>
  )
}
