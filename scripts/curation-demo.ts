async function main() {
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) { console.error("GROQ_API_KEY not set"); return; }

  const demoData = "Kamu adalah content strategist untuk kapster.my.id, platform manajemen antrian digital untuk barbershop Indonesia.\n\nBerikut adalah data tren real dari Indonesia hari ini:\n\nGOOGLE_TRENDS:\n  - THR (score: 100)\n  - mudik (score: 85)\n  - AI Indonesia (score: 70)\n  - efisiensi bisnis (score: 65)\n  - startup Indonesia (score: 55)\n  - UMKM digital (score: 50)\n\nGOOGLE_NEWS:\n  - Pemerintah dorong digitalisasi UMKM 2026\n  - Startup AI Indonesia raih pendanaan\n  - Barbershop modern tren di kota besar\n\nREDDIT:\n  - rekomendasi aplikasi manajemen antrian\n  - cara hitung gaji karyawan kecil\n  - pengalaman buka barbershop modal minim\n\nTopik yang SUDAH pernah dibuat:\n  - Cara Mengoptimalkan Waktu Antrian dengan Teknologi AI\n  - Tips Memilih Software Antrian untuk Barbershop\n\nTUGAS: Analisis data di atas dan pilih 1 topik yang PALING RELEVAN untuk pemilik barbershop Indonesia. HINDARI topik yang mirip dengan daftar yang sudah pernah dibuat. Output JSON SAJA: {\"topics\": [{\"title\": \"...\", \"pillar\": \"educational|solution\", \"reasoning\": \"...\"}]}";

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${GROQ_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: [{ role: "user", content: demoData }], max_tokens: 500, temperature: 0.7 }),
  });
  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content ?? "";
  const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned);
  for (const t of parsed.topics) {
    console.log("TOPIC     :", t.title);
    console.log("PILLAR    :", t.pillar);
    console.log("REASONING :", t.reasoning);
  }
}
main().catch(console.error);
