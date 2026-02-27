import { notFound, redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { getConversationWithMessages } from '@/features/chat/queries/get-messages'
import { getConversations } from '@/features/chat/queries/get-conversations'
import { getApiKeyStatus } from '@/features/chat/queries/get-api-key-status'
import { ChatSidebar } from '@/features/chat/components/chat-sidebar'
import { ChatWindow } from '@/features/chat/components/chat-window'
import { PROVIDER_META } from '@/lib/llm'
import type { LLMProvider } from '@/lib/llm'

interface ChatIdPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ChatIdPageProps) {
  const { id } = await params
  const conv = await getConversationWithMessages(id)
  return { title: conv ? `${conv.title} — Chat` : 'Chat — ContentHive' }
}

export default async function ChatIdPage({ params }: ChatIdPageProps) {
  const { id } = await params

  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [conv, conversations, savedProviders] = await Promise.all([
    getConversationWithMessages(id),
    getConversations(),
    getApiKeyStatus(),
  ])

  if (!conv) notFound()

  const hasApiKey = savedProviders.has(conv.provider)

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      <ChatSidebar
        conversations={conversations}
        savedProviders={[...savedProviders] as LLMProvider[]}
      />

      {/* Conversation header + window */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <span className="text-sm font-medium line-clamp-1 flex-1">{conv.title}</span>
          <span className="text-xs text-muted-foreground">
            {PROVIDER_META[conv.provider].label}
          </span>
        </div>

        <ChatWindow
          conversationId={conv.id}
          provider={conv.provider as LLMProvider}
          initialMessages={conv.messages}
          hasApiKey={hasApiKey}
        />
      </div>
    </div>
  )
}
