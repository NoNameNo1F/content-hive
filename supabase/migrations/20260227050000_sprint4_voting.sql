-- Sprint 4: Community voting on posts
-- Adds votes_count to posts and a post_votes junction table.
-- Trigger maintains votes_count automatically on insert/update/delete.

-- ─── Add votes_count column to posts ─────────────────────────────────────────

ALTER TABLE posts ADD COLUMN IF NOT EXISTS votes_count integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_posts_votes ON posts(votes_count DESC);

-- ─── post_votes table ─────────────────────────────────────────────────────────

CREATE TABLE post_votes (
    user_id    uuid      NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id    uuid      NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
    direction  smallint  NOT NULL CHECK (direction IN (1, -1)),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (user_id, post_id)
);

CREATE INDEX idx_post_votes_post ON post_votes(post_id);

-- ─── RLS ──────────────────────────────────────────────────────────────────────

ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all votes (to show community totals)
CREATE POLICY "votes_read" ON post_votes
    FOR SELECT TO authenticated USING (true);

-- Users can only insert/update/delete their own votes
CREATE POLICY "votes_own_write" ON post_votes
    FOR ALL TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- ─── Trigger: maintain votes_count on posts ───────────────────────────────────

CREATE OR REPLACE FUNCTION handle_vote_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET votes_count = votes_count + NEW.direction WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET votes_count = votes_count - OLD.direction WHERE id = OLD.post_id;
    ELSIF TG_OP = 'UPDATE' THEN
        -- direction flipped: apply the delta (e.g. +1 → -1 means delta = -2)
        UPDATE posts SET votes_count = votes_count + (NEW.direction - OLD.direction) WHERE id = NEW.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_vote_change
    AFTER INSERT OR UPDATE OR DELETE ON post_votes
    FOR EACH ROW EXECUTE FUNCTION handle_vote_count();
