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
import { Checkbox } from '@/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MAX_HASHTAGS } from '@/lib/constants'
import type { ActionResult, Category } from '@/types'

type Platform = 'youtube' | 'tiktok' | 'others'

interface PostFormProps {
  categories: Category[]
}

export function PostForm({ categories }: PostFormProps) {
  const [state, action, isPending] = useActionState<ActionResult | null, FormData>(
    createPost,
    null
  )

  const [platform, setPlatform] = useState<Platform>('youtube')
  const [url, setUrl] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [categoryId, setCategoryId] = useState<string>('')
  const [creatorHandle, setCreatorHandle] = useState('')
  const [hasShoppingCart, setHasShoppingCart] = useState(false)
  const [isCarousel, setIsCarousel] = useState(false)
  const [hashtagError, setHashtagError] = useState(false)

  // type stored in DB: video for youtube/tiktok, link for others
  const postType = platform === 'others' ? 'link' : 'video'

  function handleOgFetch(og: { title?: string | null; description?: string | null; image?: string | null }) {
    if (og.title && !title) setTitle(og.title)
    if (og.description && !description) setDescription(og.description)
    if (og.image && !thumbnail) setThumbnail(og.image)
  }

  async function handleTikTokOembed(newUrl: string) {
    if (!newUrl) return
    try {
      const res = await fetch(`/api/oembed?url=${encodeURIComponent(newUrl)}`)
      if (!res.ok) return
      const data = await res.json()
      if (data.title && !title) setTitle(data.title)
      if (data.authorName && !creatorHandle) setCreatorHandle(data.authorName)
      if (data.thumbnailUrl && !thumbnail) setThumbnail(data.thumbnailUrl)
      if (data.hashtags?.length && tags.length === 0) {
        setTags(data.hashtags.slice(0, MAX_HASHTAGS))
      }
      if (data.isCarousel) setIsCarousel(true)
    } catch {
      // silent fail
    }
  }

  function handleUrlChange(newUrl: string) {
    setUrl(newUrl)
    if (platform === 'tiktok' && newUrl) {
      handleTikTokOembed(newUrl)
    }
  }

  function handlePlatformChange(p: Platform) {
    setPlatform(p)
    setUrl('')
    setTitle('')
    setDescription('')
    setThumbnail('')
    setTags([])
    setCreatorHandle('')
    setHasShoppingCart(false)
    setIsCarousel(false)
    setHashtagError(false)
  }

  return (
    <form
      action={(formData) => {
        if (tags.length === 0) {
          setHashtagError(true)
          return
        }
        setHashtagError(false)
        formData.set('type', postType)
        formData.set('title', title)
        formData.set('description', description)
        formData.set('url', url)
        formData.set('thumbnail', thumbnail)
        formData.set('categoryId', categoryId)
        formData.set('creatorHandle', creatorHandle)
        formData.set('hasShoppingCart', hasShoppingCart ? 'true' : 'false')
        formData.set('isCarousel', isCarousel ? 'true' : 'false')
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

      {/* Platform tabs */}
      <div className="space-y-2">
        <Label>Platform</Label>
        <Tabs value={platform} onValueChange={(v) => handlePlatformChange(v as Platform)}>
          <TabsList className="w-full">
            <TabsTrigger value="youtube" className="flex-1">YouTube</TabsTrigger>
            <TabsTrigger value="tiktok" className="flex-1">TikTok</TabsTrigger>
            <TabsTrigger value="others" className="flex-1">Others</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* URL */}
      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <UrlInput
          name="url"
          value={url}
          onChange={handleUrlChange}
          onOgFetch={platform === 'others' ? handleOgFetch : undefined}
          placeholder={
            platform === 'youtube' ? 'YouTube URL'
            : platform === 'tiktok' ? 'TikTok URL'
            : 'https://'
          }
        />
        {/* Video preview for YouTube/TikTok */}
        {platform !== 'others' && url && (
          <div className="pt-2">
            <VideoEmbed url={url} />
          </div>
        )}
      </div>

      {/* TikTok: has shopping cart */}
      {platform === 'tiktok' && (
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

      {/* Description — YouTube/TikTok only */}
      {platform !== 'others' && (
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
      )}

      {/* Creator handle — YouTube/TikTok only */}
      {platform !== 'others' && (
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
      )}

      {/* Hashtags */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Hashtags</Label>
          <span className="text-xs text-muted-foreground">{tags.length} / {MAX_HASHTAGS}</span>
        </div>
        <TagInput
          tags={tags}
          onChange={(t) => { setTags(t); if (t.length > 0) setHashtagError(false) }}
          max={MAX_HASHTAGS}
          hasError={hashtagError}
        />
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

      {/* Is carousel — YouTube/TikTok only */}
      {platform !== 'others' && (
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

      <Button type="submit" disabled={isPending} className="w-full">
        {isPending ? 'Publishing…' : 'Publish post'}
      </Button>
    </form>
  )
}
