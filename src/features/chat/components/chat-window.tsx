'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { PROVIDER_META } from '@/lib/llm'
import type { LLMProvider } from '@/lib/llm'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
}

interface ChatWindowProps {
  conversationId: string
  provider: LLMProvider
  initialMessages: Message[]
  hasApiKey: boolean
}

export function ChatWindow({
  conversationId,
  provider,
  initialMessages,
  hasApiKey,
}: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')
  const [toolCallLabel, setToolCallLabel] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-scroll to bottom when messages change or streaming updates
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, streamingContent])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const content = input.trim()
    if (!content || isStreaming) return

    setInput('')
    setError(null)
    setIsStreaming(true)
    setStreamingContent('')
    setToolCallLabel(null)

    // Optimistically add user message to UI
    const tempId = `temp-${Date.now()}`
    setMessages((prev) => [...prev, { id: tempId, role: 'user', content }])

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ conversationId, content }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }))
        throw new Error(err.error ?? 'Request failed')
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        for (const line of text.split('\n')) {
          if (!line.startsWith('data: ')) continue
          const data = line.slice(6)
          if (data === '[DONE]') break
          try {
            const parsed = JSON.parse(data)
            if (parsed.error) throw new Error(parsed.error)
            if (parsed.toolCall) {
              const label = `Searching ${parsed.toolCall.name.replace(/_/g, ' ')}…`
              setToolCallLabel(label)
            }
            if (parsed.chunk) {
              setToolCallLabel(null)
              accumulated += parsed.chunk
              setStreamingContent(accumulated)
            }
          } catch (parseErr) {
            if (parseErr instanceof Error && parseErr.message !== 'Unexpected token') {
              throw parseErr
            }
          }
        }
      }

      // Commit streaming message to messages list
      setMessages((prev) => [
        ...prev,
        { id: `assistant-${Date.now()}`, role: 'assistant', content: accumulated },
      ])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
      // Remove the optimistic user message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
    } finally {
      setIsStreaming(false)
      setStreamingContent('')
      textareaRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e as unknown as React.FormEvent)
    }
  }

  if (!hasApiKey) {
    return (
      <div className="flex flex-1 items-center justify-center p-8 text-center">
        <div className="space-y-3 max-w-sm">
          <p className="text-sm font-medium">No API key for {PROVIDER_META[provider].label}</p>
          <p className="text-xs text-muted-foreground">
            Add your {PROVIDER_META[provider].label} API key using the{' '}
            <strong>API keys</strong> button in the sidebar to start chatting.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && !isStreaming && (
          <p className="text-center text-sm text-muted-foreground pt-8">
            Start a conversation with {PROVIDER_META[provider].label}
          </p>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted'
              }`}
            >
              <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
            </div>
          </div>
        ))}

        {/* Tool call indicator */}
        {isStreaming && toolCallLabel && !streamingContent && (
          <div className="flex justify-start">
            <div className="rounded-full bg-muted px-3 py-1.5 text-xs italic text-muted-foreground">
              🔍 {toolCallLabel}
            </div>
          </div>
        )}

        {/* Streaming assistant message */}
        {isStreaming && (
          <div className="flex justify-start">
            <div className="max-w-[80%] rounded-2xl bg-muted px-4 py-2.5 text-sm leading-relaxed">
              {streamingContent ? (
                <pre className="whitespace-pre-wrap font-sans">{streamingContent}</pre>
              ) : (
                !toolCallLabel && (
                  <span className="inline-flex gap-1">
                    <span className="animate-bounce [animation-delay:0ms]">·</span>
                    <span className="animate-bounce [animation-delay:150ms]">·</span>
                    <span className="animate-bounce [animation-delay:300ms]">·</span>
                  </span>
                )
              )}
            </div>
          </div>
        )}

        {error && (
          <p className="text-center text-xs text-destructive">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="border-t bg-background px-4 py-3">
        <form onSubmit={handleSubmit} className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${PROVIDER_META[provider].label}… (Enter to send, Shift+Enter for newline)`}
            disabled={isStreaming}
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-[200px]"
          />
          <Button type="submit" disabled={!input.trim() || isStreaming} size="sm">
            Send
          </Button>
        </form>
      </div>
    </div>
  )
}
