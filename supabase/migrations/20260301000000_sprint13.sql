-- Sprint 13: Comments FK fix + pgvector + app_settings

-- ── 1. Fix comments FK to point to profiles (not auth.users) ─────────────────
-- This lets PostgREST resolve: comments.user_id → profiles.id
ALTER TABLE comments
  DROP CONSTRAINT comments_user_id_fkey,
  ADD CONSTRAINT comments_user_id_fkey
    FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- ── 2. pgvector extension ─────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS vector;

-- ── 3. Embedding column on posts ──────────────────────────────────────────────
ALTER TABLE posts ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- IVFFlat index for fast cosine similarity search
CREATE INDEX IF NOT EXISTS posts_embedding_idx
  ON posts USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- ── 4. App settings (admin-configurable key/value store) ─────────────────────
CREATE TABLE IF NOT EXISTS app_settings (
  key        text PRIMARY KEY,
  value      jsonb NOT NULL DEFAULT '{}',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Admins can read and write
CREATE POLICY "app_settings_admin_write" ON app_settings FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ── 5. match_posts RPC for semantic similarity search ─────────────────────────
CREATE OR REPLACE FUNCTION match_posts(
  query_embedding vector(1536),
  match_count     int DEFAULT 25
)
RETURNS TABLE(id uuid, similarity float)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT posts.id,
         1 - (posts.embedding <=> query_embedding) AS similarity
  FROM   posts
  WHERE  posts.embedding IS NOT NULL
  ORDER  BY posts.embedding <=> query_embedding
  LIMIT  match_count;
$$;
