import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/error-logger";
import { sendTelegramMessage } from "@/lib/telegram";
import { routeEvent } from "@/lib/agents/router";
import type { AgentEvent, AgentRole } from "@/lib/agents/types";

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 5;

let running = true;

process.on("SIGTERM", () => { running = false; });
process.on("SIGINT", () => { running = false; });

function agentEvents(supabase: ReturnType<typeof createAdminClient>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (supabase as any).from("agent_events");
}

async function poll(): Promise<void> {
  const supabase = createAdminClient();

  const { data: events, error } = await agentEvents(supabase)
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logError("agent-worker:poll", new Error(error.message));
    return;
  }

  for (const event of (events || []) as AgentEvent[]) {
    await processEvent(supabase, event);
  }
}

async function processEvent(
  supabase: ReturnType<typeof createAdminClient>,
  event: AgentEvent
): Promise<void> {
  const startTime = Date.now();
  const targetAgent = event.target_agent || routeEvent(event);

  await agentEvents(supabase).update({
    status: "processing",
    assigned_agent: targetAgent,
  }).eq("id", event.id);

  if (!targetAgent) {
    await agentEvents(supabase).update({
      status: "failed",
      error: "No agent could route this event",
      processed_at: new Date().toISOString(),
    }).eq("id", event.id);
    return;
  }

  try {
    const { getAgent } = await import("@/lib/agents/base-agent");
    const agent = getAgent(targetAgent as AgentRole);
    const decision = await agent.processEvent(event);

    const elapsed = Date.now() - startTime;

    if (decision.needs_approval) {
      const { sendTelegramInlineKeyboard } = await import("@/lib/telegram");
      await sendTelegramInlineKeyboard(
        `🤖 <b>${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)} Agent</b> — ⚠️ Butuh Keputusan\n\n${decision.report_message || decision.reasoning}`,
        [[
          { text: "✅ Setuju", callback_data: `agent_approve:event_id:${event.id}` },
          { text: "❌ Tolak", callback_data: `agent_reject:event_id:${event.id}` },
        ]],
        "HTML"
      );
    } else {
      await sendTelegramMessage(
        `┌─ ${targetAgent.charAt(0).toUpperCase() + targetAgent.slice(1)} Agent — ⏱ ${(elapsed / 1000).toFixed(1)}s\n` +
        `├ Event: ${event.event_type} · Priority ${event.priority}\n` +
        `├ ${decision.report_message || decision.reasoning}\n` +
        `└ Status: processed`,
        undefined,
        "HTML"
      );
    }

    await agentEvents(supabase).update({
      status: "processed",
      decision: decision as Record<string, unknown>,
      notes: decision.reasoning,
      processed_at: new Date().toISOString(),
      report_sent: true,
    }).eq("id", event.id);

  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logError("agent-worker:process", err instanceof Error ? err : new Error(String(err)), { eventId: event.id });

    await agentEvents(supabase).update({
      status: "failed",
      error: errorMsg,
      processed_at: new Date().toISOString(),
    }).eq("id", event.id);

    await sendTelegramMessage(
      `⚠️ <b>Agent Worker</b>\n├ Event: ${event.event_type} (${event.id.slice(0, 8)})\n├ Error: ${errorMsg}\n└ Status: failed`,
      undefined,
      "HTML"
    );
  }
}

async function main() {
  while (running) {
    try {
      await poll();
    } catch (err) {
      logError("agent-worker", err instanceof Error ? err : new Error(String(err)));
    }
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
  }
}

main().catch((err) => {
  logError("agent-worker:fatal", err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
});
