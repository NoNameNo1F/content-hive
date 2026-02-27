-- Sprint 6: Personalised feed + similar posts
-- Creates a Postgres function that returns posts ranked by interest-match score.
-- Uses SECURITY INVOKER so RLS on posts/user_interests still applies.

CREATE OR REPLACE FUNCTION get_feed_personalized(
  p_user_id   uuid,
  p_sort_by   text    DEFAULT 'hot',
  p_status    text    DEFAULT NULL,
  p_category_id uuid  DEFAULT NULL,
  p_limit     integer DEFAULT 20,
  p_offset    integer DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  WITH interests AS (
    SELECT tag FROM user_interests WHERE user_id = p_user_id
  ),
  scores AS (
    -- Count how many of the user's interests each post matches
    SELECT pt.post_id, COUNT(*) AS score
    FROM   post_tags pt
    JOIN   interests i ON i.tag = pt.tag
    GROUP  BY pt.post_id
  )
  SELECT p.*
  FROM   posts p
  LEFT JOIN scores s ON s.post_id = p.id
  WHERE
    (p_status IS NULL OR p.status::text = p_status)
    AND (
      p_category_id IS NULL
      OR EXISTS (
        SELECT 1 FROM post_categories pc
        WHERE  pc.post_id = p.id AND pc.category_id = p_category_id
      )
    )
  ORDER BY
    COALESCE(s.score, 0)                                            DESC,
    CASE WHEN p_sort_by = 'hot' THEN p.votes_count ELSE 0 END      DESC,
    CASE WHEN p_sort_by = 'top' THEN p.saves_count ELSE 0 END      DESC,
    p.created_at                                                    DESC
  LIMIT  p_limit
  OFFSET p_offset;
$$;

GRANT EXECUTE ON FUNCTION get_feed_personalized TO authenticated;
