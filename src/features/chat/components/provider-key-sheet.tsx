'use client'

import { useActionState, useState } from 'react'
import { saveApiKey, deleteApiKey } from '@/features/chat/actions/save-api-key'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { PROVIDER_META } from '@/lib/llm'
import type { LLMProvider } from '@/lib/llm'
import type { ActionResult } from '@/types'

const PROVIDERS = Object.entries(PROVIDER_META) as [LLMProvider, (typeof PROVIDER_META)[LLMProvider]][]

interface ProviderKeySheetProps {
  savedProviders: LLMProvider[]
  children: React.ReactNode
}

export function ProviderKeySheet({ savedProviders, children }: ProviderKeySheetProps) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<LLMProvider>('claude')
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    saveApiKey,
    null
  )

  const savedSet = new Set(savedProviders)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>API Keys</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Provider selector */}
          <div className="grid grid-cols-3 gap-2">
            {PROVIDERS.map(([id, meta]) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className={`rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
                  selected === id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-border hover:bg-accent'
                }`}
              >
                {meta.label}
                {savedSet.has(id) && (
                  <span className="ml-1 inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
                )}
              </button>
            ))}
          </div>

          {/* Key form */}
          {state && !state.success && (
            <Alert variant="destructive">
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}
          {state?.success && (
            <Alert>
              <AlertDescription>Key saved.</AlertDescription>
            </Alert>
          )}

          <form action={action} className="space-y-3">
            <input type="hidden" name="provider" value={selected} />
            <div className="space-y-1.5">
              <Label htmlFor="apiKey">
                {PROVIDER_META[selected].label} API key
              </Label>
              <Input
                id="apiKey"
                name="apiKey"
                type="password"
                placeholder={PROVIDER_META[selected].placeholder}
                autoComplete="off"
              />
              <p className="text-xs text-muted-foreground">
                Stored encrypted (AES-256-GCM). Never sent to the browser.
              </p>
            </div>
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending ? 'Saving…' : savedSet.has(selected) ? 'Update key' : 'Save key'}
            </Button>
          </form>

          {/* Remove existing key */}
          {savedSet.has(selected) && (
            <form
              action={async () => {
                await deleteApiKey(selected)
                setOpen(false)
              }}
            >
              <button
                type="submit"
                className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2"
              >
                Remove {PROVIDER_META[selected].label} key
              </button>
            </form>
          )}

          {/* Status overview */}
          <div className="space-y-1.5">
            <p className="text-xs font-medium text-muted-foreground">Saved keys</p>
            <div className="flex flex-wrap gap-1">
              {PROVIDERS.map(([id, meta]) => (
                <Badge
                  key={id}
                  variant={savedSet.has(id) ? 'default' : 'outline'}
                  className="text-xs"
                >
                  {meta.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
