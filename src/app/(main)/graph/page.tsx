import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getGraphData } from '@/features/graph/queries/get-graph-data'
import { ContentGraph } from '@/features/graph/components/content-graph'

export const metadata = { title: 'Content Map — ContentHive' }

export default async function GraphPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const graphData = await getGraphData()

  return (
    <div className="flex flex-col gap-4" style={{ height: 'calc(100vh - 8rem)' }}>
      <div className="space-y-0.5 shrink-0">
        <h1 className="text-2xl font-bold tracking-tight">Content Map</h1>
        <p className="text-sm text-muted-foreground">
          Explore your content network — posts, categories, and hashtags as connected nodes.
        </p>
      </div>

      <div className="flex-1 rounded-xl border overflow-hidden">
        <ContentGraph categories={graphData.categories} hashtags={graphData.hashtags} />
      </div>
    </div>
  )
}
