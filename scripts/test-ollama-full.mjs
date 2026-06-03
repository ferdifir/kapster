// Test Ollama Cloud with actual social content generation prompts
import { Ollama } from "ollama";

const ollama = new Ollama({
  host: "https://ollama.com",
  headers: { Authorization: "Bearer 63a817cc577044dfb37fb92539120164.VcTtGegqwSTaUIgTTNMeEHa0" },
});

const trendPrompt = `Kamu adalah analis tren media sosial untuk kapster.my.id, platform manajemen antrian digital untuk barbershop Indonesia.

TUGAS: Identifikasi 5 topik yang sedang tren atau relevan untuk barbershop di Indonesia hari ini.

Topik harus mencakup MIX dari 3 content pillar berikut:
1. EDUKASI BISNIS & MASALAH (35%) — tips kelola barbershop, bahaya antrian manual, hitung omzet, komisi kapster
2. SOLUSI & PRODUK (50%) — booking online, dashboard keuangan, antrian digital, harga Rp10.000/bulan
3. BUKTI & SOSIAL (15%) — testimoni, perbandingan sebelum-sesudah, social proof

Target pembaca: pemilik barbershop usia 23-40 di Indonesia.
Pain points: pelanggan kabur karena antrian, pendapatan bocor, bingung komisi kapster, ragu bayar software.

Berikan output JSON SAJA (tanpa markdown):
{"topics": [
  {"title": "judul topik", "pillar": "educational|solution|social_proof", "reasoning": "mengapa topik ini relevan hari ini", "platform_hint": "instagram|tiktok|both"}
]}

Pastikan variasi pillar sesuai persentase di atas untuk 5 topik.`;

function copyPrompt(topic) {
  return `Kamu adalah content creator untuk kapster.my.id, platform antrian digital untuk barbershop Indonesia.
Buat 1 konten social media berdasarkan topik: "${topic}"

Konten harus:
1. Hook yang strong (max 120 karakter)
2. Caption (100-150 kata, bahasa Indonesia santai tapi profesional, pake storytelling)
3. Call to action yang jelas
4. 5-8 hashtag relevan (campuran Indonesia dan Inggris)
5. Satu baris description (max 100 karakter) untuk card image

Pilih platform yang paling cocok: instagram, tiktok, atau both.

Output JSON SAJA:
{"platform": "instagram|tiktok|both", "hook": "hook text", "caption": "full caption", "hashtags": ["tag1", "tag2"], "description": "one line description for card", "content_type": "educational|solution|social_proof", "topic": "topik yang dipilih"}`;
}

async function testModel(model) {
  console.log(`\n========== ${model} ==========`);

  // Phase 1: Trend Research
  console.log("\n[TREND RESEARCH]");
  const t0 = Date.now();
  try {
    const trendRes = await ollama.chat({
      model,
      messages: [
        { role: "system", content: "Kamu adalah asisten konten Kapster untuk media sosial. Jawab dalam Bahasa Indonesia. Output informatif dan engaging." },
        { role: "user", content: trendPrompt },
      ],
      options: { temperature: 0.8, num_predict: 2000 },
    });
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    const raw = trendRes.message.content.trim();

    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const parsed = JSON.parse(cleaned);
    console.log("OK " + elapsed + "s — " + parsed.topics.length + " topics");
    for (const t of parsed.topics) {
      console.log("  - [" + t.pillar + "] " + (t.title || t.topic));
    }

    // Phase 2: Copy Generation (first topic)
    if (parsed.topics.length > 0) {
      const topic = parsed.topics[0].title || parsed.topics[0].topic;
      console.log("\n[COPY GEN — \"" + topic + "\"]");
      const t1 = Date.now();
      const copyRes = await ollama.chat({
        model,
        messages: [
          { role: "system", content: "Kamu adalah asisten konten Kapster untuk media sosial. Jawab dalam Bahasa Indonesia." },
          { role: "user", content: copyPrompt(topic) },
        ],
        options: { temperature: 0.8, num_predict: 1500 },
      });
      const elapsed2 = ((Date.now() - t1) / 1000).toFixed(1);
      const raw2 = copyRes.message.content.trim();
      const cleaned2 = raw2.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
      const parsed2 = JSON.parse(cleaned2);
      console.log("OK " + elapsed2 + "s — platform: " + parsed2.platform);
      console.log("  Hook: " + (parsed2.hook || "").slice(0, 80));
      console.log("  Desc: " + (parsed2.description || "").slice(0, 80));
      console.log("  Tags: " + (parsed2.hashtags ? parsed2.hashtags.length + " tags" : "0 tags"));
    }
  } catch (err) {
    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log("FAIL " + elapsed + "s — " + (err.message || err).slice(0, 120));
  }
}

async function main() {
  const models = ["devstral-2:123b", "gpt-oss:120b", "devstral-small-2:24b", "glm-4.6", "minimax-m2"];
  for (const m of models) await testModel(m);
  console.log("\n=== DONE ===");
}

main();
