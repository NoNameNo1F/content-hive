-- Add content workflow status enum and creator attribution to posts
-- This supports the TikTok marketing team's content tracking workflow

CREATE TYPE content_status AS ENUM ('available', 'in_use', 'used', 'rejected');

ALTER TABLE posts
  ADD COLUMN status content_status NOT NULL DEFAULT 'available',
  ADD COLUMN creator_handle text;

-- RLS: existing policies already apply (row-level). No new policies needed —
-- status and creator_handle are columns on posts which is already covered.

-- Allow users to filter posts by status
CREATE INDEX idx_posts_status ON posts (status);
