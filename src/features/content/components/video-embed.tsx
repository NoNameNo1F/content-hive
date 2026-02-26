interface VideoEmbedProps {
  url: string
}

function getEmbedUrl(url: string): string | null {
  // YouTube: watch?v=ID or youtu.be/ID
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`

  // Vimeo: vimeo.com/ID
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`

  return null
}

/** Renders an iframe embed for YouTube and Vimeo URLs. Returns null for unsupported URLs. */
export function VideoEmbed({ url }: VideoEmbedProps) {
  const embedUrl = getEmbedUrl(url)

  if (!embedUrl) {
    return (
      <div className="flex aspect-video items-center justify-center rounded-lg bg-muted text-sm text-muted-foreground">
        Unsupported video URL — only YouTube and Vimeo are supported.
      </div>
    )
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
      <iframe
        src={embedUrl}
        className="h-full w-full"
        allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        referrerPolicy="strict-origin-when-cross-origin"
        title="Video embed"
      />
    </div>
  )
}
