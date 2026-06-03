import { createAdminClient } from "@/lib/supabase/admin";
import { callLLM } from "./generate-blog-post";

const SITE_URL = "https://kapster.my.id";

async function main() {
  const supabase = await createAdminClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content_html, excerpt, meta_description, keywords, status")
    .order("created_at", { ascending: false });

  if (!posts) { console.log("No posts found"); return; }
  console.log(`Processing ${posts.length} posts...`);

  for (const post of posts) {
    console.log(`\n[${post.slug}] ${post.title?.slice(0, 50)}`);
    let updated = false;
    let html = post.content_html || "";
    const rawText = html.replace(/<[^>]*>/g, "").trim();
    const wordCount = rawText.split(/\s+/).length;

    // 1. Schema JSON-LD
    if (!html.includes("application/ld+json")) {
      const slug = post.slug;
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: (post.meta_description || rawText.slice(0, 160)).trim(),
        author: { "@type": "Organization", name: "Kapster" },
        publisher: { "@type": "Organization", name: "Kapster", url: SITE_URL },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${slug}` },
        wordCount,
      };
      html += `\n<script type="application/ld+json">${JSON.stringify(schema)}</script>`;
      updated = true;
      console.log("  + schema");
    }

    // 2. Internal links (Baca Juga)
    if (!html.includes("Baca Juga")) {
      const { data: related } = await supabase
        .from("blog_posts")
        .select("slug, title")
        .neq("slug", post.slug)
        .eq("status", "published")
        .order("created_at", { ascending: false })
        .limit(3);
      if (related && related.length >= 2) {
        const links = related.slice(0, 2)
          .map((p: any) => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`)
          .join("\n");
        html += `\n<h2>Baca Juga</h2>\n<ul>${links}\n</ul>`;
        updated = true;
        console.log("  + internal links");
      }
    }

    // 3. Excerpt / meta_description
    const metaNeedsUpdate = (!post.excerpt || post.excerpt.length < 80) || (!post.meta_description || post.meta_description.length < 80);
    let newExcerpt = post.excerpt;
    let newMeta = post.meta_description;

    if (metaNeedsUpdate && rawText.length > 200) {
      const metaPrompt = `Berdasarkan artikel berikut, buat SEO metadata dalam Bahasa Indonesia.

Judul: "${post.title}"

${rawText.slice(0, 3000)}

Output JSON SAJA:
{"excerpt": "excerpt 150-200 karakter", "meta_description": "meta description 150-160 karakter untuk SEO"}`;
      try {
        const metaResponse = await callLLM(metaPrompt, 0.3, 500);
        const metaJson = JSON.parse(metaResponse.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
        if (metaJson.excerpt?.length > 80) newExcerpt = metaJson.excerpt;
        if (metaJson.meta_description?.length > 80) newMeta = metaJson.meta_description;
      } catch { /* use fallback */ }
      if (!newExcerpt || newExcerpt.length < 80) newExcerpt = rawText.slice(0, 200).replace(/^["'\s]+|["'\s]+$/g, "");
      if (!newMeta || newMeta.length < 80) newMeta = rawText.slice(0, 160).replace(/^["'\s]+|["'\s]+$/g, "");
      updated = true;
      console.log("  + excerpt/meta");
    }

    if (updated) {
      const { error } = await supabase
        .from("blog_posts")
        .update({
          content_html: html,
          excerpt: newExcerpt || post.excerpt,
          meta_description: newMeta || post.meta_description,
        })
        .eq("id", post.id);
      if (error) console.error(`  ERROR: ${error.message}`);
      else console.log("  ✓ updated");
    } else {
      console.log("  - unchanged (already has schema + links + meta)");
    }
  }

  console.log("\nDone!");
}

main().catch(console.error);
