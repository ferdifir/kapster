import { Ollama } from "ollama";
import { logError } from "@/lib/error-logger";

const OLLAMA_API_KEY = process.env.OLLAMA_API_KEY;
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || "devstral-2:123b";

let client: Ollama | null = null;

function getClient(): Ollama {
  if (!client) {
    if (!OLLAMA_API_KEY) throw new Error("OLLAMA_API_KEY is not set");
    client = new Ollama({
      host: "https://ollama.com",
      headers: { Authorization: "Bearer " + OLLAMA_API_KEY },
    });
  }
  return client;
}

export interface OllamaChatOptions {
  system?: string;
  temperature?: number;
  max_tokens?: number;
  model?: string;
  stream?: boolean;
}

export type OllamaMessage = { role: "user" | "assistant" | "system"; content: string };

export async function askOllama(
  messages: OllamaMessage[],
  opts: OllamaChatOptions = {}
): Promise<string> {
  const client = getClient();
  const model = opts.model || DEFAULT_MODEL;

  try {
    const response = await client.chat({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      options: {
        temperature: opts.temperature ?? 0.7,
        ...(opts.max_tokens ? { num_predict: opts.max_tokens } : {}),
      },
    });

    return response.message.content;
  } catch (err) {
    logError("askOllama", err, { model, messageCount: messages.length });
    throw err;
  }
}

export type ToolCall = {
  function: { name: string; arguments: string };
};

export async function askOllamaWithTools(
  messages: OllamaMessage[],
  tools: any[],
  opts: OllamaChatOptions = {}
): Promise<{
  content: string | null;
  toolCalls: ToolCall[];
}> {
  const client = getClient();
  const model = opts.model || DEFAULT_MODEL;

  try {
    const response = await client.chat({
      model,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools,
      options: {
        temperature: opts.temperature ?? 0.7,
        ...(opts.max_tokens ? { num_predict: opts.max_tokens } : {}),
      },
    });

    return {
      content: response.message.content,
      toolCalls: (response.message.tool_calls || []) as unknown as ToolCall[],
    };
  } catch (err) {
    logError("askOllamaWithTools", err, { model, messageCount: messages.length });
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
