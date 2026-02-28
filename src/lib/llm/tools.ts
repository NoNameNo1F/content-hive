import type Anthropic from '@anthropic-ai/sdk'

/** Read-only tools exposed to the Claude agent. No write tools. */
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
]
