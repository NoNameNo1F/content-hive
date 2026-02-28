export const DEFAULT_PAGE_SIZE = 20
export const MIN_HASHTAGS = 1
export const MAX_HASHTAGS = 5
export const MIN_INTEREST_TAGS = 1
export const MAX_INTEREST_TAGS = 5
export const OG_FETCH_TIMEOUT_MS = 5_000
export const SEARCH_MIN_QUERY_LENGTH = 2

/** Content type slugs for the onboarding "Types of Content" selector. */
export const SUGGESTED_INTEREST_TAGS = [
  'educational',
  'review-result-proof',
  'direct-sales',
  'storytelling',
  'ugc',
] as const

/** Display labels for the 5 content types. */
export const CONTENT_TYPE_LABELS: Record<string, string> = {
  'educational':         'Educational',
  'review-result-proof': 'Review & Result-Proof',
  'direct-sales':        'Direct Sales',
  'storytelling':        'Storytelling',
  'ugc':                 'UGC',
}
