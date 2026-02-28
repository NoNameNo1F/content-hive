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
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MAX_HASHTAGS } from '@/lib/constants'
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
  initialHasShoppingCart?: boolean
  initialIsCarousel?: boolean
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
  initialHasShoppingCart = false,
  initialIsCarousel = false,
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
  const [visibility] = useState<'public' | 'team'>(initialVisibility)
  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [status, setStatus] = useState<ContentStatus>(initialStatus)
  const [creatorHandle, setCreatorHandle] = useState(initialCreatorHandle)
  const [hasShoppingCart, setHasShoppingCart] = useState(initialHasShoppingCart)
  const [isCarousel, setIsCarousel] = useState(initialIsCarousel)

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
        formData.set('hasShoppingCart', hasShoppingCart ? 'true' : 'false')
        formData.set('isCarousel', isCarousel ? 'true' : 'false')
        action(formData)
      }}
      className="space-y-6"
    >
      {state && !state.success && (
        <Alert variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/* Post type - read-only */}
      <div className="space-y-2">
        <Label>Post type</Label>
        <div>
          <Badge variant="secondary" className="capitalize">{postType}</Badge>
          <p className="mt-1 text-xs text-muted-foreground">Post type cannot be changed after creation.</p>
        </div>
      </div>

      {/* URL */}
      {(postType === 'link' || postType === 'video') && (
        <div className="space-y-2">
          <Label htmlFor="url">URL</Label>
          <UrlInput
            name="url"
            value={url}
            onChange={setUrl}
            onOgFetch={postType === 'link' ? handleOgFetch : undefined}
            placeholder={postType === 'video' ? 'YouTube, TikTok, or Douyin URL' : 'https://'}
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
          placeholder="Add some context..."
          rows={3}
        />
      </div>

      {/* Hashtags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Hashtags</Label>
          <span className="text-xs text-muted-foreground">{tags.length} / {MAX_HASHTAGS}</span>
        </div>
        <TagInput tags={tags} onChange={setTags} max={MAX_HASHTAGS} />
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
      </div>

      {/* Availability toggle */}
      <div className="flex items-center justify-between rounded-lg border p-4">
        <div className="space-y-0.5">
          <Label>Availability</Label>
          <p className="text-xs text-muted-foreground">
            {status === 'available' ? 'Available for use' : 'Marked as unavailable'}
          </p>
        </div>
        <Switch
          checked={status === 'available'}
          onCheckedChange={(checked) => setStatus(checked ? 'available' : 'unavailable')}
        />
      </div>

      {/* Shopping cart (video only) */}
      {postType === 'video' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="hasShoppingCart"
            checked={hasShoppingCart}
            onCheckedChange={(v) => setHasShoppingCart(v === true)}
          />
          <Label htmlFor="hasShoppingCart" className="font-normal cursor-pointer">
            Has shopping cart
          </Label>
        </div>
      )}

      {/* Is carousel (video only) */}
      {postType === 'video' && (
        <div className="flex items-center gap-2">
          <Checkbox
            id="isCarousel"
            checked={isCarousel}
            onCheckedChange={(v) => setIsCarousel(v === true)}
          />
          <Label htmlFor="isCarousel" className="font-normal cursor-pointer">
            This is a carousel (slideshow)
          </Label>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? 'Saving...' : 'Save changes'}
        </Button>
        <Button type="button" variant="outline" onClick={() => history.back()}>
          Cancel
        </Button>
      </div>
    </form>
  )
}
