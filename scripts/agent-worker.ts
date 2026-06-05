import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/error-logger";
import { sendTelegramMessage, sendTelegramInlineKeyboard } from "@/lib/telegram";
import { routeEvent } from "@/lib/agents/router";
import { getAgent, registerAgent } from "@/lib/agents/base-agent";
import { HackerAgent } from "@/lib/agents/hacker-agent";
import { HipsterAgent } from "@/lib/agents/hipster-agent";
import { HustlerAgent } from "@/lib/agents/hustler-agent";
import type { AgentEvent, AgentRole } from "@/lib/agents/types";
import { runRetrospective } from "@/lib/agents/self-improve";

const POLL_INTERVAL_MS = 5000;
const BATCH_SIZE = 5;

let running = true;
let abortController = new AbortController();

process.on("SIGTERM", () => { running = false; abortController.abort(); });
process.on("SIGINT", () => { running = false; abortController.abort(); });

function agentEvents(supabase: ReturnType<typeof createAdminClient>) {
  return (supabase as unknown as { from: (t: string) => ReturnType<typeof supabase.from> }).from("agent_events");
}

async function poll(supabase: ReturnType<typeof createAdminClient>): Promise<void> {
  const { data: events, error } = await agentEvents(supabase)
    .select("*")
    .eq("status", "pending")
    .order("priority", { ascending: true })
    .order("created_at", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    logError("agent-worker:poll", new Error(error.message)).catch(() => {});
    return;
  }

  for (const event of (events || []) as AgentEvent[]) {
    if (!running) break;
    await processEvent(supabase, event);
  }
}

const EVENT_TIMEOUT_MS = 300000; // 5 minutes

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
    const agent = getAgent(targetAgent as AgentRole);
    const decision = await Promise.race([
      agent.processEvent(event),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("Event processing timed out after 5 minutes")), EVENT_TIMEOUT_MS)
      ),
    ]);

    const elapsed = Date.now() - startTime;

    if (decision.needs_approval) {
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
    logError("agent-worker:process", err instanceof Error ? err : new Error(String(err)), { eventId: event.id }).catch(() => {});

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
  // Register agents (each loads its own tools internally)
  registerAgent("hacker", new HackerAgent());
  registerAgent("hipster", new HipsterAgent());
  registerAgent("hustler", new HustlerAgent());

  const supabase = createAdminClient();
  let lastRetrospective = Date.now();
  const RETROSPECTIVE_INTERVAL = 7 * 86400000; // 1 week

  while (running && !abortController.signal.aborted) {
    try {
      await poll(supabase);
      if (Date.now() - lastRetrospective > RETROSPECTIVE_INTERVAL) {
        await runRetrospective();
        lastRetrospective = Date.now();
      }
    } catch (err) {
      if (!running || abortController.signal.aborted) break;
      logError("agent-worker", err instanceof Error ? err : new Error(String(err))).catch(() => {});
    }
    if (running && !abortController.signal.aborted) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }
  }
}

main().catch((err) => {
  logError("agent-worker:fatal", err instanceof Error ? err : new Error(String(err)));
  process.exit(1);
});
