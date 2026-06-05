import { logError } from "@/lib/error-logger";
import type { AgentRole } from "./types";

type LLMMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };
type ToolDef = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };

type ModelConfig = {
  provider: "groq" | "openrouter";
  model: string;
  temperature: number;
  maxTokens: number;
};

type FallbackConfig = {
  provider: "groq" | "openrouter";
  model: string;
};

const MODEL_CONFIGS: Record<AgentRole, ModelConfig> = {
  hacker: { provider: "openrouter", model: "deepseek/deepseek-v4-flash:free", temperature: 0.2, maxTokens: 4096 },
  hipster: { provider: "groq", model: "qwen/qwen3-32b", temperature: 0.8, maxTokens: 4096 },
  hustler: { provider: "groq", model: "llama-3.3-70b-versatile", temperature: 0.5, maxTokens: 2048 },
};

const FALLBACK_CONFIGS: Record<AgentRole, FallbackConfig> = {
  hacker: { provider: "openrouter", model: "meta-llama/llama-3.3-70b-instruct:free" },
  hipster: { provider: "openrouter", model: "deepseek/deepseek-v4-flash:free" },
  hustler: { provider: "openrouter", model: "deepseek/deepseek-v4-flash:free" },
};

async function doFetch(
  url: string,
  apiKey: string,
  body: Record<string, unknown>,
  timeoutMs: number
): Promise<{ content: string; toolCalls: boolean }> {
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const msg = data.choices?.[0]?.message;
  if (msg?.tool_calls) {
    return { content: JSON.stringify(msg.tool_calls), toolCalls: true };
  }
  return { content: msg?.content ?? "", toolCalls: false };
}

async function callGroq(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDef[]
): Promise<{ content: string; toolCalls: boolean }> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const body: Record<string, unknown> = { model, messages, temperature, max_tokens: maxTokens };
  if (tools && tools.length > 0) body.tools = tools;

  return doFetch("https://api.groq.com/openai/v1/chat/completions", apiKey, body, 30000);
}

async function callOpenRouter(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDef[]
): Promise<{ content: string; toolCalls: boolean }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const body: Record<string, unknown> = { model, messages, temperature, max_tokens: maxTokens };
  if (tools && tools.length > 0) body.tools = tools;

  return doFetch("https://openrouter.ai/api/v1/chat/completions", apiKey, body, 60000);
}

type ProviderFn = (
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDef[]
) => Promise<{ content: string; toolCalls: boolean }>;

const PROVIDERS: Record<string, ProviderFn> = {
  groq: callGroq,
  openrouter: callOpenRouter,
};

export async function askAgent(
  role: AgentRole,
  messages: LLMMessage[],
  tools?: ToolDef[]
): Promise<string> {
  const config = MODEL_CONFIGS[role];
  const fallback = FALLBACK_CONFIGS[role];

  for (const attempt of [config, fallback]) {
    try {
      const fn = PROVIDERS[attempt.provider];
      const result = await fn(messages, attempt.model, config.temperature, config.maxTokens, tools);
      if (result.toolCalls) return result.content;
      if (result.content) return result.content;
    } catch (err) {
      logError(`askAgent:${role}`, err instanceof Error ? err : new Error(String(err)));
    }
  }

  throw new Error(`All LLM providers failed for role: ${role}`);
}
