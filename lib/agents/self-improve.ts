import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramMessage } from "@/lib/telegram";
import { logError } from "@/lib/error-logger";

export async function runRetrospective(): Promise<void> {
  const supabase = createAdminClient();
  const agentEvents = supabase as unknown as { from: (t: string) => { select: (columns?: string) => { gte: (col: string, val: string) => { neq: (col: string, val: string) => { order: (col: string, dir: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> } } } } };
  const startDate = new Date(Date.now() - 7 * 86400000).toISOString();

  const { data: events, error } = await agentEvents
    .from("agent_events")
    .select("*")
    .gte("created_at", startDate)
    .neq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    logError("retrospective", new Error(error.message));
    return;
  }

  const allEvents = (events || []) as Record<string, unknown>[];
  const total = allEvents.length;
  const failed = allEvents.filter((e) => e.status === "failed").length;
  const processed = allEvents.filter((e) => e.status === "processed").length;

  const errorCounts = new Map<string, number>();
  for (const e of allEvents.filter((e) => e.status === "failed")) {
    const key = String(e.error || "unknown");
    errorCounts.set(key, (errorCounts.get(key) || 0) + 1);
  }
  const topErrors = [...errorCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([err, count]) => `• ${err} (${count}x)`);

  await sendTelegramMessage(
    `📊 <b>Agent Retrospective — Mingguan</b>\n\n` +
    `Period: ${new Date(startDate).toLocaleDateString("id-ID")} - ${new Date().toLocaleDateString("id-ID")}\n` +
    `Total events: ${total}\n` +
    `✅ Processed: ${processed}\n` +
    `❌ Failed: ${failed}\n\n` +
    (topErrors.length > 0 ? `<b>Top errors:</b>\n${topErrors.join("\n")}` : "No errors this week 🎉"),
    undefined,
    "HTML"
  );
}
