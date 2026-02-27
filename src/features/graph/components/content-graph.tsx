'use client'

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import {
  ReactFlow,
  Background,
  Controls,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { VideoEmbed } from '@/features/content/components/video-embed'
import type { GraphCategory, GraphPost } from '@/features/graph/queries/get-graph-data'

// ─── Video preview context ────────────────────────────────────────────────────

interface VideoPreviewCtx {
  show: (url: string, clientX: number, clientY: number) => void
  hide: () => void
}
const VideoPreviewContext = createContext<VideoPreviewCtx>({ show: () => {}, hide: () => {} })

// ─── Category colours (one per slug) ─────────────────────────────────────────

const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  'personal-story': { bg: '#7c3aed', text: '#fff' },
  collections:      { bg: '#2563eb', text: '#fff' },
  comparison:       { bg: '#d97706', text: '#fff' },
  'fact-check':     { bg: '#dc2626', text: '#fff' },
  tutorial:         { bg: '#16a34a', text: '#fff' },
  'product-story':  { bg: '#0891b2', text: '#fff' },
}
const FALLBACK_COLOR = { bg: '#6b7280', text: '#fff' }

// ─── Custom nodes ─────────────────────────────────────────────────────────────

type CatData = { label: string; slug: string; postCount: number }
type PostData = { post: GraphPost }

function CategoryNode({ data }: NodeProps) {
  const d = data as unknown as CatData
  const color = CAT_COLORS[d.slug] ?? FALLBACK_COLOR
  return (
    <div
      style={{ background: color.bg, color: color.text }}
      className="rounded-xl px-5 py-3 font-bold shadow-lg min-w-[160px] text-center select-none"
    >
      <div className="text-sm">{d.label}</div>
      <div className="text-xs mt-0.5 opacity-70">{d.postCount} post{d.postCount !== 1 ? 's' : ''}</div>
    </div>
  )
}

function PostNode({ data }: NodeProps) {
  const d = data as unknown as PostData
  const { post } = d
  const isVideo = post.type === 'video' && !!post.url
  const ctx = useContext(VideoPreviewContext)

  return (
    <div
      className="rounded-md border bg-card text-card-foreground p-2 shadow-sm w-[210px] hover:shadow-md transition-shadow"
      onMouseEnter={(e) => { if (isVideo) ctx.show(post.url!, e.clientX, e.clientY) }}
      onMouseLeave={() => { if (isVideo) ctx.hide() }}
    >
      <Link
        href={`/post/${post.id}`}
        className="line-clamp-2 text-xs font-medium leading-snug hover:underline block"
      >
        {post.title}
      </Link>
      <div className="flex items-center gap-1.5 mt-1.5">
        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 capitalize h-4">
          {post.type}
        </Badge>
        {isVideo && (
          <span className="text-[10px] text-primary">▶ hover</span>
        )}
        <span className="ml-auto text-[10px] text-muted-foreground tabular-nums">
          ▲ {post.votes_count ?? 0}
        </span>
      </div>
    </div>
  )
}

const nodeTypes = { category: CategoryNode, post: PostNode }

// ─── Layout builder ───────────────────────────────────────────────────────────

const COL_W      = 270  // horizontal spacing between category columns
const POST_W     = 210  // PostNode width
const CAT_W      = 168  // CategoryNode approximate width
const POST_START = 120  // y start for first post node
const POST_GAP   = 115  // vertical gap between post nodes
const MAX_POSTS  = 8    // cap per category

function buildElements(categories: GraphCategory[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = []
  const edges: Edge[] = []

  categories.forEach((cat, i) => {
    const colCenterX = i * COL_W + CAT_W / 2
    const catId = `cat-${cat.id}`

    nodes.push({
      id: catId,
      type: 'category',
      position: { x: i * COL_W, y: 0 },
      data: { label: cat.name, slug: cat.slug, postCount: cat.posts.length } as unknown as Record<string, unknown>,
      draggable: true,
    })

    cat.posts.slice(0, MAX_POSTS).forEach((post, j) => {
      const postId = `post-${post.id}`
      nodes.push({
        id: postId,
        type: 'post',
        position: { x: colCenterX - POST_W / 2, y: POST_START + j * POST_GAP },
        data: { post } as unknown as Record<string, unknown>,
        draggable: true,
      })
      edges.push({
        id: `e-${catId}-${postId}`,
        source: catId,
        target: postId,
        style: { stroke: '#94a3b8', strokeWidth: 1 },
      })
    })
  })

  return { nodes, edges }
}

// ─── Main component ───────────────────────────────────────────────────────────

interface ContentGraphProps {
  categories: GraphCategory[]
}

interface VideoPreviewState {
  url: string
  x: number
  y: number
}

export function ContentGraph({ categories }: ContentGraphProps) {
  const [preview, setPreview] = useState<VideoPreviewState | null>(null)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const ctxValue = useMemo<VideoPreviewCtx>(
    () => ({
      show: (url, x, y) => {
        if (hideTimer.current) clearTimeout(hideTimer.current)
        setPreview({ url, x, y })
      },
      hide: () => {
        // small delay so cursor can reach popup if needed
        hideTimer.current = setTimeout(() => setPreview(null), 150)
      },
    }),
    []
  )

  const { nodes, edges } = useMemo(() => buildElements(categories), [categories])

  const hasContent = categories.some((c) => c.posts.length > 0)

  return (
    <VideoPreviewContext.Provider value={ctxValue}>
      <div className="relative h-full w-full">
        {!hasContent && (
          <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm">
            No categorised posts yet — assign a category when creating or editing a post.
          </div>
        )}

        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={2}
          proOptions={{ hideAttribution: true }}
        >
          <Background gap={20} size={1} />
          <Controls />
        </ReactFlow>

        {/* Video preview popup — rendered in document.body via portal */}
        {preview &&
          typeof document !== 'undefined' &&
          createPortal(
            <div
              style={{
                position: 'fixed',
                left: Math.min(preview.x + 24, (typeof window !== 'undefined' ? window.innerWidth : 1200) - 360),
                top: Math.max(preview.y - 220, 16),
                zIndex: 9999,
                width: 320,
              }}
              className="rounded-xl border bg-card shadow-2xl overflow-hidden"
              onMouseEnter={() => { if (hideTimer.current) clearTimeout(hideTimer.current) }}
              onMouseLeave={() => { hideTimer.current = setTimeout(() => setPreview(null), 150) }}
            >
              <VideoEmbed url={preview.url} />
            </div>,
            document.body
          )}
      </div>
    </VideoPreviewContext.Provider>
  )
}
