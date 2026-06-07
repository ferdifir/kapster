import { logError } from "@/lib/error-logger";

const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const MODEL = "llama-3.3-70b-versatile";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

interface LlmOptions {
  temperature?: number;
  maxTokens?: number;
  responseFormat?: "text" | "json";
}

export async function askLlm(
  messages: Message[],
  options: LlmOptions = {}
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error("GROQ_API_KEY is not set");
  }

  const { temperature = 0.3, maxTokens = 1000, responseFormat = "text" } = options;

  try {
    const body: Record<string, unknown> = {
      model: MODEL,
      messages,
      max_tokens: maxTokens,
      temperature,
    };

    if (responseFormat === "json") {
      body.response_format = { type: "json_object" };
    }

    const res = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => "");
      throw new Error(`Groq API error ${res.status}: ${errorText}`);
    }

    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    logError("agents/llm", err instanceof Error ? err : new Error(String(err)), {
      messageCount: messages.length,
    });
    throw err;
  }
}
