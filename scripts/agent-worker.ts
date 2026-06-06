import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/error-logger";
import { sendTelegramMessage, sendTelegramInlineKeyboard } from "@/lib/telegram";
import { routeEvent } from "@/lib/agents/router";
import { getAgent, registerAgent } from "@/lib/agents/base-agent";
import { HackerAgent } from "@/lib/agents/hacker-agent";
import { HipsterAgent } from "@/lib/agents/hipster-agent";
import { HustlerAgent } from "@/lib/agents/hustler-agent";
import type { AgentEvent, AgentRole, AgentDecision } from "@/lib/agents/types";
import { runRetrospective } from "@/lib/agents/self-improve";

const STADUP_ORDER: AgentRole[] = ["hustler", "hipster", "hacker"];

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

    if (event.event_type === "daily_standup" && targetAgent) {
      await chainStandup(supabase, event, targetAgent as AgentRole, decision);
    }

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

const STANDUP_NEXT: Record<AgentRole, AgentRole | null> = {
  hustler: "hipster",
  hipster: "hacker",
  hacker: null,
};

async function chainStandup(
  supabase: ReturnType<typeof createAdminClient>,
  event: AgentEvent,
  agent: AgentRole,
  decision: AgentDecision
): Promise<void> {
  const meetingId = event.payload?.meeting_id as string;
  if (!meetingId) return;

  const transcript = (event.payload?.transcript as Array<{ agent: string; statement: string; timestamp: string }>) || [];
  const statement = decision.report_message || decision.reasoning || "(no statement)";
  transcript.push({ agent, statement, timestamp: new Date().toISOString() });

  const nextAgent = STANDUP_NEXT[agent];
  if (nextAgent) {
    await agentEvents(supabase).insert({
      event_type: "daily_standup",
      source: "agent",
      target_agent: nextAgent,
      payload: { meeting_id: meetingId, round: transcript.length + 1, transcript },
      priority: 1,
    } as Record<string, unknown>);
  } else {
    const lines = transcript.map(
      (t) => `🎙 <b>${t.agent.charAt(0).toUpperCase() + t.agent.slice(1)}</b>\n${t.statement}`
    );
    await sendTelegramMessage(
      `☀️ <b>Daily Standup — Selesai</b>\n\n${lines.join("\n\n─────────────\n\n")}`,
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
