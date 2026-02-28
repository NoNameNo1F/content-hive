import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getUserInterests } from '@/features/auth/queries/get-interests'
import { InterestSelector } from '@/features/auth/components/interest-selector'

export const metadata = { title: 'Types of Content — ContentHive' }

export default async function OnboardingPage() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const existingInterests = await getUserInterests()

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-bold tracking-tight">What type of content do you work with?</h1>
          <p className="text-muted-foreground">
            Select the content types you create or manage.
          </p>
        </div>

        <InterestSelector initialSelected={existingInterests} />
      </div>
    </div>
  )
}
