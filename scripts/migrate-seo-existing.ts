import { createAdminClient } from "@/lib/supabase/admin";
import { askOpenRouter, askOllamaWithSystem } from "@/lib/ollama";

const SITE_URL = "https://kapster.my.id";
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

async function callGroq(prompt: string, temperature = 0.7, maxTokens = 4096) {
  const key = process.env.GROQ_API_KEY;
  if (!key) throw new Error("GROQ_API_KEY not set");
  const models = [
    "llama-3.3-70b-versatile",
    "meta-llama/llama-4-scout-17b-16e-instruct",
    "qwen/qwen3-32b",
  ];
  if (prompt.length < 3000) models.push("llama-3.1-8b-instant");
  for (const model of models) {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages: [{ role: "user", content: prompt }], max_tokens: maxTokens, temperature }),
      signal: AbortSignal.timeout(120000),
    });
    if (res.ok) {
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? "";
    }
    const errText = await res.text().catch(() => "");
    if (res.status !== 429) throw new Error(`Groq ${model} error ${res.status}: ${errText}`);
  }
  throw new Error("All Groq models failed");
}

async function callLLM(prompt: string, temperature = 0.7, maxTokens = 4096): Promise<string> {
  const providers: { name: string; call: () => Promise<string> }[] = [
    { name: "groq", call: () => callGroq(prompt, temperature, maxTokens) },
  ];
  const orKey = process.env.OPENROUTER_API_KEY;
  if (orKey) {
    providers.push({
      name: "openrouter",
      call: async () => {
        const orModels = ["openai/gpt-oss-120b:free", "google/gemma-2-9b-it:free", "meta-llama/llama-3.2-11b-vision-instruct:free"];
        for (const model of orModels) {
          try { return await askOpenRouter(prompt, { temperature, max_tokens: maxTokens, model }); } catch {}
        }
        throw new Error("All OpenRouter models failed");
      },
    });
  }
  if (process.env.OLLAMA_API_KEY) {
    providers.push({
      name: "ollama",
      call: () => askOllamaWithSystem(prompt, undefined, { temperature, max_tokens: maxTokens }),
    });
  }
  for (const p of providers) {
    try {
      const result = await p.call();
      if (result) return result;
    } catch (err: any) { console.warn(`[migrate] ${p.name} failed: ${err.message}`); }
  }
  throw new Error("All LLM providers failed");
}

async function main() {
  const supabase = await createAdminClient();

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("id, slug, title, content_html, excerpt, meta_description")
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
      const schema = {
        "@context": "https://schema.org",
        "@type": "Article",
        headline: post.title,
        description: (post.meta_description || rawText.slice(0, 160)).trim(),
        author: { "@type": "Organization", name: "Kapster" },
        publisher: { "@type": "Organization", name: "Kapster", url: SITE_URL },
        datePublished: new Date().toISOString(),
        dateModified: new Date().toISOString(),
        mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE_URL}/blog/${post.slug}` },
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
        const links = related.slice(0, 2).map((p: any) => `<li><a href="/blog/${p.slug}">${p.title}</a></li>`).join("\n");
        html += `\n<h2>Baca Juga</h2>\n<ul>${links}\n</ul>`;
        updated = true;
        console.log("  + internal links");
      }
    }

    // 3. Excerpt / meta_description via LLM
    const needExcerpt = !post.excerpt || post.excerpt.length < 80;
    const needMeta = !post.meta_description || post.meta_description.length < 80;
    let newExcerpt = post.excerpt || "";
    let newMeta = post.meta_description || "";

    if ((needExcerpt || needMeta) && rawText.length > 200) {
      const metaPrompt = `Berdasarkan artikel berikut, buat SEO metadata dalam Bahasa Indonesia.\n\nJudul: "${post.title}"\n\n${rawText.slice(0, 3000)}\n\nOutput JSON SAJA:\n{"excerpt": "excerpt 150-200 karakter", "meta_description": "meta description 150-160 karakter untuk SEO"}`;
      try {
        const metaResponse = await callLLM(metaPrompt, 0.3, 500);
        const metaJson = JSON.parse(metaResponse.replace(/^```(?:json)?\s*|\s*```$/g, "").trim());
        if (metaJson.excerpt?.length > 80) newExcerpt = metaJson.excerpt;
        if (metaJson.meta_description?.length > 80) newMeta = metaJson.meta_description;
      } catch {}
      if (newExcerpt.length < 80) newExcerpt = rawText.slice(0, 200).replace(/^["'\s]+|["'\s]+$/g, "");
      if (newMeta.length < 80) newMeta = rawText.slice(0, 160).replace(/^["'\s]+|["'\s]+$/g, "");
      updated = true;
      console.log("  + excerpt/meta");
    }

    if (updated) {
      const { error } = await supabase.from("blog_posts").update({
        content_html: html,
        excerpt: newExcerpt,
        meta_description: newMeta,
      }).eq("id", post.id);
      if (error) console.error(`  ERROR: ${error.message}`);
      else console.log("  ✓ updated");
    } else {
      console.log("  - unchanged");
    }
  }
  console.log("\nDone!");
}

main().catch(console.error);
