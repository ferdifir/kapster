import type { ToolDefinition, ToolResult } from "../types";
import { sendTelegramInlineKeyboard, sendTelegramMessage } from "@/lib/telegram";
import { modifyCodeTool } from "./modify-code";

export function createSharedTools(): Map<string, ToolDefinition> {
  const tools = new Map<string, ToolDefinition>();

  tools.set("search_web", {
    name: "search_web",
    description: "Cari informasi terbaru dari internet. Gunakan untuk riset tren, berita, atau referensi.",
    parameters: {
      type: "object",
      properties: { query: { type: "string", description: "Kata kunci pencarian" } },
      required: ["query"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const q = encodeURIComponent(String(params.query));
        const res = await fetch(`https://api.duckduckgo.com/?q=${q}&format=json`);
        const data = await res.json();
        return { success: true, data: data.AbstractText || data.RelatedTopics?.slice(0, 5) || "No results" };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("request_ferdi_action", {
    name: "request_ferdi_action",
    description: "Minta investor (Ferdi) melakukan sesuatu yang tidak bisa dilakukan agent secara digital. Sertakan instruksi detail.",
    parameters: {
      type: "object",
      properties: {
        title: { type: "string", description: "Judul singkat permintaan" },
        instructions: { type: "string", description: "Langkah-langkah detail yang harus dilakukan Ferdi" },
        expected_response: { type: "string", description: "Format response yang diharapkan setelah selesai" },
      },
      required: ["title", "instructions", "expected_response"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const msgId = await sendTelegramInlineKeyboard(
          `🔑 <b>${params.title}</b>\n\n${params.instructions}\n\n<i>Expected response: ${params.expected_response}</i>`,
          [[{ text: "✅ Udah dikirim", callback_data: `ferdi_done:event_id:${Date.now().toString()}` }]],
          "HTML"
        );
        return { success: true, data: { telegram_message_id: msgId } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("send_telegram_report", {
    name: "send_telegram_report",
    description: "Kirim laporan atau pertanyaan ke Ferdi via Telegram. Bisa dengan inline buttons untuk minta keputusan.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Isi laporan" },
        buttons: {
          type: "array",
          items: {
            type: "object",
            properties: {
              row: { type: "number" },
              text: { type: "string" },
              callback_data: { type: "string" },
            },
          },
          description: "Tombol inline (opsional). callback_data format: 'agent_action:<action>:event_id:<id>'",
        },
      },
      required: ["message"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const buttons = (params.buttons as { row: number; text: string; callback_data: string }[]) || [];
        const keyboard = buttons.length > 0
          ? (() => {
              const groups = new Map<number, { text: string; callback_data: string }[]>();
              for (const b of buttons) {
                const row = b.row || 0;
                if (!groups.has(row)) groups.set(row, []);
                groups.get(row)!.push({ text: b.text, callback_data: b.callback_data });
              }
              return [...groups.values()];
            })()
          : undefined;
        const msgId = keyboard
          ? await sendTelegramInlineKeyboard(String(params.message), keyboard, "HTML")
          : await sendTelegramMessage(String(params.message), undefined, "HTML");
        return { success: true, data: { telegram_message_id: msgId } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("spawn_sub_agent", {
    name: "spawn_sub_agent",
    description: "Delegasi tugas ke sub-agent. Bisa berupa sub-event (insert event baru dengan target_agent tertentu) atau spawn child process untuk long-running task.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["sub_event", "child_process"], description: "Jenis sub-agent" },
        target: { type: "string", description: "Untuk sub_event: target_agent (hacker/hipster/hustler). Untuk child_process: script path" },
        task: { type: "string", description: "Deskripsi tugas" },
        payload: { type: "object", description: "Data tambahan untuk sub_event" },
      },
      required: ["type", "target", "task"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        if (params.type === "sub_event") {
          const { createAdminClient } = await import("@/lib/supabase/admin");
          const supabase = createAdminClient();
          const supabaseAny = supabase as unknown as { from: (t: string) => { insert: (v: Record<string, unknown>) => { select: () => { single: () => Promise<{ data: { id: string } | null; error: { message: string } | null }> } } } };
          const { data, error } = await supabaseAny.from("agent_events").insert({
            event_type: "tool_call",
            source: "agent",
            target_agent: params.target,
            payload: { task: params.task, parent_payload: params.payload || {} },
            priority: 3,
          } as Record<string, unknown>).select().single();
          if (error) return { success: false, error: error.message };
          return { success: true, data: { sub_event_id: data?.id } };
        } else {
          const { exec } = await import("child_process");
          const { promisify } = await import("util");
          const execAsync = promisify(exec);
          const { stdout, stderr } = await execAsync(
            `cd ${process.cwd()} && npx tsx ${String(params.target)}`,
            { timeout: 300000 }
          );
          return { success: true, data: { stdout: stdout.slice(0, 2000), stderr: stderr.slice(0, 2000) } };
        }
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("modify_code", modifyCodeTool);

  return tools;
}
