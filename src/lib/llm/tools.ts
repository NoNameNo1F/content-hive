import type Anthropic from '@anthropic-ai/sdk'

export const WRITE_TOOL_NAMES = new Set(['create_post', 'update_post_status'])

/** All tools exposed to the Claude agent (read + proposed write). */
export const AGENT_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: 'search_posts',
    description:
      'Full-text search posts in the ContentHive library. Returns up to `limit` matching posts with title, type, status, saves_count, and creator_handle.',
    input_schema: {
      type: 'object' as const,
      properties: {
        query: { type: 'string', description: 'Search query string' },
        limit: { type: 'number', description: 'Max results to return (default 5, max 20)' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_post',
    description: 'Fetch a single post by its UUID. Returns full post details including description, tags, and category.',
    input_schema: {
      type: 'object' as const,
      properties: {
        id: { type: 'string', description: 'Post UUID' },
      },
      required: ['id'],
    },
  },
  {
    name: 'list_categories',
    description: 'List all categories in the system with their names, slugs, and post counts.',
    input_schema: {
      type: 'object' as const,
      properties: {},
    },
  },
  {
    name: 'list_hashtags',
    description: 'List the most-used hashtags across all posts, with usage counts.',
    input_schema: {
      type: 'object' as const,
      properties: {
        limit: { type: 'number', description: 'Max hashtags to return (default 20, max 50)' },
      },
    },
  },
  {
    name: 'create_post',
    description:
      'Propose creating a new post in the ContentHive library. Returns a confirmation ID — ' +
      'tell the user a proposal card has been generated and they must confirm before the post is saved.',
    input_schema: {
      type: 'object' as const,
      properties: {
        title:           { type: 'string', description: 'Post title' },
        url:             { type: 'string', description: 'URL of the content' },
        description:     { type: 'string', description: 'Short description' },
        type:            { type: 'string', enum: ['video', 'article', 'image', 'other'], description: 'Content type' },
        creator_handle:  { type: 'string', description: 'Creator / author handle' },
      },
      required: ['title', 'url', 'type'],
    },
  },
  {
    name: 'update_post_status',
    description:
      'Propose changing the status of an existing post. Returns a confirmation ID — ' +
      'tell the user a proposal card has been generated and they must confirm before the status changes.',
    input_schema: {
      type: 'object' as const,
      properties: {
        post_id: { type: 'string', description: 'UUID of the post to update' },
        status:  { type: 'string', enum: ['available', 'unavailable'], description: 'New status' },
      },
      required: ['post_id', 'status'],
    },
  },
]
