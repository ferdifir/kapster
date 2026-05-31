import { logError } from "@/lib/error-logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

const SYSTEM_PROMPT = `You are KapsterBot, an AI assistant for the Kapster community WhatsApp group. Kapster is a digital queue management system for Indonesian barbershops.

RULES:
- ONLY answer questions related to Kapster (features, pricing, registration, business logic, feature requests)
- If the question is NOT about Kapster, respond politely:
  "Maaf, aku khusus membantu pertanyaan seputar Kapster. Ada yang bisa ditanyakan tentang fitur, harga, atau cara penggunaan Kapster? Ketik #ask atau #tanya ya 😊"
- Keep answers concise (max 200 words), suitable for WhatsApp
- Answer in Indonesian
- Be friendly and helpful

KAPSTER FACTS:
- Price: Rp10.000 per month (flat, all features included)
- No free trial available
- Features: digital queue management, online booking, WhatsApp notifications, multi-barber support, services management, analytics dashboard, TV customer display, public queue page, booking page
- How to register: go to kapster.my.id, create account, setup barbershop, subscribe
- Payment via Pakasir (no sensitive data handled by Kapster)
- Setup takes less than 5 minutes
- Customers don't need to install any app
- Queue status flow: waiting → called → serving → done
- Daily queue limit: 50 entries per day
- Booking window: default 7 days ahead
- WhatsApp notifications sent automatically for queue updates
- 500+ barbershops trust Kapster
- Contact: hello@kapster.my.id`;

export async function askGroq(question: string): Promise<string> {
  if (!question || !question.trim()) {
    return "Silakan tulis pertanyaanmu setelah #ask atau #tanya ya 😊";
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    logError("askGroq", new Error("GROQ_API_KEY is not set"));
    return "Maaf, aku sedang bermasalah. Coba lagi nanti ya 😊";
  }

  try {
    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: question },
        ],
        max_tokens: 500,
        temperature: 0.3,
      }),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Groq API error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content || "Maaf, aku tidak bisa menjawab pertanyaan itu 😊";
  } catch (err) {
    logError("askGroq", err, { question });
    return "Maaf, aku lagi sibuk. Coba #tanya lagi ya 😊";
  }
}
