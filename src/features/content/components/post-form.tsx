'use client'

import { useActionState, useState } from 'react'
import { createPost } from '@/features/content/actions/create-post'
import { TagInput } from './tag-input'
import { UrlInput } from './url-input'
import { VideoEmbed } from './video-embed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionResult, Category, PostType } from '@/types'

interface PostFormProps {
  categories: Category[]
}

export function PostForm({ categories }: PostFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createPost,
    null
  )

  const [type, setType] = useState<PostType>('link')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [visibility, setVisibility] = useState<'public' | 'team'>('public')
  const [categoryId, setCategoryId] = useState<string>('')

  function handleOgFetch(og: { title?: string | null; description?: string | null; image?: string | null }) {
    if (og.title && !title) setTitle(og.title)
    if (og.description && !description) setDescription(og.description)
    if (og.image && !thumbnail) setThumbnail(og.image)
  }

  return (
    <form
      action={(formData) => {
        // Inject controlled state values into the FormData
        formData.set('type', type)
        formData.set('title', title)
        formData.set('description', description)
        formData.set('url', url)
        formData.set('thumbnail', thumbnail)
        formData.set('visibility', visibility)
        formData.set('categoryId', categoryId)
        // tags are injected by the hidden inputs inside TagInput
        action(formData)
      }}
      className="space-y-6"
    >
      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Post type */}
      <div className="space-y-2">
        <Label>Post type</Label>
        <Tabs value={type} onValueChange={(v) => { setType(v as PostType); setUrl('') }}>
          <TabsList className="w-full">
            <TabsTrigger value="link" className="flex-1">Link</TabsTrigger>
            <TabsTrigger value="video" className="flex-1">Video</TabsTrigger>
            <TabsTrigger value="text" className="flex-1">Text</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* URL — shown for link and video */}
      {(type === 'link' || type === 'video') && (
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <UrlInput
            name="url"
            value={url}
            onChange={setUrl}
            onOgFetch={type === 'link' ? handleOgFetch : undefined}
            placeholder={type === 'video' ? 'YouTube or Vimeo URL' : 'https://'}
          />
          {/* Video embed preview */}
          {type === 'video' && url && (
            <div className="pt-2">
              <VideoEmbed url={url} />
            </div>
          )}
        </div>
      )}

      {/* Title */}
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What is this about?"
          required
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add some context…"
          rows={3}
        />
      </div>

      {/* Tags */}
      <div className="space-y-2">
        <Label>Tags</Label>
        <TagInput tags={tags} onChange={setTags} />
        <p className="text-xs text-muted-foreground">Up to 10 tags. Press Enter or comma to add.</p>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="space-y-2">
          <Label>Category</Label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <input type="hidden" name="categoryId" value={categoryId} />
        </div>
      )}

      {/* Visibility */}
      <div className="space-y-2">
        <Label>Visibility</Label>
        <Select value={visibility} onValueChange={(v) => setVisibility(v as 'public' | 'team')}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="public">Public — visible to everyone</SelectItem>
            <SelectItem value="team">Team — visible to members only</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="visibility" value={visibility} />
      </div>

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Publishing…' : 'Publish post'}
      </Button>
    </form>
  )
}
