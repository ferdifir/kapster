"use server";

import { createClient } from "@/lib/supabase/server";
import type { TablesUpdate } from "@/lib/supabase/types";

export async function setBarberEntryStatus(
  entryId: string,
  status: "called" | "serving" | "done" | "skip",
  queueId?: string
) {
  const supabase = await createClient();

  const now = new Date().toISOString();
  const updates: TablesUpdate<"queue_entries"> = { status };
  if (status === "called") updates.called_at = now;
  if (status === "serving") updates.serving_at = now;
  if (status === "done" || status === "skip") updates.done_at = now;

  const { error } = await supabase
    .from("queue_entries")
    .update(updates)
    .eq("id", entryId);

  if (error) return { error: error.message };

  if (status === "done" && queueId) {
    await supabase.rpc("increment_queue_served", { p_queue_id: queueId });
  }

  return {};
}
