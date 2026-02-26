import { redirect } from 'next/navigation'
import { getUserRole } from './get-role'

/**
 * Enforces a minimum role requirement in Server Components or Server Actions.
 * Redirects to /login if unauthenticated, or /feed if insufficient role.
 */
export async function requireRole(minimum: 'member' | 'admin'): Promise<void> {
  const role = await getUserRole()

  if (role === 'visitor') {
    redirect('/login')
  }

  if (minimum === 'admin' && role !== 'admin') {
    redirect('/feed')
  }
}
