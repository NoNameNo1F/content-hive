import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { Bookmark, Sparkles, Kanban, Network, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'Welcome to ContentHive' }

const STEPS = [
  {
    icon: Bookmark,
    title: 'Save content, instantly',
    desc: 'Paste any URL — article, YouTube, TikTok, Douyin. ContentHive resolves it and adds it to the shared library in one click.',
    hint: 'Try: click "+ New post" in the nav',
  },
  {
    icon: Sparkles,
    title: 'Your feed is personalised',
    desc: 'Based on the interests you just selected, your feed ranks the most relevant team content first — not just the latest.',
    hint: 'Try: open the Feed and explore',
  },
  {
    icon: Kanban,
    title: 'Track content through its lifecycle',
    desc: 'Every post moves through Available → In Use → Used → Rejected. The Board view shows you the full workflow at a glance.',
    hint: 'Try: open the Board in the nav',
  },
  {
    icon: Network,
    title: 'See the big picture',
    desc: 'The Content Map shows your entire library as an interactive graph, organised by content format. Hover a post to preview it.',
    hint: 'Try: open the Graph in the nav',
  },
]

export default async function OnboardingTourPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', user.id)
    .single()

  const firstName = profile?.username?.split(' ')[0] ?? 'there'

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Progress bar — visually complete since this is the final step */}
      <div className="h-1 w-full bg-muted">
        <div className="h-1 w-full bg-primary transition-all" />
      </div>

      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        {/* Header */}
        <div className="mb-12 space-y-3 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Interests saved
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome, {firstName}. Here&apos;s what you can do.
          </h1>
          <p className="text-muted-foreground">
            ContentHive is your team&apos;s shared content library. Here are the four things to know.
          </p>
        </div>

        {/* Feature steps */}
        <div className="space-y-4">
          {STEPS.map(({ icon: Icon, title, desc, hint }, i) => (
            <div key={title} className="flex gap-4 rounded-xl border bg-card p-5">
              {/* Step number + icon */}
              <div className="flex-shrink-0 flex flex-col items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <span className="text-xs tabular-nums text-muted-foreground/50 font-medium">
                  0{i + 1}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-1">
                <p className="font-semibold">{title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
                <p className="text-xs text-muted-foreground/70 pt-1">{hint}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 flex flex-col items-center gap-3">
          <Button asChild size="lg" className="w-full sm:w-auto gap-2">
            <Link href="/feed">
              Go to my feed <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-xs text-muted-foreground">
            You can update your interests any time from your profile.
          </p>
        </div>
      </main>
    </div>
  )
}
