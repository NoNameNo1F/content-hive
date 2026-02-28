-- Sprint 9: New 8-category taxonomy
-- ⚠️  DESTRUCTIVE — truncates categories table, clears all post_categories FK rows
-- Do NOT apply until owner confirms. Run manually via Supabase dashboard or:
--   npx supabase db push  (after removing this header comment)

-- Truncate and re-seed categories (FK on post_categories is ON DELETE SET NULL or CASCADE)
TRUNCATE TABLE categories RESTART IDENTITY CASCADE;

INSERT INTO categories (name, slug) VALUES
  ('Entertainment & Pop Culture', 'entertainment-pop-culture'),
  ('Lifestyle & Hobbies',         'lifestyle-hobbies'),
  ('Fashion & Beauty',            'fashion-beauty'),
  ('Health & Wellness',           'health-wellness'),
  ('Food & Cooking',              'food-cooking'),
  ('Education & DIY',             'education-diy'),
  ('Tech & Gaming',               'tech-gaming'),
  ('Professional / Niche',        'professional-niche');
