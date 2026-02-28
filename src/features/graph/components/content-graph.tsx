'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  type Node,
  type Edge,
  type NodeProps,
} from '@xyflow/react'
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  type SimulationNodeDatum,
  type SimulationLinkDatum,
} from 'd3-force'
import '@xyflow/react/dist/style.css'
import Link from 'next/link'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { X, RefreshCw } from 'lucide-react'
import type { GraphCategory, GraphHashtag, GraphPost } from '@/features/graph/queries/get-graph-data'

// ─── Category colours ────────────────────────────────────────────────────────

const CAT_COLORS: Record<string, string> = {
  'personal-story':       '#7c3aed',
  'collections':          '#2563eb',
  'comparison':           '#d97706',
  'fact-check':           '#dc2626',
  'tutorial':             '#16a34a',
  'product-story':        '#0891b2',
  // Sprint 9 8-category taxonomy slugs
  'entertainment-pop-culture': '#db2777',
  'lifestyle-hobbies':         '#ea580c',
  'fashion-beauty':            '#9333ea',
  'health-wellness':           '#10b981',
  'food-cooking':              '#f59e0b',
  'education-diy':             '#0ea5e9',
  'tech-gaming':               '#6366f1',
  'professional-niche':        '#64748b',
}

function getCatColor(slug: string): string {
  if (CAT_COLORS[slug]) return CAT_COLORS[slug]
  // Deterministic hue for unknown slugs
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) % 360
  return `hsl(${h}, 60%, 45%)`
}

// ─── Node data types ──────────────────────────────────────────────────────────

type NodeKind = 'post' | 'category' | 'hashtag'

interface BaseNodeData {
  kind: NodeKind
  label: string
}
interface PostNodeData extends BaseNodeData {
  kind: 'post'
  post: GraphPost
  categoryColor: string
  radius: number
}
interface CategoryNodeData extends BaseNodeData {
  kind: 'category'
  slug: string
  postCount: number
  color: string
}
interface HashtagNodeData extends BaseNodeData {
  kind: 'hashtag'
  tag: string
}

// ─── Custom node components ───────────────────────────────────────────────────

function PostNode({ data, selected }: NodeProps) {
  const d = data as unknown as PostNodeData
  const size = d.radius * 2
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: d.categoryColor,
        border: selected ? '2px solid white' : '1.5px solid rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: selected ? '0 0 0 3px rgba(255,255,255,0.5)' : '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'box-shadow 0.15s',
        position: 'relative',
      }}
      title={d.post.title}
    />
  )
}

function CategoryNode({ data }: NodeProps) {
  const d = data as unknown as CategoryNodeData
  const size = 72
  const r = size / 2
  // Hexagon points
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i - Math.PI / 6
    return `${r + r * Math.cos(a)},${r + r * Math.sin(a)}`
  }).join(' ')
  return (
    <div style={{ width: size, height: size, position: 'relative' }} title={d.label}>
      <svg width={size} height={size} style={{ position: 'absolute', inset: 0 }}>
        <polygon points={pts} fill={d.color} stroke="rgba(255,255,255,0.3)" strokeWidth={2} />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          padding: '8px',
        }}
      >
        <span style={{ fontSize: 9, fontWeight: 700, textAlign: 'center', lineHeight: 1.2 }}>
          {d.label}
        </span>
        <span style={{ fontSize: 8, opacity: 0.8, marginTop: 2 }}>
          {d.postCount}
        </span>
      </div>
    </div>
  )
}

function HashtagNode({ data }: NodeProps) {
  const d = data as unknown as HashtagNodeData
  const [hov, setHov] = useState(false)
  return (
    <div
      style={{
        width: 18,
        height: 18,
        background: '#94a3b8',
        transform: 'rotate(45deg)',
        border: '1px solid #64748b',
        cursor: 'pointer',
        position: 'relative',
      }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      title={`#${d.tag}`}
    >
      {hov && (
        <span
          style={{
            position: 'absolute',
            top: -24,
            left: '50%',
            transform: 'translateX(-50%) rotate(-45deg)',
            background: 'rgba(0,0,0,0.75)',
            color: '#fff',
            fontSize: 10,
            padding: '2px 6px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          #{d.tag}
        </span>
      )}
    </div>
  )
}

const nodeTypes = { post: PostNode, category: CategoryNode, hashtag: HashtagNode }

// ─── d3-force simulation ──────────────────────────────────────────────────────

interface SimNode extends SimulationNodeDatum {
  id: string
}
interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string
  target: string
}

function runSimulation(simNodes: SimNode[], simLinks: SimLink[]): Map<string, { x: number; y: number }> {
  const nodeCopy = simNodes.map((n) => ({ ...n }))
  const sim = forceSimulation<SimNode>(nodeCopy)
    .force(
      'link',
      forceLink<SimNode, SimLink>(simLinks.map((l) => ({ ...l })))
        .id((d) => d.id)
        .distance(110)
        .strength(0.4)
    )
    .force('charge', forceManyBody<SimNode>().strength(-250))
    .force('center', forceCenter(0, 0))
    .force('collide', forceCollide<SimNode>(45))
    .stop()

  for (let i = 0; i < 400; i++) sim.tick()

  const positions = new Map<string, { x: number; y: number }>()
  for (const n of nodeCopy) {
    positions.set(n.id, { x: n.x ?? 0, y: n.y ?? 0 })
  }
  return positions
}

// ─── Build React Flow elements from graph data ────────────────────────────────

const MAX_POSTS = 12
const MAX_HASHTAGS = 40

function buildElements(
  categories: GraphCategory[],
  hashtags: GraphHashtag[]
): { nodes: Node[]; edges: Edge[] } {
  const simNodes: SimNode[] = []
  const simLinks: SimLink[] = []

  // Build a map from postId → categoryColor + saves_count
  const postCategoryMap = new Map<string, { color: string; saves: number }>()

  // Category nodes
  for (const cat of categories) {
    const color = getCatColor(cat.slug)
    simNodes.push({ id: `cat-${cat.id}` })
    for (const post of cat.posts.slice(0, MAX_POSTS)) {
      postCategoryMap.set(post.id, { color, saves: post.saves_count ?? 0 })
    }
  }

  // Post nodes (deduplicated — a post may be in multiple categories)
  const addedPosts = new Set<string>()
  for (const cat of categories) {
    for (const post of cat.posts.slice(0, MAX_POSTS)) {
      if (!addedPosts.has(post.id)) {
        simNodes.push({ id: `post-${post.id}` })
        addedPosts.add(post.id)
      }
      simLinks.push({ source: `cat-${cat.id}`, target: `post-${post.id}` })
    }
  }

  // Hashtag nodes (capped)
  const topHashtags = hashtags
    .filter((h) => h.postIds.some((pid) => addedPosts.has(pid)))
    .sort((a, b) => b.postIds.length - a.postIds.length)
    .slice(0, MAX_HASHTAGS)

  for (const h of topHashtags) {
    simNodes.push({ id: `tag-${h.tag}` })
    for (const pid of h.postIds) {
      if (addedPosts.has(pid)) {
        simLinks.push({ source: `post-${pid}`, target: `tag-${h.tag}` })
      }
    }
  }

  // Run simulation
  const positions = runSimulation(simNodes, simLinks)

  const nodes: Node[] = []
  const edges: Edge[] = []

  // Category nodes
  for (const cat of categories) {
    const id = `cat-${cat.id}`
    const pos = positions.get(id) ?? { x: 0, y: 0 }
    const color = getCatColor(cat.slug)
    nodes.push({
      id,
      type: 'category',
      position: pos,
      data: {
        kind: 'category',
        label: cat.name,
        slug: cat.slug,
        postCount: cat.posts.length,
        color,
      } as unknown as Record<string, unknown>,
      draggable: true,
    })
  }

  // Post nodes
  for (const cat of categories) {
    for (const post of cat.posts.slice(0, MAX_POSTS)) {
      if (nodes.find((n) => n.id === `post-${post.id}`)) continue
      const id = `post-${post.id}`
      const pos = positions.get(id) ?? { x: 0, y: 0 }
      const { color, saves } = postCategoryMap.get(post.id) ?? { color: '#6b7280', saves: 0 }
      const radius = Math.min(Math.max(14, saves * 4), 40)
      nodes.push({
        id,
        type: 'post',
        position: pos,
        data: { kind: 'post', label: post.title, post, categoryColor: color, radius } as unknown as Record<string, unknown>,
        draggable: true,
      })
      // post → category edge
      edges.push({
        id: `e-cat-${cat.id}-${post.id}`,
        source: `cat-${cat.id}`,
        target: id,
        style: { stroke: '#94a3b8', strokeWidth: 1.5 },
      })
    }
  }

  // Hashtag nodes + post→hashtag edges
  for (const h of topHashtags) {
    const id = `tag-${h.tag}`
    const pos = positions.get(id) ?? { x: 0, y: 0 }
    nodes.push({
      id,
      type: 'hashtag',
      position: pos,
      data: { kind: 'hashtag', label: `#${h.tag}`, tag: h.tag } as unknown as Record<string, unknown>,
      draggable: true,
    })
    for (const pid of h.postIds) {
      if (!addedPosts.has(pid)) continue
      edges.push({
        id: `e-tag-${h.tag}-${pid}`,
        source: `post-${pid}`,
        target: id,
        style: { stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 2' },
      })
    }
  }

  return { nodes, edges }
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

interface DetailPanelProps {
  nodeId: string | null
  categories: GraphCategory[]
  hashtags: GraphHashtag[]
  onClose: () => void
}

function DetailPanel({ nodeId, categories, hashtags, onClose }: DetailPanelProps) {
  if (!nodeId) return null

  if (nodeId.startsWith('cat-')) {
    const catId = nodeId.slice(4)
    const cat = categories.find((c) => c.id === catId)
    if (!cat) return null
    return (
      <PanelShell onClose={onClose}>
        <div
          className="h-3 rounded-t-lg"
          style={{ background: getCatColor(cat.slug) }}
        />
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Category</p>
            <h2 className="font-bold text-base">{cat.name}</h2>
            <p className="text-xs text-muted-foreground">{cat.posts.length} post{cat.posts.length !== 1 ? 's' : ''}</p>
          </div>
          {cat.posts.length > 0 && (
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Top posts</p>
              {cat.posts.slice(0, 5).map((p) => (
                <Link
                  key={p.id}
                  href={`/post/${p.id}`}
                  className="block text-xs hover:underline line-clamp-1"
                >
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </PanelShell>
    )
  }

  if (nodeId.startsWith('post-')) {
    const postId = nodeId.slice(5)
    let post: GraphPost | null = null
    let catColor = '#6b7280'
    for (const cat of categories) {
      const found = cat.posts.find((p) => p.id === postId)
      if (found) { post = found; catColor = getCatColor(cat.slug); break }
    }
    if (!post) return null
    return (
      <PanelShell onClose={onClose}>
        {post.thumbnail && (
          <div className="relative h-36 w-full overflow-hidden rounded-t-lg bg-muted">
            <Image src={post.thumbnail} alt={post.title} fill className="object-cover" sizes="320px" />
          </div>
        )}
        {!post.thumbnail && (
          <div className="h-3 rounded-t-lg" style={{ background: catColor }} />
        )}
        <div className="p-4 space-y-3">
          <div>
            <Badge variant="secondary" className="capitalize text-xs mb-1">{post.type}</Badge>
            <h2 className="font-bold text-sm leading-snug">{post.title}</h2>
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>▲ {post.votes_count ?? 0} votes</span>
            <span>{post.saves_count ?? 0} saves</span>
          </div>
          <Button asChild size="sm" className="w-full">
            <Link href={`/post/${postId}`}>Open post →</Link>
          </Button>
        </div>
      </PanelShell>
    )
  }

  if (nodeId.startsWith('tag-')) {
    const tag = nodeId.slice(4)
    const hashtagData = hashtags.find((h) => h.tag === tag)
    const linkedPosts: GraphPost[] = []
    if (hashtagData) {
      for (const cat of categories) {
        for (const p of cat.posts) {
          if (hashtagData.postIds.includes(p.id) && !linkedPosts.find((lp) => lp.id === p.id)) {
            linkedPosts.push(p)
          }
        }
      }
    }
    return (
      <PanelShell onClose={onClose}>
        <div className="h-3 rounded-t-lg bg-slate-400" />
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Hashtag</p>
            <h2 className="font-bold text-base">#{tag}</h2>
            <p className="text-xs text-muted-foreground">{linkedPosts.length} post{linkedPosts.length !== 1 ? 's' : ''}</p>
          </div>
          {linkedPosts.length > 0 && (
            <div className="space-y-1">
              {linkedPosts.slice(0, 6).map((p) => (
                <Link key={p.id} href={`/post/${p.id}`} className="block text-xs hover:underline line-clamp-1">
                  {p.title}
                </Link>
              ))}
            </div>
          )}
        </div>
      </PanelShell>
    )
  }

  return null
}

function PanelShell({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="absolute right-0 top-0 h-full w-80 border-l bg-card z-10 overflow-y-auto rounded-r-xl shadow-xl">
      <button
        onClick={onClose}
        className="absolute right-3 top-3 z-20 rounded-full p-1 hover:bg-muted transition-colors"
        aria-label="Close panel"
      >
        <X size={14} />
      </button>
      {children}
    </div>
  )
}

// ─── Filter chip bar ──────────────────────────────────────────────────────────

type FilterKind = 'all' | NodeKind

// ─── Main component ───────────────────────────────────────────────────────────

interface ContentGraphProps {
  categories: GraphCategory[]
  hashtags: GraphHashtag[]
}

export function ContentGraph({ categories, hashtags }: ContentGraphProps) {
  const [filter, setFilter] = useState<FilterKind>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildElements(categories, hashtags),
    [categories, hashtags]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  // Connected node/edge IDs for hover highlighting
  const connectedIds = useMemo(() => {
    if (!hoveredId) return null
    const nodeIds = new Set<string>([hoveredId])
    const edgeIds = new Set<string>()
    for (const e of edges) {
      const src = typeof e.source === 'string' ? e.source : (e.source as unknown as { id: string }).id
      const tgt = typeof e.target === 'string' ? e.target : (e.target as unknown as { id: string }).id
      if (src === hoveredId || tgt === hoveredId) {
        edgeIds.add(e.id)
        nodeIds.add(src)
        nodeIds.add(tgt)
      }
    }
    return { nodeIds, edgeIds }
  }, [hoveredId, edges])

  // Apply visibility + opacity based on filter + hover
  const visibleNodes = useMemo(() => nodes.map((n) => {
    const d = n.data as unknown as BaseNodeData
    const hidden = filter !== 'all' && d.kind !== filter
    let opacity: number | undefined
    if (connectedIds && !hidden) {
      opacity = connectedIds.nodeIds.has(n.id) ? 1 : 0.1
    }
    return { ...n, hidden, style: { ...n.style, opacity } }
  }), [nodes, filter, connectedIds])

  const visibleEdges = useMemo(() => edges.map((e) => {
    const srcId = typeof e.source === 'string' ? e.source : (e.source as unknown as { id: string }).id
    const tgtId = typeof e.target === 'string' ? e.target : (e.target as unknown as { id: string }).id
    const srcNode = nodes.find((n) => n.id === srcId)
    const tgtNode = nodes.find((n) => n.id === tgtId)
    const srcKind = (srcNode?.data as unknown as BaseNodeData)?.kind
    const tgtKind = (tgtNode?.data as unknown as BaseNodeData)?.kind
    const hidden = filter !== 'all' && (srcKind !== filter && tgtKind !== filter)
    let opacity: number | undefined
    if (connectedIds && !hidden) {
      opacity = connectedIds.edgeIds.has(e.id) ? 1 : 0.05
    }
    return { ...e, hidden, style: { ...e.style, opacity } }
  }), [edges, filter, connectedIds, nodes])

  const handleRecalculate = useCallback(() => {
    const { nodes: newNodes, edges: newEdges } = buildElements(categories, hashtags)
    setNodes(newNodes)
    setEdges(newEdges)
    setSelectedId(null)
  }, [categories, hashtags, setNodes, setEdges])

  const hasContent = categories.some((c) => c.posts.length > 0)

  const filterOptions: { label: string; value: FilterKind }[] = [
    { label: 'All', value: 'all' },
    { label: 'Posts', value: 'post' },
    { label: 'Categories', value: 'category' },
    { label: 'Hashtags', value: 'hashtag' },
  ]

  return (
    <div className="relative h-full w-full">
      {!hasContent && (
        <div className="absolute inset-0 flex items-center justify-center text-muted-foreground text-sm z-10">
          No categorised posts yet — assign a category when creating or editing a post.
        </div>
      )}

      {/* Filter chips + Recalculate */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-2 flex-wrap">
        {filterOptions.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setFilter(opt.value)}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              filter === opt.value
                ? 'bg-foreground text-background border-foreground'
                : 'bg-card text-muted-foreground border-border hover:bg-muted'
            }`}
          >
            {opt.label}
          </button>
        ))}
        <button
          onClick={handleRecalculate}
          className="flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors"
        >
          <RefreshCw size={10} />
          Recalculate
        </button>
      </div>

      <ReactFlow
        nodes={visibleNodes}
        edges={visibleEdges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={(_, node) => setSelectedId((prev) => (prev === node.id ? null : node.id))}
        onNodeMouseEnter={(_, node) => setHoveredId(node.id)}
        onNodeMouseLeave={() => setHoveredId(null)}
        onPaneClick={() => setSelectedId(null)}
        fitView
        fitViewOptions={{ padding: 0.15 }}
        minZoom={0.1}
        maxZoom={2}
        proOptions={{ hideAttribution: true }}
      >
        <Background gap={20} size={1} />
        <Controls />
      </ReactFlow>

      {/* Detail panel */}
      {selectedId && (
        <DetailPanel
          nodeId={selectedId}
          categories={categories}
          hashtags={hashtags}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  )
}
