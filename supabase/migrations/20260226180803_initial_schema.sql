-- ContentHive — Initial Schema
-- Migration: 20260226180803_initial_schema
-- All PKs are uuid. All tables have created_at.
-- RLS is enabled on every table — policies added here as permissive defaults.
-- agent-backend will write final production RLS policies in Phase 1.

-- ─── ENUMS ────────────────────────────────────────────────────────────────────

CREATE TYPE post_type AS ENUM ('video', 'link', 'text');
CREATE TYPE post_visibility AS ENUM ('public', 'team');
CREATE TYPE user_role AS ENUM ('visitor', 'member', 'admin');

-- ─── TABLES ───────────────────────────────────────────────────────────────────

-- Extends auth.users. Created automatically on first login via trigger.
CREATE TABLE profiles (
    id          uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username    text UNIQUE NOT NULL,
    avatar_url  text,
    role        user_role NOT NULL DEFAULT 'member',
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Core content table.
CREATE TABLE posts (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    type        post_type NOT NULL,
    title       text NOT NULL,
    description text,
    url         text,
    thumbnail   text,
    visibility  post_visibility NOT NULL DEFAULT 'public',
    saves_count integer NOT NULL DEFAULT 0,
    fts         tsvector,
    created_at  timestamptz NOT NULL DEFAULT now(),
    updated_at  timestamptz NOT NULL DEFAULT now()
);

-- Tags on posts (many-to-many via junction).
CREATE TABLE post_tags (
    post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag         text NOT NULL,
    PRIMARY KEY (post_id, tag)
);

-- Predefined categories, managed by admin.
CREATE TABLE categories (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name        text NOT NULL,
    slug        text UNIQUE NOT NULL,
    created_at  timestamptz NOT NULL DEFAULT now()
);

-- Posts assigned to categories (many-to-many).
CREATE TABLE post_categories (
    post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, category_id)
);

-- User bookmarks / saved posts.
CREATE TABLE bookmarks (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    post_id     uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at  timestamptz NOT NULL DEFAULT now(),
    UNIQUE (user_id, post_id)
);

-- Interest tags selected by user during onboarding.
CREATE TABLE user_interests (
    user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    tag         text NOT NULL,
    PRIMARY KEY (user_id, tag)
);

-- ─── INDEXES ──────────────────────────────────────────────────────────────────

CREATE INDEX idx_posts_visibility_created ON posts(visibility, created_at DESC);
CREATE INDEX idx_posts_visibility_saves ON posts(visibility, saves_count DESC);
CREATE INDEX idx_post_tags_tag ON post_tags(tag);
CREATE INDEX idx_user_interests_user ON user_interests(user_id);
CREATE INDEX idx_bookmarks_user ON bookmarks(user_id, created_at DESC);
CREATE INDEX idx_posts_fts ON posts USING gin(fts);

-- ─── TRIGGERS ─────────────────────────────────────────────────────────────────

-- Auto-create profile when a new auth.users row is inserted.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, username, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'avatar_url'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Auto-update posts.updated_at on row update.
CREATE OR REPLACE FUNCTION handle_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_updated
    BEFORE UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION handle_updated_at();

-- Populate fts vector on insert/update of posts (title A, description B).
CREATE OR REPLACE FUNCTION update_post_fts()
RETURNS trigger AS $$
BEGIN
    NEW.fts :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_post_fts_update
    BEFORE INSERT OR UPDATE OF title, description ON posts
    FOR EACH ROW EXECUTE FUNCTION update_post_fts();

-- Maintain saves_count on bookmark insert/delete.
CREATE OR REPLACE FUNCTION handle_bookmark_count()
RETURNS trigger AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE posts SET saves_count = saves_count + 1 WHERE id = NEW.post_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE posts SET saves_count = GREATEST(saves_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_bookmark_change
    AFTER INSERT OR DELETE ON bookmarks
    FOR EACH ROW EXECUTE FUNCTION handle_bookmark_count();

-- ─── ROW-LEVEL SECURITY ───────────────────────────────────────────────────────
-- RLS enabled on all tables. Permissive bootstrap policies below.
-- Production policies (scoped by role) are written by agent-backend in Phase 1.

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests ENABLE ROW LEVEL SECURITY;

-- Bootstrap: allow authenticated users full access for development.
-- agent-backend replaces these with production-grade policies in Phase 1.
CREATE POLICY "dev_profiles_all" ON profiles FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_posts_all" ON posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_post_tags_all" ON post_tags FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_categories_all" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_post_categories_all" ON post_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_bookmarks_all" ON bookmarks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "dev_user_interests_all" ON user_interests FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allow public read of public posts and categories (for visitor feed).
CREATE POLICY "public_posts_read" ON posts FOR SELECT TO anon USING (visibility = 'public');
CREATE POLICY "public_post_tags_read" ON post_tags FOR SELECT TO anon USING (true);
CREATE POLICY "public_categories_read" ON categories FOR SELECT TO anon USING (true);
CREATE POLICY "public_post_categories_read" ON post_categories FOR SELECT TO anon USING (true);
CREATE POLICY "public_profiles_read" ON profiles FOR SELECT TO anon USING (true);

-- ─── SEED DATA ────────────────────────────────────────────────────────────────

INSERT INTO categories (name, slug) VALUES
    ('Engineering',     'engineering'),
    ('Design',          'design'),
    ('Product',         'product'),
    ('Data & AI',       'data-ai'),
    ('Career & Growth', 'career-growth'),
    ('Tools',           'tools'),
    ('Inspiration',     'inspiration');
