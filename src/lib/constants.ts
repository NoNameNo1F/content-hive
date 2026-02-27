export const DEFAULT_PAGE_SIZE = 20
export const MAX_TAGS_PER_POST = 10
export const MIN_INTEREST_TAGS = 3
export const MAX_INTEREST_TAGS = 5
export const OG_FETCH_TIMEOUT_MS = 5_000
export const SEARCH_MIN_QUERY_LENGTH = 2

/** Predefined tags shown on the onboarding interest selector.
 *  Aligned with the 6 content creation frameworks and common content topics.
 */
export const SUGGESTED_INTEREST_TAGS = [
  // Content formats (aligned with the 6 framework categories)
  'personal-story',
  'collections',
  'comparison',
  'fact-check',
  'tutorial',
  'product-story',
  // Content topics
  'business',
  'lifestyle',
  'education',
  'entertainment',
  'motivation',
  'finance',
  'health',
  'technology',
  'food',
  'travel',
  'fashion',
  'beauty',
  'sports',
  'gaming',
  // Content styles
  'trending',
  'review',
  'how-to',
  'behind-the-scenes',
  'q-and-a',
  'tips',
  'storytelling',
  'humor',
] as const
