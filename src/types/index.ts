import type { Database } from './database.types'

// ─── Raw DB row types (from generated types) ──────────────────────────────────

type PostRow = Database['public']['Tables']['posts']['Row']
type ProfileRow = Database['public']['Tables']['profiles']['Row']
type CategoryRow = Database['public']['Tables']['categories']['Row']
type BookmarkRow = Database['public']['Tables']['bookmarks']['Row']

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PostType = Database['public']['Enums']['post_type']
export type PostVisibility = Database['public']['Enums']['post_visibility']
export type UserRole = Database['public']['Enums']['user_role']
export type ContentStatus = Database['public']['Enums']['content_status']

// ─── Domain types ─────────────────────────────────────────────────────────────

/** A post enriched with author info, tags, and categories for display. */
export type Post = PostRow & {
  author: Pick<ProfileRow, 'id' | 'username' | 'avatar_url'>
  tags: string[]
  categories: Pick<CategoryRow, 'id' | 'name' | 'slug'>[]
}

/** Full post detail (same shape, aliased for clarity on detail pages). */
export type PostDetail = Post

/** A user's public profile. */
export type UserProfile = ProfileRow & {
  interests: string[]
}

/** Category metadata. */
export type Category = CategoryRow

/** A bookmark record. */
export type Bookmark = BookmarkRow

/**
 * Post as returned by Supabase join queries (.select('*, profiles(...), post_tags(tag)')).
 * This is the actual shape used by feed, search, and content queries.
 */
export type PostWithRelations = PostRow & {
  profiles: { id: string; username: string; avatar_url: string | null } | null
  post_tags: { tag: string }[]
}

/** Input for creating a new post. */
export interface CreatePostInput {
  type: PostType
  title: string
  description?: string
  url?: string
  thumbnail?: string
  visibility: PostVisibility
  status: ContentStatus
  creator_handle?: string
  tags: string[]
  categoryId?: string
}

// ─── Server Action result type ────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data: T }
  | { success: false; error: string }
