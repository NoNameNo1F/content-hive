import { NavHeader } from '@/components/shared/nav-header'

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <NavHeader />
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  )
}
