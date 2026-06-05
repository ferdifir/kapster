import type { ToolDefinition, ToolResult } from "../types";

export function createHustlerTools(): Map<string, ToolDefinition> {
  const tools = new Map<string, ToolDefinition>();

  tools.set("get_analytics", {
    name: "get_analytics",
    description: "Ambil data analytics barbershop dari 30 hari terakhir.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["today", "week", "month"], description: "Periode" },
      },
      required: ["period"],
    },
    handler: async (_params): Promise<ToolResult> => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const { data, error } = await supabase
          .from("analytics_daily")
          .select("*")
          .order("date", { ascending: false })
          .limit(30);
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("get_queue_stats", {
    name: "get_queue_stats",
    description: "Ambil statistik antrian: total customer, rata-rata per hari dalam periode tertentu.",
    parameters: {
      type: "object",
      properties: {
        days: { type: "number", description: "Jumlah hari ke belakang (default 30)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const days = (params.days as number) || 30;
        const since = new Date(Date.now() - days * 86400000).toISOString();
        const { data, error, count } = await supabase
          .from("queue_entries")
          .select("id", { count: "exact", head: true })
          .gte("created_at", since);
        if (error) return { success: false, error: error.message };
        return { success: true, data: { total_customers: count || 0, period_days: days } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
