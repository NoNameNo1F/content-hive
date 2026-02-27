interface VideoEmbedProps {
  url: string
}

function getEmbedInfo(url: string): { src: string; isTikTok?: boolean } | null {
  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return { src: `https://www.youtube.com/embed/${ytMatch[1]}` }

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return { src: `https://player.vimeo.com/video/${vimeoMatch[1]}` }

  // TikTok: tiktok.com/@user/video/ID
  const tiktokMatch = url.match(/\/video\/(\d+)/)
  if (tiktokMatch) return { src: `https://www.tiktok.com/embed/v2/${tiktokMatch[1]}`, isTikTok: true }

  return null
}

/** Renders an iframe embed for YouTube, Vimeo, and TikTok URLs. Returns null for unsupported URLs. */
export function VideoEmbed({ url }: VideoEmbedProps) {
  const embedInfo = getEmbedInfo(url)

  if (!embedInfo) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Unsupported video URL — YouTube, Vimeo, and TikTok are supported.
      </div>
    )
  }

  // TikTok embeds use a taller portrait aspect ratio
  const containerClass = embedInfo.isTikTok
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
