import type { ToolDefinition, ToolResult, AgentRole } from "../types";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramInlineKeyboard } from "@/lib/telegram";

type SupabaseAny = ReturnType<typeof createAdminClient> & {
  from: (t: string) => {
    insert: (v: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
    select: (c?: string) => {
      eq: (c: string, v: string) => {
        order: (c: string, d: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>
      }
    };
    update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> };
  };
};

function s(): SupabaseAny {
  return createAdminClient() as unknown as SupabaseAny;
}

export function createPlanTools(): Map<string, ToolDefinition> {
  const tools = new Map<string, ToolDefinition>();

  tools.set("create_plan", {
    name: "create_plan",
    description: "Buat rencana/plan jangka panjang baru. Plan langsung aktif setelah dibuat. Setiap step butuh approval Ferdi dulu sebelum dieksekusi.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Judul singkat plan, misal: 'Tambah 20% barbershop bulan ini'" },
        description: { type: "string", description: "Penjelasan detail plan" },
        current_value: { type: "number", description: "Nilai KPI saat ini (opsional)" },
        target_value: { type: "number", description: "Target KPI (opsional)" },
        deadline: { type: "string", description: "Deadline target, format YYYY-MM-DD (opsional)" },
      },
      required: ["title"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const metrics: Record<string, unknown> = {};
        if (params.current_value !== undefined) metrics.current = params.current_value;
        if (params.target_value !== undefined) metrics.target = params.target_value;
        if (params.deadline) metrics.deadline = params.deadline;

        const { data, error } = await s().from("agent_plans").insert({
          agent_role: String(params._agent_role || "hustler"),
          title: String(params.title),
          description: params.description ? String(params.description) : null,
          metrics: Object.keys(metrics).length > 0 ? metrics : {},
        } as Record<string, unknown>).select().single();

        if (error) return { success: false, error: error.message };
        return { success: true, data: { plan_id: data?.id } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("get_plans", {
    name: "get_plans",
    description: "Lihat daftar plan yang aktif atau semua plan. Menampilkan plan beserta step-stepnya.",
    parameters: {
      type: "object",
      properties: {
        status: { type: "string", enum: ["active", "all"], description: "Filter status plan. 'active' untuk plan yang belum selesai, 'all' untuk semua." },
      },
      required: ["status"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const anyDB = s() as unknown as { from: (t: string) => { select: (c?: string) => { eq: (c: string, v: string) => { order: (c: string, d: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> } } } };
        let query: { order: (c: string, d: { ascending: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> };
        if (params.status === "active") {
          query = anyDB.from("agent_plans").select("*").eq("status", "active");
        } else {
          query = anyDB.from("agent_plans").select("*") as unknown as typeof query;
        }
        const { data: plans, error } = await query.order("created_at", { ascending: false });

        if (error) return { success: false, error: error.message };

        const result = await Promise.all((plans || []).map(async (plan: Record<string, unknown>) => {
          const { data: steps } = await s().from("agent_plan_steps")
            .select("*")
            .eq("plan_id", String(plan.id))
            .order("step_order", { ascending: true });
          return { ...plan, steps: steps || [] };
        }));

        return { success: true, data: result };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("propose_plan_step", {
    name: "propose_plan_step",
    description: "Tambahkan step baru ke plan. Step akan dibuat dengan status 'awaiting_approval' dan dikirim ke Ferdi untuk disetujui via Telegram. Tunggu feedback Ferdi sebelum lanjut.",
    parameters: {
      type: "object",
      properties: {
        plan_id: { type: "string", description: "ID plan yang sudah dibuat via create_plan" },
        title: { type: "string", description: "Judul singkat step" },
        description: { type: "string", description: "Penjelasan apa yang akan dilakukan dan mengapa" },
        action_type: { type: "string", enum: ["tool_call", "ask_ferdi"], description: "Jenis action yang akan dieksekusi setelah disetujui" },
        tool_name: { type: "string", description: "Nama tool yang akan dipanggil (jika action_type='tool_call')" },
        tool_params: { type: "object", description: "Parameter untuk tool (jika action_type='tool_call')" },
        ask_ferdi_instructions: { type: "string", description: "Instruksi untuk Ferdi (jika action_type='ask_ferdi')" },
      },
      required: ["plan_id", "title", "description"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const actionConfig: Record<string, unknown> = {};
        if (params.tool_name) actionConfig.tool = params.tool_name;
        if (params.tool_params) actionConfig.params = params.tool_params;
        if (params.ask_ferdi_instructions) actionConfig.instructions = params.ask_ferdi_instructions;

        const { data: step, error } = await s().from("agent_plan_steps").insert({
          plan_id: String(params.plan_id),
          title: String(params.title),
          description: params.description ? String(params.description) : null,
          status: "awaiting_approval",
          action_type: String(params.action_type || "tool_call"),
          action_config: actionConfig,
        } as Record<string, unknown>).select().single();

        if (error || !step) return { success: false, error: error?.message || "Failed to create step" };

        const planLabel = String(params.title);
        const stepLabel = String(params.title);
        const msgId = await sendTelegramInlineKeyboard(
          `📋 <b>Plan: ${planLabel}</b>\n\nStep: ${stepLabel}\n\n${params.description || ""}\n\n<i>Setujui step ini untuk dieksekusi?</i>`,
          [[
            { text: "✅ Setuju", callback_data: `plan_approve:step_id:${step.id}:plan_id:${params.plan_id}` },
            { text: "❌ Tolak", callback_data: `plan_reject:step_id:${step.id}:plan_id:${params.plan_id}` },
          ]],
          "HTML"
        );

        return { success: true, data: { step_id: step.id, telegram_message_id: msgId } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("update_plan_step", {
    name: "update_plan_step",
    description: "Update status step dari plan. Gunakan setelah step selesai dieksekusi untuk mark sebagai 'completed', atau ubah ke 'in_progress' saat mulai eksekusi.",
    parameters: {
      type: "object",
      properties: {
        step_id: { type: "string", description: "ID step yang ingin diupdate" },
        status: { type: "string", enum: ["in_progress", "completed", "skipped"], description: "Status baru step" },
        result: { type: "object", description: "Hasil eksekusi step (opsional)" },
      },
      required: ["step_id", "status"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const updateData: Record<string, unknown> = { status: String(params.status) };
        if (params.status === "completed") updateData.completed_at = new Date().toISOString();
        if (params.result) updateData.result = params.result;
        const { error } = await s().from("agent_plan_steps").update(updateData).eq("id", String(params.step_id));
        if (error) return { success: false, error: error.message };
        return { success: true, data: { message: `Step ${params.status}` } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("update_plan", {
    name: "update_plan",
    description: "Update status atau metrics dari plan. Gunakan untuk mark plan sebagai 'completed' atau update progres KPI.",
    parameters: {
      type: "object",
      properties: {
        plan_id: { type: "string", description: "ID plan" },
        status: { type: "string", enum: ["active", "paused", "completed", "cancelled"], description: "Status baru plan" },
        current_value: { type: "number", description: "Nilai KPI terkini (opsional)" },
      },
      required: ["plan_id"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const updateData: Record<string, unknown> = { updated_at: new Date().toISOString() };
        if (params.status) {
          updateData.status = String(params.status);
          if (params.status === "completed") updateData.completed_at = new Date().toISOString();
        }
        if (params.current_value !== undefined) {
          const fetchDB = s() as unknown as { from: (t: string) => { select: (c: string) => { eq: (c: string, v: string) => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } };
          const anyDB = s() as unknown as { from: (t: string) => { update: (v: Record<string, unknown>) => { eq: (c: string, v: string) => Promise<{ error: { message: string } | null }> } } };
          const { data: plan } = await fetchDB.from("agent_plans").select("metrics").eq("id", String(params.plan_id));
          const metrics = ((plan || {}) as Record<string, unknown>).metrics || {};
          (metrics as Record<string, unknown>).current = params.current_value;
          updateData.metrics = metrics;
          const { error } = await anyDB.from("agent_plans").update(updateData).eq("id", String(params.plan_id));
          if (error) return { success: false, error: error.message };
        } else {
          const { error } = await s().from("agent_plans").update(updateData).eq("id", String(params.plan_id));
          if (error) return { success: false, error: error.message };
        }
        return { success: true, data: { message: `Plan updated${params.status ? ` to ${params.status}` : ""}` } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
