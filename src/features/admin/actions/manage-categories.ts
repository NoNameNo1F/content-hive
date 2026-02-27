'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServer } from '@/lib/supabase/server'
import type { ActionResult, Category } from '@/types'

async function requireAdmin() {
  const supabase = await createSupabaseServer()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profile?.role !== 'admin') return null
  return supabase
}

export async function createCategory(
  _prev: ActionResult<Category> | null,
  formData: FormData
): Promise<ActionResult<Category>> {
  const supabase = await requireAdmin()
  if (!supabase) return { success: false, error: 'Not authorized.' }

  const name = (formData.get('name') as string)?.trim()
  if (!name) return { success: false, error: 'Name is required.' }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

  const { data, error } = await supabase
    .from('categories')
    .insert({ name, slug })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') return { success: false, error: 'A category with that name already exists.' }
    return { success: false, error: 'Failed to create category.' }
  }

  revalidatePath('/admin')
  return { success: true, data: data as Category }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  const supabase = await requireAdmin()
  if (!supabase) return

  await supabase.from('categories').delete().eq('id', categoryId)
  revalidatePath('/admin')
}
