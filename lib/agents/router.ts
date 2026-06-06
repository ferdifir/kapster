import type { AgentRole, EventType, AgentEvent } from "./types";

const ROUTE_RULES: Partial<Record<EventType, AgentRole>> = {
  system_error: "hacker",
  complaint: "hipster",
  feedback: "hipster",
  queue_event: "hustler",
  signup: "hustler",
  retrospective: "hacker",
  code_change: "hacker",
};

export function routeEvent(event: AgentEvent): AgentRole | null {
  if (event.target_agent) return event.target_agent;

  if (event.event_type === "scheduled") {
    return (event.payload?.target_role as AgentRole) || null;
  }



  const rule = ROUTE_RULES[event.event_type];
  if (rule) return rule;

  if (event.event_type === "telegram_cmd") {
    const text = (event.payload?.text as string) || "";
    if (text.startsWith("@hacker")) return "hacker";
    if (text.startsWith("@hipster")) return "hipster";
    if (text.startsWith("@hustler")) return "hustler";
    return classifyByContent(text);
  }

  if (event.event_type === "wa_message") {
    return classifyWaMessage(event);
  }

  return null;
}

function classifyByContent(text: string): AgentRole | null {
  const lower = text.toLowerCase();
  if (/error|bug|deploy|server|db|database|fail|crashed|down|performance/i.test(lower)) return "hacker";
  if (/desain|design|ui|ux|brand|warna|font|feedback|complain|look|feel/i.test(lower)) return "hipster";
  if (/revenue|sales|customer|marketing|promo|growth|lead|referral|bisnis/i.test(lower)) return "hustler";
  return null;
}

function classifyWaMessage(event: AgentEvent): AgentRole {
  const text = ((event.payload?.text as string) || "").toLowerCase();
  if (/complain|jelek|buruk|kecewa|error|bug|ga bisa/i.test(text)) return "hipster";
  if (/daftar|join|booking|harga|promo|info/i.test(text)) return "hustler";
  return "hustler";
}
