'use client'

import { useState } from 'react'
import { Check, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

export interface WriteProposal {
  confirmationId: string
  toolName: string
  proposal: Record<string, unknown>
}

interface WriteProposalCardProps {
  proposal: WriteProposal
}

const TOOL_LABELS: Record<string, string> = {
  create_post: 'Create post',
  update_post_status: 'Update status',
}

export function WriteProposalCard({ proposal }: WriteProposalCardProps) {
  const [status, setStatus] = useState<'pending' | 'confirming' | 'done' | 'dismissed'>('pending')
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setStatus('confirming')
    setError(null)
    try {
      const res = await fetch('/api/chat/confirm-write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmationId: proposal.confirmationId }),
      })
      const data = await res.json() as { success?: boolean; error?: string }
      if (!res.ok || !data.success) {
        setError(data.error ?? 'Failed to execute.')
        setStatus('pending')
      } else {
        setStatus('done')
      }
    } catch {
      setError('Network error.')
      setStatus('pending')
    }
  }

  if (status === 'dismissed') return null

  return (
    <div className="my-2 rounded-lg border bg-muted/40 p-3 space-y-2 text-sm">
      <div className="flex items-center justify-between gap-2">
        <Badge variant="outline" className="text-xs">
          {TOOL_LABELS[proposal.toolName] ?? proposal.toolName}
        </Badge>
        {status === 'done' && (
          <span className="flex items-center gap-1 text-xs text-green-600 font-medium">
            <Check size={12} /> Done
          </span>
        )}
      </div>

      {/* Proposal fields */}
      <table className="w-full text-xs">
        <tbody>
          {Object.entries(proposal.proposal).map(([key, value]) => (
            <tr key={key}>
              <td className="pr-3 py-0.5 text-muted-foreground capitalize whitespace-nowrap">
                {key.replace(/_/g, ' ')}
              </td>
              <td className="py-0.5 font-medium break-all">{String(value)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {status !== 'done' && (
        <div className="flex gap-2 pt-1">
          <Button
            size="sm"
            className="h-7 text-xs"
            disabled={status === 'confirming'}
            onClick={handleConfirm}
          >
            {status === 'confirming' ? (
              <><Loader2 size={11} className="animate-spin mr-1" /> Saving…</>
            ) : (
              <><Check size={11} className="mr-1" /> Confirm</>
            )}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs"
            disabled={status === 'confirming'}
            onClick={() => setStatus('dismissed')}
          >
            <X size={11} className="mr-1" /> Dismiss
          </Button>
        </div>
      )}
    </div>
  )
}
