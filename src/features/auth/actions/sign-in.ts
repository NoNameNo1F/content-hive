'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function signIn(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email and password are required.' }
  }

  const supabase = await createSupabaseServer()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: 'Invalid email or password.' }
  }

  redirect('/feed')
}
