# Manual Social Content Trigger — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `/konten [ig|tiktok] [topik]` Telegram command that generates 1 social media content item with improved prompts (PAS/AIDA framework, no fake social proof, title max ~10 words).

**Architecture:** Webhook handler parses `/konten` command → spawns `generate-social-content.ts` with `--platform` and `--topic` args asynchronously → script generates 1 item, saves to DB, creates card image, sends to Telegram. Zero state, zero multi-step.

**Tech Stack:** Next.js API route (webhook), child_process spawn, Groq API, satori + resvg, Supabase DB/Storage, Telegram Bot API.

**Plan location:** `docs/superpowers/plans/2026-06-02-manual-social-content-trigger.md`

**Spec location:** `docs/superpowers/specs/2026-06-02-manual-social-content-trigger-design.md`

---

### Task 1: Update generate-social-content.ts — CLI args + pillar cleanup

**Files:**
- Modify: `scripts/generate-social-content.ts:1-367` (entire file rewrite for the main function logic)

- [ ] **Step 1: Add CLI args parsing at the top of main()**

Add `process.argv` parsing for `--platform` and `--topic` after the existing imports and before `main()`:

```typescript
// CLI args parsing (for manual trigger via /konten command)
const args = process.argv.slice(2);
const platformArg = args.find((a) => a.startsWith("--platform="))?.split("=")[1];
const topicArg = args.find((a) => a.startsWith("--topic="))?.split("=")[1];

const IS_MANUAL = !!platformArg; // false = cron mode (4 items), true = manual (1 item)
const TARGET_PLATFORM = platformArg || null; // "instagram" | "tiktok" | null
const USER_TOPIC = topicArg || null; // custom topic or null
```

- [ ] **Step 2: Update trend research prompt — remove pillar percentages, support user topic**

Replace the trend prompt (lines 80-97) with:

```typescript
// Phase 1: Trend Research (skip if user provided a topic)
const trendPrompt = USER_TOPIC
  ? null
  : `Kamu adalah analis tren media sosial untuk kapster.my.id, platform manajemen antrian digital untuk barbershop Indonesia.

TUGAS: Identifikasi 1 topik yang sedang relevan untuk barbershop di Indonesia hari ini untuk platform ${TARGET_PLATFORM || "media sosial"}.

Topik bisa berupa:
- EDUKASI — tips, cara, strategi kelola barbershop
- SOLUSI — manfaat solusi digital untuk barbershop

Target pembaca: pemilik barbershop usia 23-40 di Indonesia.
Pain points: pelanggan kabur karena antrian, pendapatan bocor, bingung komisi kapster, ragu bayar software.

Berikan output JSON SAJA (tanpa markdown):
{"topics": [
  {"title": "judul topik", "pillar": "educational|solution", "reasoning": "mengapa topik ini relevan"}
]}`;
```

- [ ] **Step 3: Replace trend research call to handle both modes**

Replace lines 99-107 with:

```typescript
let trendData: { topics: Array<{ title: string; pillar: string; reasoning: string }> };

if (trendPrompt) {
  console.log(`[social-gen] Phase 1: Trend Research for ${TARGET_PLATFORM || "mixed"}...`);
  const trendResponse = await callGroq(trendPrompt, 0.8, 1000);
  try {
    trendData = JSON.parse(trendResponse.trim());
  } catch {
    console.error("[social-gen] Failed to parse trend response:", trendResponse);
    throw new Error("Trend research failed");
  }
} else {
  // User provided topic — use it directly
  trendData = {
    topics: [{ title: USER_TOPIC!, pillar: "solution", reasoning: "Topik dari user" }],
  };
}

console.log(`[social-gen] Using ${trendData.topics.length} topic(s)`);
```

- [ ] **Step 4: Replace content selection — manual mode picks 1, cron picks 4**

Replace lines 109-123 with:

```typescript
// Phase 2: Content Selection
console.log("[social-gen] Phase 2: Content Selection...");
const selectedTopics = IS_MANUAL
  ? [trendData.topics[0]] // Manual mode: just 1 item
  : trendData.topics.slice(0, 4); // Cron mode: up to 4 items
```

- [ ] **Step 5: Update copy generation prompt — PAS/AIDA, title ~10 words, platform from user**

Replace the copy prompt generation (lines 141-164) with:

```typescript
  const platformStr = IS_MANUAL ? TARGET_PLATFORM!.toUpperCase() : topic.platform_hint?.toUpperCase() || "INSTAGRAM";
  const copyPrompt = `Kamu adalah copywriter sosial media untuk kapster.my.id — platform manajemen antrian barbershop Indonesia.

TUGAS: Buat 1 caption ${platformStr} tentang topik: "${topic.title}"

TARGET AUDIENS: Pemilik barbershop Indonesia usia 23-40 tahun

FORMAT KONTEN: ${topic.pillar === "solution" ? "Solusi" : "Edukasi"}

GUIDELINES COPYWRITING:
1. Gunakan framework PAS (Problem → Agitation → Solution) atau AIDA (Attention → Interest → Desire → Action)
2. HOOK (1-2 kalimat pertama) — strong, relatable, pake pertanyaan retoris atau pain point
3. BODY (3-5 paragraf pendek) — bahasa Indonesia santai, natural, kayak ngobrol. Ceritakan masalah → perparah → kasih solusi
4. CTA (1 kalimat terakhir) — ajakan action yang jelas
5. TITLE/HOOK untuk card: max 10 KATA, harus menarik perhatian
6. DESCRIPTION: 1 baris max 100 karakter, menjelaskan isi konten
7. Integrasi Kapster natural (jangan hard-sell). Kapster disebut di bagian solusi.
8. 5-8 hashtag relevan (campuran Indonesia & Inggris)
9. Max 300 kata untuk Instagram, 200 karakter untuk TikTok
10. JANGAN gunakan testimoni palsu, data palsu, atau klaim tanpa sumber

Berikan output JSON SAJA:
{"title": "hook untuk card max 10 kata", "description": "satu baris desc max 100 char", "caption": "caption lengkap", "hashtags": ["#tag1", "#tag2"], "content_type": "educational|solution"}`;

- [ ] **Step 6: Update data flow to handle new JSON fields**

After parsing copy response, update the content item creation. The JSON now returns `title` and `description` directly instead of deriving them from caption:

```typescript
contents.push({
  platform: narrowPlatform(IS_MANUAL ? TARGET_PLATFORM! : topic.platform_hint || "instagram"),
  caption: copyData.caption,
  hashtags: copyData.hashtags || [],
  content_type: narrowPillar(topic.pillar),
  hook_type: copyData.hook_type || "question",
  trend_insight: topic.reasoning,
  topic: topic.title,
  // Store title + description from LLM for card image
  card_title: copyData.title || extractHook(copyData.caption),
  card_description: copyData.description || extractDescription(copyData.caption),
});
```

Also update the `SocialContentItem` interface to add `card_title` and `card_description`:

```typescript
interface SocialContentItem {
  platform: "instagram" | "tiktok" | "both";
  caption: string;
  hashtags: string[];
  content_type: "educational" | "solution" | "social_proof";
  hook_type: string;
  trend_insight: string;
  topic: string;
  card_title: string;   // NEW: from LLM, max ~10 words
  card_description: string; // NEW: from LLM, max 100 chars
}
```

- [ ] **Step 7: Update card image generation to use LLM-provided title/description**

Replace lines 239-250 where hook/description are extracted and passed to `generateCardImage`:

```typescript
for (const { id, item } of savedPosts) {
    try {
      const hook = item.card_title || extractHook(item.caption);
      const description = item.card_description || extractDescription(item.caption);
      const pngBuffer = await generateCardImage({
        platform: platformLabel[item.platform],
        pillar: pillarLabel[item.content_type],
        handle: socialHandle[item.platform],
        title: hook,
        description,
        topic: item.topic,
      });
```

- [ ] **Step 8: Remove social_proof references from pillar labels**

Replace line 223:
```typescript
const pillarLabel: Record<string, string> = { educational: "Edukasi", solution: "Solusi" };
```

Replace line 279:
```typescript
const pillarLabelFull: Record<string, string> = { educational: "Edukasi", solution: "Solusi" };
```

Replace the `pillarColors` in `generate-card-image.tsx` line 18-22 if needed — but the card doesn't need changes since the colors map will just have fewer entries.

- [ ] **Step 9: Update the main() call to handle manual mode logging differently**

Replace line 361:
```typescript
console.log(`[social-gen] Done! Generated ${savedPosts.length} items (${IS_MANUAL ? "manual" : "cron"})`);
```

- [ ] **Step 10: Commit**

```bash
git add scripts/generate-social-content.ts
git commit -m "feat: add CLI args to social content gen, fix pillar/prompt system"
```

---

### Task 2: Add /konten handler to Telegram webhook

**Files:**
- Modify: `app/api/telegram/webhook/route.ts:83-91`

- [ ] **Step 1: Add spawn import at top of file**

Add `spawn` to the existing imports (line 4 area — check current imports):

```typescript
import { spawn } from "child_process";
import path from "path";
```

- [ ] **Step 2: Add /konten command handler before the reply-to handler**

Insert after the callback_query block (after line 67, before line 70 — the reply_to_message handler):

```typescript
    // Handle /konten command — manual social content generation
    if (body.message?.text?.startsWith("/konten")) {
      const text = body.message.text.trim();
      const parts = text.split(/\s+/);
      const platform = parts[1]?.toLowerCase();

      if (platform !== "ig" && platform !== "tiktok") {
        await sendTelegramMessage(
          "Gunakan: <code>/konten [ig|tiktok] [opsional: topik]</code>\n\nContoh:\n<code>/konten ig</code> — konten Instagram, topik dari AI\n<code>/konten tiktok cara hitung omzet</code> — konten TikTok topik spesifik"
        );
        return NextResponse.json({ ok: true });
      }

      const topic = parts.slice(2).join(" ") || "";
      const platformFull = platform === "ig" ? "Instagram" : "TikTok";
      await sendTelegramMessage(`⏳ Lagi nulis konten ${platformFull}...${topic ? ` (topik: "${topic}")` : ""}`);

      // Spawn async — same pattern as cron endpoint
      const scriptPath = path.join(process.cwd(), "scripts/generate-social-content.ts");
      const spawnArgs = ["tsx", scriptPath, `--platform=${platform === "ig" ? "instagram" : "tiktok"}`];
      if (topic) spawnArgs.push(`--topic="${topic}"`);

      spawn("npx", spawnArgs, {
        cwd: process.cwd(),
        stdio: "inherit",
        env: { ...process.env },
        shell: true,
      });

      return NextResponse.json({ ok: true });
    }
```

- [ ] **Step 3: Verify imports are complete**

Ensure the file imports `sendTelegramMessage` already (it does — line 4). The spawn + path imports need to be added.

- [ ] **Step 4: Commit**

```bash
git add app/api/telegram/webhook/route.ts
git commit -m "feat: add /konten command to Telegram webhook"
```

---

### Task 3: TypeScript compile check + deploy

- [ ] **Step 1: Run TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -50
```

Expected: No errors, or only pre-existing errors unrelated to our changes.

- [ ] **Step 2: If errors, fix them**

Common issues: missing `SocialContentItem` field `card_title`, wrong type for `pillarColor`/`pillarLabel` lookups if the card still references `social_proof`. Fix until `npx tsc --noEmit` passes.

- [ ] **Step 3: Deploy**

```bash
bash deploy.sh
```

- [ ] **Step 4: Test in Telegram**

Send `/konten ig` to the bot. Verify:
1. Bot replies "⏳ Lagi nulis konten Instagram..."
2. Within ~30s, a card image + caption appears in the chat
3. The card has title max ~10 kata, description, platform badge @kapster.myid
4. Caption uses PAS/AIDA framework, no fake testimonials
5. Inline buttons work (posted_ig/posted_tt/draft)

- [ ] **Step 5: Commit final**

```bash
git add -A
git commit -m "fix: typecheck fixes for social content gen"
```
