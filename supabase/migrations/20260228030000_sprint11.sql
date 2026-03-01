-- Sprint 11: Comments + Saved Lists + Write Confirmations

-- ── 1. Add comments_count to posts ───────────────────────────────────────────
ALTER TABLE posts ADD COLUMN comments_count int NOT NULL DEFAULT 0;

-- ── 2. Comments table ────────────────────────────────────────────────────────
CREATE TABLE comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id  uuid REFERENCES comments(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comments_public_read"  ON comments FOR SELECT USING (true);
CREATE POLICY "comments_auth_insert"  ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comments_owner_delete" ON comments FOR DELETE  USING (auth.uid() = user_id);

-- Trigger: maintain comments_count on posts
CREATE OR REPLACE FUNCTION increment_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION decrement_comments_count()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE posts SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.post_id;
  RETURN OLD;
END;
$$;

CREATE TRIGGER on_comment_insert
  AFTER INSERT ON comments
  FOR EACH ROW EXECUTE FUNCTION increment_comments_count();

CREATE TRIGGER on_comment_delete
  AFTER DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION decrement_comments_count();

-- ── 3. Saved lists ───────────────────────────────────────────────────────────
CREATE TABLE save_lists (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text NOT NULL CHECK (char_length(name) BETWEEN 1 AND 80),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE save_lists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "save_lists_owner_all" ON save_lists FOR ALL USING (auth.uid() = user_id);

CREATE TABLE save_list_items (
  list_id  uuid NOT NULL REFERENCES save_lists(id) ON DELETE CASCADE,
  post_id  uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  PRIMARY KEY (list_id, post_id)
);

ALTER TABLE save_list_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "save_list_items_owner_select" ON save_list_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM save_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid()));
CREATE POLICY "save_list_items_owner_insert" ON save_list_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM save_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid()));
CREATE POLICY "save_list_items_owner_delete" ON save_list_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM save_lists sl WHERE sl.id = list_id AND sl.user_id = auth.uid()));

-- ── 4. Write confirmations (agent two-phase commit) ──────────────────────────
CREATE TABLE write_confirmations (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tool_name   text NOT NULL,
  payload     jsonb NOT NULL,
  expires_at  timestamptz NOT NULL DEFAULT (now() + interval '15 minutes'),
  executed_at timestamptz,
  created_at  timestamptz DEFAULT now()
);

ALTER TABLE write_confirmations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "write_confirmations_owner_all" ON write_confirmations FOR ALL USING (auth.uid() = user_id);
