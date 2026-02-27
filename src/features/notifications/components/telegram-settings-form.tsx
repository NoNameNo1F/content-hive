'use client'

import { useActionState } from 'react'
import { saveTelegramId } from '@/features/notifications/actions/save-telegram-id'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { ActionResult } from '@/types'

interface TelegramSettingsFormProps {
  currentChatId: string | null
}

export function TelegramSettingsForm({ currentChatId }: TelegramSettingsFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    saveTelegramId,
    null
  )

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium">Telegram notifications</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Enter your Telegram chat ID to receive notifications when teammates add new content.{' '}
          <a
            href="https://t.me/userinfobot"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground"
          >
            Get your chat ID via @userinfobot
          </a>
        </p>
      </div>

      {state && (
        <Alert variant={state.success ? 'default' : 'destructive'}>
          <AlertDescription>
            {state.success ? 'Telegram settings saved.' : state.error}
          </AlertDescription>
        </Alert>
      )}

      <form action={action} className="flex gap-2">
        <div className="flex-1 space-y-1">
          <Label htmlFor="telegramChatId" className="sr-only">Telegram chat ID</Label>
          <Input
            id="telegramChatId"
            name="telegramChatId"
            type="text"
            placeholder="e.g. 123456789"
            defaultValue={currentChatId ?? ''}
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={isPending}>
          {isPending ? 'Saving…' : 'Save'}
        </Button>
        {currentChatId && (
          <input type="hidden" name="telegramChatId" value="" form="clear-form" />
        )}
      </form>

      {/* Clear button as a separate form so it can submit an empty value */}
      {currentChatId && (
        <form
          id="clear-form"
          action={action}
          className="flex"
        >
          <input type="hidden" name="telegramChatId" value="" />
          <button
            type="submit"
            disabled={isPending}
            className="text-xs text-muted-foreground hover:text-destructive underline underline-offset-2"
          >
            Remove Telegram ID
          </button>
        </form>
      )}
    </div>
  )
}
