import { createAdminClient } from "@/lib/supabase/admin";
import { recordMetric } from "@/lib/metrics";
import { sendTelegramMessage } from "@/lib/telegram";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const SITE_URL = "https://kapster.my.id";

interface PageAudit {
  url: string;
  title: { content: string | null; length: number; hasMultipleH1: boolean };
  metaDescription: { content: string | null; length: number };
  headings: { h1: number; h2: number; h3: number; h4: number; hierarchyValid: boolean };
  images: { total: number; withAlt: number; withoutAlt: number };
  canonical: { url: string | null; matchesExpected: boolean };
  og: { title: boolean; description: boolean; image: boolean };
  schema: { hasJsonLd: boolean; types: string[] };
  links: { internal: number; external: number };
  robotsIndexable: boolean;
  performanceScore: number | null;
  gsc: { queries: string[]; impressions: number; clicks: number; avgPosition: number | null } | null;
  pageError: string | null;
}

async function main() {
  console.log(`[seo-audit] Starting at ${new Date().toISOString()}`);
  const supabase = await createAdminClient();

  // Phase 1: URL discovery
  console.log("[seo-audit] Phase 1: URL discovery...");
  const urls = await discoverUrls(supabase);
  console.log(`[seo-audit] Found ${urls.length} URLs`);

  // Phase 2: Per-page audit
  console.log("[seo-audit] Phase 2: Auditing pages...");
  const audits: PageAudit[] = [];
  for (const url of urls) {
    console.log(`[seo-audit]   ${url}`);
    const audit = await auditPage(url);
    audits.push(audit);
    await new Promise((r) => setTimeout(r, 1200));
  }

  // Phase 3: Scoring
  console.log("[seo-audit] Phase 3: Scoring...");
  const scores = audits.map(calcScore);
  if (scores.length === 0) {
    console.warn("[seo-audit] No URLs audited, skipping.");
    return;
  }
  const aggregateScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  const issuesCount = audits.filter((a) => !a.robotsIndexable || !a.title.content || !a.metaDescription.content).length;

  // Phase 4: LLM analysis
  console.log("[seo-audit] Phase 4: LLM analysis...");
  const analysis = await analyzeAudit(audits, scores, aggregateScore);

  // Phase 5: Save metrics
  console.log("[seo-audit] Phase 5: Saving metrics...");
  const metadata = {
    urlCount: urls.length,
    aggregateScore,
    scoreBreakdown: urls.map((u, i) => ({ url: u, score: scores[i] })),
    analysisSummary: analysis.summary,
    criticalIssues: analysis.critical,
    improvements: analysis.improvements,
  };

  await recordMetric(supabase, "seo_audit_score", aggregateScore, metadata);
  await recordMetric(supabase, "seo_audit_issues_count", issuesCount, { totalUrls: urls.length });

  // Compare with previous audit
  const { data: prevAudits } = await supabase
    .from("content_metrics")
    .select("metric_value, created_at, metadata")
    .eq("metric_name", "seo_audit_score")
    .order("created_at", { ascending: false })
    .limit(2);

  const prevScore = prevAudits && prevAudits.length > 1 ? prevAudits[1].metric_value : null;
  const delta = prevScore !== null ? aggregateScore - prevScore : 0;

  // Phase 6: Telegram notification
  console.log("[seo-audit] Phase 6: Telegram...");
  const emoji = delta > 0 ? "📈" : delta < 0 ? "📉" : "📊";
  const msg = `${emoji} *SEO Audit — kapster.my.id*
Skor: *${aggregateScore}/100*${delta !== 0 ? ` (${delta > 0 ? "+" : ""}${delta} dari sebelumnya)` : ""}

✅ *Improvement:*
${analysis.improvements.slice(0, 3).map((i: any) => `• \`${i.page.slice(0, 40)}\`: ${i.change}`).join("\n") || "Tidak ada perubahan signifikan"}

⚠️ *Perlu tindakan:*
${analysis.critical.slice(0, 5).map((c: any) => `• [${c.impact.toUpperCase()}] ${c.issue}`).join("\n") || "Tidak ada isu kritis"}

💡 *Rekomendasi utama:*
${analysis.summary}`;

  try {
    await sendTelegramMessage(msg);
  } catch (err) {
    console.warn("[seo-audit] Telegram notification failed:", err);
  }
  console.log("[seo-audit] Done!");
}

async function discoverUrls(supabase: any): Promise<string[]> {
  const urls: string[] = [SITE_URL, `${SITE_URL}/blog`];

  try {
    const res = await fetch(`${SITE_URL}/sitemap.xml`);
    const xml = await res.text();
    const locs = xml.match(/<loc>([^<]+)<\/loc>/g) || [];
    for (const loc of locs) {
      const u = loc.replace(/<\/?loc>/g, "");
      if (!urls.includes(u)) urls.push(u);
    }
  } catch {
    console.warn("[seo-audit] Sitemap fetch failed");
  }

  const { data: posts } = await supabase
    .from("blog_posts")
    .select("slug")
    .eq("status", "published");
  if (posts) {
    for (const post of posts) {
      const u = `${SITE_URL}/blog/${post.slug}`;
      if (!urls.includes(u)) urls.push(u);
    }
  }

  return urls.slice(0, 50);
}

async function auditPage(url: string): Promise<PageAudit> {
  const defaultAudit: PageAudit = {
    url,
    title: { content: null, length: 0, hasMultipleH1: false },
    metaDescription: { content: null, length: 0 },
    headings: { h1: 0, h2: 0, h3: 0, h4: 0, hierarchyValid: true },
    images: { total: 0, withAlt: 0, withoutAlt: 0 },
    canonical: { url: null, matchesExpected: true },
    og: { title: false, description: false, image: false },
    schema: { hasJsonLd: false, types: [] },
    links: { internal: 0, external: 0 },
    robotsIndexable: true,
    performanceScore: null,
    gsc: null,
    pageError: null,
  };

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) {
      defaultAudit.pageError = `HTTP ${res.status}`;
      return defaultAudit;
    }
    const html = await res.text();

    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    defaultAudit.title = {
      content: titleMatch?.[1]?.trim() || null,
      length: (titleMatch?.[1]?.trim() || "").length,
      hasMultipleH1: (html.match(/<h1[\s\S]*?<\/h1>/gi) || []).length > 1,
    };

    let metaDescContent: string | null = null;
    const metaDescMatch1 = html.match(/<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    if (metaDescMatch1) {
      metaDescContent = metaDescMatch1[1];
    } else {
      const metaDescMatch2 = html.match(/<meta\s+[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
      if (metaDescMatch2) metaDescContent = metaDescMatch2[1];
    }
    defaultAudit.metaDescription = {
      content: metaDescContent,
      length: (metaDescContent || "").length,
    };

    defaultAudit.headings.h1 = (html.match(/<h1[\s\S]*?<\/h1>/gi) || []).length;
    defaultAudit.headings.h2 = (html.match(/<h2[\s\S]*?<\/h2>/gi) || []).length;
    defaultAudit.headings.h3 = (html.match(/<h3[\s\S]*?<\/h3>/gi) || []).length;
    defaultAudit.headings.h4 = (html.match(/<h4[\s\S]*?<\/h4>/gi) || []).length;
    const firstHeading = html.match(/<(h[1-6])[\s>]/i);
    defaultAudit.headings.hierarchyValid = !!(defaultAudit.headings.h1 === 1 && firstHeading?.[1] === "h1");

    const imgTags = html.match(/<img[\s\S]*?>/gi) || [];
    defaultAudit.images.total = imgTags.length;
    defaultAudit.images.withAlt = imgTags.filter((img) => /alt\s*=\s*["']/.test(img)).length;
    defaultAudit.images.withoutAlt = defaultAudit.images.total - defaultAudit.images.withAlt;

    const canonicalMatch = html.match(/<link\s+[^>]*rel=["']canonical["'][^>]*href=["']([^"']*)["']/i);
    defaultAudit.canonical = {
      url: canonicalMatch?.[1] || null,
      matchesExpected: !!(canonicalMatch?.[1] && canonicalMatch[1] === url),
    };

    defaultAudit.og = {
      title: /<meta\s+[^>]*property=["']og:title["']/i.test(html),
      description: /<meta\s+[^>]*property=["']og:description["']/i.test(html),
      image: /<meta\s+[^>]*property=["']og:image["']/i.test(html),
    };

    const jsonLdBlocks = html.match(/<script\s+[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi) || [];
    const types: string[] = [];
    for (const block of jsonLdBlocks) {
      try {
        const json = JSON.parse(block.replace(/<[^>]*>/g, ""));
        const t = json["@type"] || (Array.isArray(json["@graph"]) ? json["@graph"][0]?.["@type"] : null);
        if (t) types.push(t);
      } catch { /* skip parse errors */ }
    }
    defaultAudit.schema = { hasJsonLd: jsonLdBlocks.length > 0, types };

    const allLinks = html.match(/<a\s+[^>]*href=["']([^"']*)["']/gi) || [];
    defaultAudit.links.internal = allLinks.filter((l) => {
      const href = l.match(/href=["']([^"']*)["']/i)?.[1] || "";
      return href.startsWith("/") || href.startsWith(SITE_URL);
    }).length;
    defaultAudit.links.external = allLinks.length - defaultAudit.links.internal;

    const robotsMeta = html.match(/<meta\s+[^>]*name=["']robots["'][^>]*content=["']([^"']*)["']/i);
    defaultAudit.robotsIndexable = !robotsMeta || !robotsMeta[1].includes("noindex");

    try {
      const psiKey = process.env.PSI_API_KEY;
      if (psiKey) {
        const psiRes = await fetch(
          `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile&key=${psiKey}`,
          { signal: AbortSignal.timeout(20000) },
        );
        const psiData = await psiRes.json();
        defaultAudit.performanceScore = Math.round(
          (psiData.lighthouseResult?.categories?.performance?.score || 0) * 100,
        );
      }
    } catch {
      console.warn(`[seo-audit]   PSI failed for ${url}`);
    }
  } catch (err) {
    defaultAudit.pageError = String(err);
  }

  return defaultAudit;
}

function calcScore(audit: PageAudit): number {
  const titleScore = audit.title.content && audit.title.length >= 30 && audit.title.length <= 60 ? 1 : 0.5;
  const metaScore = audit.metaDescription.content && audit.metaDescription.length >= 120 && audit.metaDescription.length <= 160 ? 1 : 0.5;
  const headingScore = audit.headings.h1 === 1 && audit.headings.hierarchyValid ? 1 : 0.5;
  const imageScore = audit.images.total > 0 ? audit.images.withAlt / audit.images.total : 1;
  const schemaScore = audit.schema.hasJsonLd ? 1 : 0.3;
  const canonicalScore = audit.canonical.matchesExpected ? 1 : 0.5;
  const ogScore = (audit.og.title && audit.og.description && audit.og.image) ? 1 : 0.5;
  const linkScore = audit.links.internal > audit.links.external ? 1 : 0.7;
  const robotsScore = audit.robotsIndexable ? 1 : 0;
  const perfScore = audit.performanceScore !== null ? audit.performanceScore / 100 : 0.5;

  const onpage = (titleScore * 15 + metaScore * 12 + headingScore * 12 + imageScore * 10 +
    schemaScore * 10 + canonicalScore * 8 + ogScore * 8 + linkScore * 5 + robotsScore * 5) / 85 * 100;

  const perfWeighted = perfScore * 100;
  const gscWeighted = audit.gsc ? calcGscScore(audit.gsc) : 50;

  return Math.round(onpage * 0.45 + gscWeighted * 0.30 + perfWeighted * 0.25);
}

function calcGscScore(gsc: NonNullable<PageAudit["gsc"]>): number {
  const posScore = gsc.avgPosition ? Math.max(0, (30 - gsc.avgPosition) / 29 * 100) : 50;
  const ctrBonus = gsc.clicks > 0 && gsc.impressions > 0 ? (gsc.clicks / gsc.impressions) : 0;
  const ctrScore = ctrBonus > 0.1 ? 20 : ctrBonus > 0.05 ? 10 : 0;
  const impScore = gsc.impressions > 1000 ? 5 : 0;
  return Math.min(100, posScore + ctrScore + impScore);
}

async function analyzeAudit(
  audits: PageAudit[],
  scores: number[],
  aggregateScore: number,
): Promise<{ summary: string; critical: Array<{ page: string; issue: string; impact: string; fix: string }>; improvements: Array<{ page: string; metric: string; change: string }> }> {
  const auditSummary = audits.map((a, i) =>
    `URL: ${a.url}\nScore: ${scores[i]}\n${a.pageError ? `ERROR: ${a.pageError}` : ""}` +
    `\nTitle: ${a.title.content ? `${a.title.content} (${a.title.length} chars, multiple H1: ${a.title.hasMultipleH1})` : "MISSING"}` +
    `\nMeta: ${a.metaDescription.content ? `${a.metaDescription.length} chars` : "MISSING"}` +
    `\nHeadings: H1=${a.headings.h1} H2=${a.headings.h2} H3=${a.headings.h3}` +
    `\nImages: ${a.images.withoutAlt}/${a.images.total} without alt` +
    `\nSchema: ${a.schema.hasJsonLd} (${a.schema.types.join(", ")})` +
    `\nCanonical: ${a.canonical.url ? "ok" : "missing"}` +
    `\nOG: title=${a.og.title} desc=${a.og.description} img=${a.og.image}` +
    `\nIndexable: ${a.robotsIndexable}` +
    `\nPerformance: ${a.performanceScore ?? "N/A"}` +
    `\n---`
  ).join("\n");

  const prompt = `Kamu adalah SEO auditor untuk kapster.my.id. Analisis hasil audit berikut dan beri rekomendasi prioritas.

AGGREGATE SCORE: ${aggregateScore}/100

PER-PAGE AUDIT:
${auditSummary}

RESPON JSON SAJA (tanpa markdown):
{
  "summary": "1 kalimat rekomendasi utama yang paling penting",
  "critical": [
    {"page": "url", "issue": "deskripsi", "impact": "high/medium/low", "fix": "langkah perbaikan"}
  ],
  "improvements": [
    {"page": "url", "metric": "contoh: performance score", "change": "contoh: 65 → 72"}
  ]
}`;

  try {
    const raw = await callGroq(prompt, 0.3, 2000);
    const cleaned = raw.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "").trim();
    return JSON.parse(cleaned);
  } catch {
    return {
      summary: "Analisis gagal, periksa log",
      critical: [],
      improvements: [],
    };
  }
}

async function callGroq(prompt: string, temperature = 0.3, maxTokens = 4096): Promise<string> {
  if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY not set");
  const res = await fetch(GROQ_API_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: "system", content: "Kamu adalah asisten SEO Kapster. Jawab dalam Bahasa Indonesia." }, { role: "user", content: prompt }],
      max_tokens: maxTokens,
      temperature,
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!res.ok) throw new Error(`Groq API error ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

main().catch((err) => {
  console.error("[seo-audit] Fatal:", err);
  process.exit(1);
});
