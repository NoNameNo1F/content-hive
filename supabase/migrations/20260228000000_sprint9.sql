-- Sprint 9: Status simplification + new post columns

-- 1. Simplify content_status: 4 values → available | unavailable
--    Maps in_use + used + rejected → unavailable
ALTER TABLE posts ADD COLUMN status_new text;

UPDATE posts
SET status_new = CASE
  WHEN status::text = 'available' THEN 'available'
  ELSE 'unavailable'
END;

CREATE TYPE content_status_new AS ENUM ('available', 'unavailable');

ALTER TABLE posts
  ALTER COLUMN status_new TYPE content_status_new
  USING status_new::content_status_new;

ALTER TABLE posts DROP COLUMN status;
ALTER TABLE posts RENAME COLUMN status_new TO status;
ALTER TABLE posts ALTER COLUMN status SET DEFAULT 'available';
ALTER TABLE posts ALTER COLUMN status SET NOT NULL;

DROP TYPE content_status;
ALTER TYPE content_status_new RENAME TO content_status;

-- 2. New columns
ALTER TABLE posts ADD COLUMN has_shopping_cart boolean NOT NULL DEFAULT false;
ALTER TABLE posts ADD COLUMN is_carousel       boolean NOT NULL DEFAULT false;
-- updated_at may already exist from initial schema; add only if missing
ALTER TABLE posts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER posts_updated_at
  BEFORE UPDATE ON posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();
