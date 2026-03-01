'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  saveEmbeddingSettings,
  testEmbeddingSettings,
} from '@/features/admin/actions/embedding-settings'
import type { EmbeddingConfig, EmbeddingProvider } from '@/lib/embeddings'

const DEFAULT_MODELS: Record<EmbeddingProvider, string> = {
  openai: 'text-embedding-3-small',
  voyage: 'voyage-3-lite',
}

interface AdminEmbeddingPanelProps {
  initialConfig: EmbeddingConfig | null
}

export function AdminEmbeddingPanel({ initialConfig }: AdminEmbeddingPanelProps) {
  const [provider, setProvider] = useState<EmbeddingProvider>(
    initialConfig?.provider ?? 'openai'
  )
  const [model, setModel]   = useState(initialConfig?.model  ?? DEFAULT_MODELS['openai'])
  const [apiKey, setApiKey] = useState(initialConfig?.apiKey ?? '')

  const [saving,  setSaving]  = useState(false)
  const [testing, setTesting] = useState(false)
  const [saveMsg, setSaveMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [testMsg, setTestMsg] = useState<{ ok: boolean; text: string } | null>(null)

  function handleProviderChange(p: EmbeddingProvider) {
    setProvider(p)
    setModel(DEFAULT_MODELS[p])
  }

  async function handleSave() {
    setSaving(true)
    setSaveMsg(null)
    const result = await saveEmbeddingSettings({ provider, model, apiKey })
    setSaving(false)
    setSaveMsg(
      result.success
        ? { ok: true,  text: 'Settings saved.' }
        : { ok: false, text: result.error }
    )
  }

  async function handleTest() {
    setTesting(true)
    setTestMsg(null)
    const result = await testEmbeddingSettings({ provider, model, apiKey })
    setTesting(false)
    setTestMsg(
      result.success
        ? { ok: true,  text: 'Connection OK — embedding generated successfully.' }
        : { ok: false, text: result.error }
    )
  }

  return (
    <div className="space-y-6 max-w-md">
      <p className="text-sm text-muted-foreground">
        Configure a vector embedding provider to enable semantic search. The API key is
        stored in the database — use Supabase Vault in production for better security.
      </p>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Provider</Label>
          <Select
            value={provider}
            onValueChange={(v) => handleProviderChange(v as EmbeddingProvider)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="openai">OpenAI</SelectItem>
              <SelectItem value="voyage">Voyage AI</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Model</Label>
          <Input
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder={DEFAULT_MODELS[provider]}
          />
          <p className="text-xs text-muted-foreground">
            OpenAI: <code>text-embedding-3-small</code> (1536-dim) ·{' '}
            Voyage: <code>voyage-3-lite</code>
          </p>
        </div>

        <div className="space-y-2">
          <Label>API Key</Label>
          <Input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-…"
            autoComplete="off"
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          onClick={handleSave}
          disabled={saving || !apiKey.trim() || !model.trim()}
        >
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
        <Button
          variant="outline"
          onClick={handleTest}
          disabled={testing || !apiKey.trim() || !model.trim()}
        >
          {testing ? 'Testing…' : 'Test connection'}
        </Button>
      </div>

      {saveMsg && (
        <p className={`text-sm ${saveMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {saveMsg.text}
        </p>
      )}
      {testMsg && (
        <p className={`text-sm ${testMsg.ok ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}>
          {testMsg.text}
        </p>
      )}
    </div>
  )
}
