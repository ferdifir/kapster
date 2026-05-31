import { createAdminClient } from "@/lib/supabase/admin"

export type BlogPost = {
  id: string
  title: string
  slug: string
  content_html: string
  excerpt: string
  meta_description: string
  keywords: string[]
  og_image_url: string | null
  topics: string[]
  status: "draft" | "published" | "cancelled"
  telegram_msg_id: number | null
  published_at: string | null
  created_at: string
  updated_at: string
}

const POSTS_PER_PAGE = 12

export async function getPublishedPosts(page = 1) {
  const supabase = createAdminClient()
  const from = (page - 1) * POSTS_PER_PAGE
  const to = from + POSTS_PER_PAGE - 1

  const { data, error, count } = await supabase
    .from("blog_posts")
    .select("*", { count: "exact" })
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false })
    .range(from, to)

  if (error) throw error
  return { posts: data as BlogPost[], total: count ?? 0, page, pageSize: POSTS_PER_PAGE }
}

export async function getPublishedPostBySlug(slug: string) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())
    .single()

  if (error) return null
  return data as BlogPost
}

export async function getRelatedPosts(post: BlogPost, limit = 4) {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .neq("id", post.id)
    .eq("status", "published")
    .overlaps("topics", post.topics)
    .order("published_at", { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as BlogPost[]
}

export async function getAllPublishedSlugs() {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("slug, updated_at")
    .eq("status", "published")
    .lte("published_at", new Date().toISOString())

  if (error) return []
  return data
}

export async function updateBlogPostStatus(
  id: string,
  status: "draft" | "published" | "cancelled"
) {
  const admin = await createAdminClient()
  const { error } = await admin
    .from("blog_posts")
    .update({
      status,
      ...(status === "published" ? { published_at: new Date().toISOString() } : null),
    } as any)
    .eq("id", id)

  if (error) throw error
}
