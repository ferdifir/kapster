ALTER TABLE blog_posts
ADD COLUMN content_plan_id UUID REFERENCES content_plans(id) ON DELETE SET NULL;

CREATE INDEX idx_blog_posts_content_plan_id ON blog_posts(content_plan_id);
