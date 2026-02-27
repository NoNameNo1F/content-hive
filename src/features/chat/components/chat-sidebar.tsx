'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { deleteConversation } from '@/features/chat/actions/create-conversation'
import { ProviderKeySheet } from '@/features/chat/components/provider-key-sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PROVIDER_META } from '@/lib/llm'
import type { LLMProvider } from '@/lib/llm'
import type { ConversationSummary } from '@/features/chat/queries/get-conversations'

interface ChatSidebarProps {
  conversations: ConversationSummary[]
  savedProviders: LLMProvider[]
}

export function ChatSidebar({ conversations, savedProviders }: ChatSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="flex h-full w-64 flex-shrink-0 flex-col border-r bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-3">
        <span className="text-sm font-semibold">Chat</span>
        <ProviderKeySheet savedProviders={savedProviders}>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
            API keys
          </Button>
        </ProviderKeySheet>
      </div>

      {/* New conversation form */}
      <div className="border-b p-3">
        <form action="/chat" method="GET" className="flex gap-2">
          <select
            name="provider"
            defaultValue="claude"
            className="flex-1 rounded-md border bg-background px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
          >
            {Object.entries(PROVIDER_META).map(([id, meta]) => (
              <option key={id} value={id}>
                {meta.label}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline" className="text-xs shrink-0">
            + New
          </Button>
        </form>
      </div>

      {/* Conversation list */}
      <div className="flex-1 overflow-y-auto">
        {conversations.length === 0 ? (
          <p className="p-4 text-xs text-muted-foreground">No conversations yet. Start one above.</p>
        ) : (
          <ul className="space-y-0.5 p-2">
            {conversations.map((conv) => {
              const isActive = pathname === `/chat/${conv.id}`
              return (
                <li key={conv.id} className="group relative">
                  <Link
                    href={`/chat/${conv.id}`}
                    className={`flex flex-col gap-0.5 rounded-lg px-3 py-2 text-xs transition-colors ${
                      isActive
                        ? 'bg-accent font-medium'
                        : 'hover:bg-accent/50'
                    }`}
                  >
                    <span className="line-clamp-1 leading-snug">{conv.title}</span>
                    <Badge
                      variant="secondary"
                      className="w-fit text-[10px] px-1 py-0"
                    >
                      {PROVIDER_META[conv.provider].label}
                    </Badge>
                  </Link>
                  {/* Delete button — appears on hover */}
                  <form
                    className="absolute right-2 top-2 hidden group-hover:block"
                    action={deleteConversation.bind(null, conv.id)}
                  >
                    <button
                      type="submit"
                      className="rounded px-1 text-[10px] text-muted-foreground hover:text-destructive"
                      title="Delete conversation"
                    >
                      ✕
                    </button>
                  </form>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
