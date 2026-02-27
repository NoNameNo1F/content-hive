'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult } from '@/types'

export async function signUp(
  _prevState: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  // Invite-code gate — enforced only when INVITE_CODE env var is set.
  // Rotate the code weekly by updating the env var in your deployment dashboard.
  const expectedCode = process.env.INVITE_CODE
  if (expectedCode) {
    const inviteCode = (formData.get('inviteCode') as string)?.trim()
    if (inviteCode !== expectedCode) {
      return { success: false, error: 'Invalid invite code.' }
    }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = (formData.get('username') as string).trim().toLowerCase()

  if (!email || !password || !username) {
    return { success: false, error: 'All fields are required.' }
  }

  if (username.length < 3) {
    return { success: false, error: 'Username must be at least 3 characters.' }
  }

  if (password.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters.' }
  }

  const supabase = await createSupabaseServer()

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // The handle_new_user trigger reads this to populate profiles.username
      data: { username },
    },
  })

  if (error) {
    if (error.message.includes('already registered')) {
      return { success: false, error: 'An account with this email already exists.' }
    }
    return { success: false, error: 'Failed to create account. Please try again.' }
  }

  // New users go to onboarding to select interest tags
  redirect('/onboarding')
}
