import Link from 'next/link'
import { createSupabaseServer } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { NavHeader } from '@/components/shared/nav-header'
import { Bookmark, Sparkles, Kanban, Network, MessageSquare, BarChart2, ArrowRight, CheckCircle2 } from 'lucide-react'

export const metadata = { title: 'ContentHive — Your team content library' }

export default async function RootPage() {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { redirect } = await import('next/navigation')
    redirect('/feed')
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavHeader />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden border-b">
        {/* subtle grid backdrop */}
        <div className="hero-grid pointer-events-none absolute inset-0 opacity-[0.03]" />
        {/* radial glow */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div className="h-150 w-225 rounded-full bg-primary/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-5xl px-4 py-28 text-center">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            Built for content teams
          </div>

          <h1 className="mx-auto max-w-3xl text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl">
            Stop losing great content
            <br />
            <span className="text-muted-foreground">in the group chat</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            ContentHive is your team&apos;s shared library — save links and videos,
            organise by format, and get a personalised feed of what matters to you.
          </p>

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/register">
                Start for free <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign in</Link>
            </Button>
          </div>

          <p className="mt-4 text-xs text-muted-foreground">No credit card · Invite-only beta</p>
        </div>
      </section>

      {/* ── Problem ── */}
      <section className="border-b py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">The problem</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Great ideas deserve better than a chat thread
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                before: 'Someone shares a great tutorial in Slack',
                after: 'It gets buried under 200 other messages by morning',
                icon: '💬',
              },
              {
                before: 'Your team finds the perfect reference video',
                after: 'Nobody remembers where it was when they need it',
                icon: '🎬',
              },
              {
                before: 'You bookmark 50 things every week',
                after: 'You can never find what you saved when it counts',
                icon: '🔖',
              },
            ].map((item) => (
              <div key={item.before} className="rounded-xl border bg-card p-5 space-y-4">
                <div className="text-2xl">{item.icon}</div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">{item.before}</p>
                  <p className="text-sm text-muted-foreground">→ {item.after}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-b py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Features</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">
              Everything your team actually needs
            </h2>
            <p className="mt-3 text-muted-foreground">No bloat. No learning curve. Just content — organised.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Bookmark,
                title: 'Save anything',
                desc: 'Links, YouTube, TikTok, Douyin — paste a URL and ContentHive figures out the rest.',
              },
              {
                icon: Sparkles,
                title: 'Personalised feed',
                desc: 'Tell us your interests once. Your feed surfaces the content most relevant to you, not just the latest.',
              },
              {
                icon: Kanban,
                title: 'Content workflow',
                desc: 'Track every piece through Available → In Use → Used → Rejected with a visual Kanban board.',
              },
              {
                icon: Network,
                title: 'Content map',
                desc: 'See your whole library as an interactive graph — explore by format and discover connections.',
              },
              {
                icon: MessageSquare,
                title: 'AI assistant',
                desc: 'Chat with your own AI using any provider — GPT, Claude, Gemini, or DeepSeek. Your key, your data.',
              },
              {
                icon: BarChart2,
                title: 'Team analytics',
                desc: 'See what formats work, which posts get voted up, and where your best content comes from.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border bg-card p-5 space-y-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4.5 w-4.5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{title}</p>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-b py-20">
        <div className="mx-auto max-w-5xl px-4">
          <div className="mb-12 text-center">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight">Up and running in minutes</h2>
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {[
              {
                step: '01',
                title: 'Join your team',
                desc: 'Request an invite code, create your account, and pick the content formats you care about.',
              },
              {
                step: '02',
                title: 'Start saving',
                desc: 'Paste any URL — articles, videos, social posts. Add a title, tag it, and pick a content format.',
              },
              {
                step: '03',
                title: 'Discover together',
                desc: 'Vote on the best content, track what\'s in use, and chat with AI about your library.',
              },
            ].map((item) => (
              <div key={item.step} className="space-y-3">
                <p className="text-4xl font-bold tabular-nums text-muted-foreground/30">{item.step}</p>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Social proof / trust ── */}
      <section className="border-b py-14">
        <div className="mx-auto max-w-5xl px-4">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4">
            {[
              'No ads, no tracking',
              'Your API keys, your data',
              'Dark mode native',
              'Invite-only — no random signups',
            ].map((point) => (
              <div key={point} className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                {point}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24">
        <div className="mx-auto max-w-5xl px-4 text-center">
          <h2 className="text-4xl font-bold tracking-tight">
            Your content library is waiting
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join the beta — limited to invited teams only.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="gap-2">
              <Link href="/register">
                Get your invite <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <Link href="/login">Already have access? Sign in</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t py-8">
        <div className="mx-auto max-w-5xl px-4 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm font-semibold tracking-tight">ContentHive</p>
          <p className="text-xs text-muted-foreground">
            Built for content teams who take their craft seriously.
          </p>
        </div>
      </footer>
    </div>
  )
}
