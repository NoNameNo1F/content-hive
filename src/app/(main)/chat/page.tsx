import { redirect } from 'next/navigation'
import { createSupabaseServer } from '@/lib/supabase/server'
import { createConversation } from '@/features/chat/actions/create-conversation'
import { getConversations } from '@/features/chat/queries/get-conversations'
import { getApiKeyStatus } from '@/features/chat/queries/get-api-key-status'
import { ChatSidebar } from '@/features/chat/components/chat-sidebar'
import { PROVIDER_META } from '@/lib/llm'
import type { LLMProvider } from '@/lib/llm'

export const metadata = { title: 'Chat — ContentHive' }

interface ChatPageProps {
  searchParams: Promise<{ provider?: string }>
}

export default async function ChatPage({ searchParams }: ChatPageProps) {
  const supabase = await createSupabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { provider: providerParam } = await searchParams

  // If provider param is set, create a new conversation and redirect into it
  if (providerParam && Object.keys(PROVIDER_META).includes(providerParam)) {
    const fd = new FormData()
    fd.set('provider', providerParam)
    await createConversation(fd) // this redirects internally
  }

  const [conversations, savedProviders] = await Promise.all([
    getConversations(),
    getApiKeyStatus(),
  ])

  // If there are existing conversations, redirect to the most recent one
  if (conversations.length > 0) {
    redirect(`/chat/${conversations[0].id}`)
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] overflow-hidden -mx-4 sm:-mx-6 lg:-mx-8">
      <ChatSidebar
        conversations={conversations}
        savedProviders={[...savedProviders] as LLMProvider[]}
      />

      {/* Empty state */}
      <div className="flex flex-1 flex-col items-center justify-center gap-6 p-8">
        <div className="space-y-2 text-center">
          <h2 className="text-xl font-semibold">Start a conversation</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            Choose a provider in the sidebar and click <strong>+ New</strong> to begin.
            Your API keys stay encrypted on our servers.
          </p>
        </div>
      </div>
    </div>
  )
}
