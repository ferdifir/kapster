import { logError } from "@/lib/error-logger";
import type { AgentRole } from "./types";

type LLMMessage = { role: "system" | "user" | "assistant" | "tool"; content: string; tool_call_id?: string };
type ToolDef = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };

function getModelConfig(role: AgentRole) {
  switch (role) {
    case "hacker":
      return {
        provider: "openrouter" as const,
        model: "deepseek/deepseek-v4-flash:free",
        temperature: 0.2,
        maxTokens: 4096,
      };
    case "hipster":
      return {
        provider: "groq" as const,
        model: "qwen/qwen3-32b",
        temperature: 0.8,
        maxTokens: 4096,
      };
    case "hustler":
      return {
        provider: "groq" as const,
        model: "llama-3.3-70b-versatile",
        temperature: 0.5,
        maxTokens: 2048,
      };
  }
}

async function callGroq(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDef[]
): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (tools && tools.length > 0) body.tools = tools;

  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Groq error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function callOpenRouter(
  messages: LLMMessage[],
  model: string,
  temperature: number,
  maxTokens: number,
  tools?: ToolDef[]
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error("OPENROUTER_API_KEY not set");

  const body: Record<string, unknown> = {
    model,
    messages,
    temperature,
    max_tokens: maxTokens,
  };
  if (tools && tools.length > 0) body.tools = tools;

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`OpenRouter error ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

export async function askAgent(
  role: AgentRole,
  messages: LLMMessage[],
  tools?: ToolDef[]
): Promise<string> {
  const config = getModelConfig(role);
  try {
    if (config.provider === "groq") {
      return await callGroq(messages, config.model, config.temperature, config.maxTokens, tools);
    }
    return await callOpenRouter(messages, config.model, config.temperature, config.maxTokens, tools);
  } catch (err) {
    logError(`askAgent:${role}`, err instanceof Error ? err : new Error(String(err)));
    // Fallback: try provider alternatif
    if (config.provider === "groq") {
      return await callOpenRouter(messages, "deepseek/deepseek-v4-flash:free", config.temperature, config.maxTokens, tools);
    }
    throw err;
  }
}
