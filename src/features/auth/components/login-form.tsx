'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { signIn } from '@/features/auth/actions/sign-in'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionResult } from '@/types'

export function LoginForm() {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    signIn,
    null
  )

  return (
    <form action={action} className="space-y-4">
      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
        />
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? 'Signing in…' : 'Sign in'}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        No account?{' '}
        <Link href="/register" className="underline underline-offset-4 hover:text-primary">
          Create one
        </Link>
      </p>
    </form>
  )
}
