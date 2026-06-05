import type { ToolDefinition, ToolResult } from "../types";

export function createHipsterTools(): Map<string, ToolDefinition> {
  const tools = new Map<string, ToolDefinition>();

  tools.set("search_trends", {
    name: "search_trends",
    description: "Cari tren terkini di industri barbershop, grooming, dan fashion pria.",
    parameters: {
      type: "object",
      properties: { keyword: { type: "string", description: "Topik yang ingin ditelusuri" } },
      required: ["keyword"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const q = encodeURIComponent(String(params.keyword) + " barbershop trend");
        const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json&skip_disambig=1`);
        const data = await res.json();
        return { success: true, data: data.RelatedTopics?.slice(0, 5) || data.AbstractText || "No results" };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("read_feedback", {
    name: "read_feedback",
    description: "Ambil feedback pelanggan terbaru untuk dianalisis sentimen dan topik.",
    parameters: {
      type: "object",
      properties: {
        limit: { type: "number", description: "Jumlah feedback yang diambil (default 10)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient();
        const limit = (params.limit as number) || 10;
        const { data, error } = await supabase
          .from("feedback")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(limit);
        if (error) return { success: false, error: error.message };
        return { success: true, data };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
