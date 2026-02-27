-- Sprint 3: Replace tech-focused categories with the 6 content creation framework types
-- Based on: Bài 9 — Khung Content phổ biến (Popular Content Frameworks)
-- Cascade deletes post_categories junction rows for removed categories.

DELETE FROM post_categories
WHERE category_id IN (SELECT id FROM categories);

DELETE FROM categories;

INSERT INTO categories (name, slug) VALUES
    ('Personal Storytelling', 'personal-story'),
    ('Collections',           'collections'),
    ('Comparison',            'comparison'),
    ('Fact-Check',            'fact-check'),
    ('Tutorial',              'tutorial'),
    ('Product & Brand Story', 'product-story');
