import { createAdminClient } from "@/lib/supabase/admin";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const SITE_URL = "https://kapster.my.id";

// Use smaller model for formatting-only task — less tokens, faster, cheaper
const GROQ_MODEL = "llama-3.1-8b-instant";

async function callGroq(prompt: string, retries = 3): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODEL,
          messages: [
            {
              role: "system",
              content:
                "Kamu adalah ahli SEO dan content formatter. Tugasmu hanya MEMPERBAIKI FORMAT HTML — TIDAK mengubah makna atau informasi.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 8192,
          temperature: 0.2,
        }),
        signal: AbortSignal.timeout(120000),
      });

      if (res.status === 429) {
        const retryAfter = parseInt(res.headers.get("Retry-After") || "30", 10);
        const waitMs = retryAfter * 1000 + 5000;
        console.log(`  Rate limited, waiting ${waitMs / 1000}s...`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!res.ok) throw new Error(`Groq API error ${res.status}: ${await res.text()}`);

      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    } catch (err) {
      if (attempt === retries) throw err;
      console.log(`  Attempt ${attempt} failed, retrying in 10s...`);
      await new Promise((r) => setTimeout(r, 10000));
    }
  }
  throw new Error("Max retries exceeded");
}

async function main() {
  console.log("[enhance] Starting...");

  const supabase = await createAdminClient();

  const { data: posts, error } = await supabase
    .from("blog_posts")
    .select("id, title, slug, content_html, keywords")
    .eq("status", "published")
    .order("published_at", { ascending: true });

  if (error) throw error;
  if (!posts || posts.length === 0) {
    console.log("[enhance] No posts found.");
    return;
  }

  console.log(`[enhance] Found ${posts.length} posts.`);

  for (const post of posts) {
    // Check if already enhanced (has <strong>, <em>, or <blockquote> beyond just existing ones)
    const strongCount = (post.content_html.match(/<strong>/g) || []).length;
    const emCount = (post.content_html.match(/<em>/g) || []).length;
    const blockquoteCount = (post.content_html.match(/<blockquote>/g) || []).length;
    const h3Count = (post.content_html.match(/<h3>/g) || []).length;

    console.log(`\n[enhance] "${post.title}": <strong>=${strongCount} <em>=${emCount} <blockquote>=${blockquoteCount} <h3>=${h3Count}`);

    if (strongCount >= 5 && emCount >= 2 && (blockquoteCount >= 1 || h3Count >= 1)) {
      console.log(`  Already enhanced, skipping.`);
      continue;
    }

    console.log(`  Enhancing (${post.content_html.length} chars)...`);

    const enhancePrompt = `Perbaiki FORMAT HTML konten blog ini. JANGAN mengubah konten, informasi, urutan, atau menambah informasi baru.

ATURAN:
1. JANGAN ubah <h2> — biarkan heading levels sesuai aslinya.
2. Tambahkan <strong> pada kata kunci/poin penting (minimal 5).
3. Tambahkan <em> pada istilah asing/penekanan (minimal 2).
4. Jika ada kutipan atau data statistik, bungkus dengan <blockquote>.
5. Jika ada sub-topik, gunakan <h3>.
6. Variasikan struktur section — jangan semua h2→p→ul→p.
7. HANYA output HTML — tanpa markdown, tanpa penjelasan.

HTML:
${post.content_html}`;

    try {
      const result = await callGroq(enhancePrompt);
      const cleanHtml = result.replace(/^```html\s*|\s*```$/g, "").trim();

      if (!cleanHtml || cleanHtml.length < 100) {
        console.error(`  Output too short, skipping.`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("blog_posts")
        .update({ content_html: cleanHtml, updated_at: new Date().toISOString() })
        .eq("id", post.id);

      if (updateError) {
        console.error(`  Update failed:`, updateError);
      } else {
        console.log(`  ✅ Updated (${cleanHtml.length} chars)`);
      }
    } catch (err) {
      console.error(`  Error:`, err);
    }

    await new Promise((r) => setTimeout(r, 2000));
  }

  console.log("\n[enhance] Done!");
}

main().catch((err) => {
  console.error("[enhance] Fatal:", err);
  process.exit(1);
});
