-- ContentHive — Production RLS Policies
-- Migration: 20260226182417_production_rls
-- Replaces the dev_ bootstrap policies from the initial migration.
-- These are the production access rules enforced at the DB layer.

-- ─── HELPER FUNCTION ──────────────────────────────────────────────────────────

-- Checks if the current user has admin role.
-- SECURITY DEFINER so it can read profiles without an infinite RLS loop.
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ─── DROP BOOTSTRAP POLICIES ──────────────────────────────────────────────────

DROP POLICY IF EXISTS "dev_profiles_all" ON profiles;
DROP POLICY IF EXISTS "dev_posts_all" ON posts;
DROP POLICY IF EXISTS "dev_post_tags_all" ON post_tags;
DROP POLICY IF EXISTS "dev_categories_all" ON categories;
DROP POLICY IF EXISTS "dev_post_categories_all" ON post_categories;
DROP POLICY IF EXISTS "dev_bookmarks_all" ON bookmarks;
DROP POLICY IF EXISTS "dev_user_interests_all" ON user_interests;
DROP POLICY IF EXISTS "public_posts_read" ON posts;
DROP POLICY IF EXISTS "public_post_tags_read" ON post_tags;
DROP POLICY IF EXISTS "public_categories_read" ON categories;
DROP POLICY IF EXISTS "public_post_categories_read" ON post_categories;
DROP POLICY IF EXISTS "public_profiles_read" ON profiles;

-- ─── PROFILES ─────────────────────────────────────────────────────────────────

-- Anyone can view any profile (username, avatar — no sensitive data)
CREATE POLICY "profiles visible to all"
  ON profiles FOR SELECT
  USING (true);

-- Users can only update their own profile
CREATE POLICY "users update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- ─── POSTS ────────────────────────────────────────────────────────────────────

-- Public posts are readable by everyone (visitors + members)
CREATE POLICY "public posts visible to all"
  ON posts FOR SELECT
  USING (visibility = 'public');

-- Team posts are only readable by authenticated members
CREATE POLICY "team posts visible to members"
  ON posts FOR SELECT
  TO authenticated
  USING (visibility = 'team');

-- Only authenticated users can create posts (must be their own)
CREATE POLICY "users insert own posts"
  ON posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts; admins can update any post
CREATE POLICY "users update own posts"
  ON posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- Users can delete their own posts; admins can delete any post
CREATE POLICY "users delete own posts"
  ON posts FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR is_admin());

-- ─── POST_TAGS ────────────────────────────────────────────────────────────────

-- Tags are visible only when the associated post is visible (respects visibility)
CREATE POLICY "post_tags visible if post visible"
  ON post_tags FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND (posts.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

-- Only the post owner (or admin) can manage tags on their post
CREATE POLICY "users manage own post_tags"
  ON post_tags FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND (posts.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "users delete own post_tags"
  ON post_tags FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_tags.post_id
      AND (posts.user_id = auth.uid() OR is_admin())
    )
  );

-- ─── CATEGORIES ───────────────────────────────────────────────────────────────

-- Categories are public metadata — anyone can read
CREATE POLICY "categories readable by all"
  ON categories FOR SELECT
  USING (true);

-- Only admins can manage categories (insert/update/delete)
CREATE POLICY "admins manage categories"
  ON categories FOR ALL
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- ─── POST_CATEGORIES ──────────────────────────────────────────────────────────

-- Visible only when the associated post is visible
CREATE POLICY "post_categories visible if post visible"
  ON post_categories FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_categories.post_id
      AND (posts.visibility = 'public' OR auth.uid() IS NOT NULL)
    )
  );

-- Only the post owner (or admin) can assign categories to their post
CREATE POLICY "users manage own post_categories"
  ON post_categories FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_categories.post_id
      AND (posts.user_id = auth.uid() OR is_admin())
    )
  );

CREATE POLICY "users delete own post_categories"
  ON post_categories FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM posts
      WHERE posts.id = post_categories.post_id
      AND (posts.user_id = auth.uid() OR is_admin())
    )
  );

-- ─── BOOKMARKS ────────────────────────────────────────────────────────────────

-- Users can only see and manage their own bookmarks
CREATE POLICY "users manage own bookmarks"
  ON bookmarks FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ─── USER_INTERESTS ───────────────────────────────────────────────────────────

-- Users can only see and manage their own interest tags
CREATE POLICY "users manage own interests"
  ON user_interests FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
