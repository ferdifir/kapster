import { createAdminClient } from "@/lib/supabase/admin";
import type { EventType, EventSource } from "./agents/types";

export async function insertAgentEvent(
  eventType: EventType,
  source: EventSource,
  payload: Record<string, unknown>,
  priority?: number,
  targetAgent?: string
): Promise<string | null> {
  try {
    const supabase = createAdminClient();
    const agentEvents = supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } } } };
    const { data, error } = await agentEvents.from("agent_events").insert({
      event_type: eventType,
      source,
      payload,
      priority: priority ?? 3,
      target_agent: targetAgent || null,
    } as Record<string, unknown>).select().single();

    if (error) {
      console.error("[events] insert error:", error.message);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[events] insert error:", err);
    return null;
  }
}
