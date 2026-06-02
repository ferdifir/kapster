import { logError } from "@/lib/error-logger";

const OLLAMA_API_BASE = process.env.OLLAMA_API_BASE || "https://ollama.com/v1";
const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "devstral-2:123b";

export interface OllamaChatOptions {
  system?: string;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  stream?: boolean;
}

export type OllamaMessage = { role: "user" | "assistant" | "system"; content: string };

async function ollamaFetch(path: string, body: unknown) {
  const res = await fetch(`${OLLAMA_API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(OLLAMA_API_KEY ? { Authorization: `Bearer ${OLLAMA_API_KEY}` } : {}),
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Ollama API error ${res.status}: ${text}`);
  }
  return res.json();
}

export async function askOllama(
  messages: OllamaMessage[],
  opts: OllamaChatOptions = {}
): Promise<string> {
  const model = opts.model || DEFAULT_MODEL;
  try {
    const data = await ollamaFetch("/chat/completions", {
      model,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
      temperature: opts.temperature ?? 0.7,
      max_tokens: opts.max_tokens ?? 4096,
    });
    return data.choices?.[0]?.message?.content ?? "";
  } catch (err) {
    logError("askOllama", err, { model, messageCount: messages.length });
    throw err;
  }
}

export async function askOllamaWithSystem(
  prompt: string,
  system?: string,
  opts: Omit<OllamaChatOptions, "system"> = {}
): Promise<string> {
  const messages: OllamaMessage[] = [];
  if (system) messages.push({ role: "system", content: system });
  messages.push({ role: "user", content: prompt });
  return askOllama(messages, opts);
}
