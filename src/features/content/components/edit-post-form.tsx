'use client'

import { useActionState, useState } from 'react'
import { updatePost } from '@/features/content/actions/update-post'
import { TagInput } from './tag-input'
import { UrlInput } from './url-input'
import { VideoEmbed } from './video-embed'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { ActionResult, Category, ContentStatus, PostType } from '@/types'

interface EditPostFormProps {
  postId: string
  initialTitle: string
  initialDescription: string
  initialUrl: string
  initialThumbnail: string
  initialTags: string[]
  initialVisibility: 'public' | 'team'
  initialCategoryId: string
  initialStatus: ContentStatus
  initialCreatorHandle: string
  postType: PostType
  categories: Category[]
}

export function EditPostForm({
  postId,
  initialTitle,
  initialDescription,
  initialUrl,
  initialThumbnail,
  initialTags,
  initialVisibility,
  initialCategoryId,
  initialStatus,
  initialCreatorHandle,
  postType,
  categories,
}: EditPostFormProps) {
  const boundAction = updatePost.bind(null, postId)
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    boundAction,
    null
  )

  const [title, setTitle] = useState(initialTitle)
  const [description, setDescription] = useState(initialDescription)
  const [url, setUrl] = useState(initialUrl)
  const [thumbnail, setThumbnail] = useState(initialThumbnail)
  const [tags, setTags] = useState<string[]>(initialTags)
  const [visibility, setVisibility] = useState<'public' | 'team'>(initialVisibility)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [status, setStatus] = useState<ContentStatus>(initialStatus)
  const [creatorHandle, setCreatorHandle] = useState(initialCreatorHandle)

  function handleOgFetch(og: { title?: string | null; description?: string | null; image?: string | null }) {
    if (og.title && !title) setTitle(og.title)
    if (og.description && !description) setDescription(og.description)
    if (og.image && !thumbnail) setThumbnail(og.image)
  }

  return (
    <form
      action={(formData) => {
        formData.set('title', title)
        formData.set('description', description)
        formData.set('url', url)
        formData.set('thumbnail', thumbnail)
        formData.set('visibility', visibility)
        formData.set('categoryId', categoryId)
        formData.set('status', status)
        formData.set('creatorHandle', creatorHandle)
        action(formData)
      }}
      className="space-y-6"
    >
      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Post type — read-only, cannot change after creation */}
      <div className="space-y-2">
        <Label>Post type</Label>
        <div>
          <Badge variant="secondary" className="capitalize">{postType}</Badge>
          <p className="mt-1 text-xs text-muted-foreground">Post type cannot be changed after creation.</p>
        </div>
      </div>

      {/* URL — shown for link and video */}
      {(postType === 'link' || postType === 'video') && (
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <UrlInput
            name="url"
            value={url}
            onChange={setUrl}
            onOgFetch={postType === 'link' ? handleOgFetch : undefined}
            placeholder={postType === 'video' ? 'YouTube, Vimeo, or TikTok URL' : 'https://'}
          />
          {postType === 'video' && url && (
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
          <Select value={categoryId || '_none'} onValueChange={(v) => setCategoryId(v === '_none' ? '' : v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select a category (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">No category</SelectItem>
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

      {/* Creator handle */}
      <div className="space-y-2">
        <Label htmlFor="creatorHandle">Creator handle</Label>
        <Input
          id="creatorHandle"
          name="creatorHandle"
          value={creatorHandle}
          onChange={(e) => setCreatorHandle(e.target.value)}
          placeholder="@username"
        />
        <p className="text-xs text-muted-foreground">TikTok or social media creator handle (optional).</p>
      </div>

      {/* Content status */}
      <div className="space-y-2">
        <Label>Content status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as ContentStatus)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="available">Available — ready to use</SelectItem>
            <SelectItem value="in_use">In use — currently being used</SelectItem>
            <SelectItem value="used">Used — already posted</SelectItem>
            <SelectItem value="rejected">Rejected — not suitable</SelectItem>
          </SelectContent>
        </Select>
        <input type="hidden" name="status" value={status} />
      </div>

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

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? 'Saving…' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
