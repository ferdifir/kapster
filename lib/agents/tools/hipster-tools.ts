import type { ToolDefinition, ToolResult } from "../types";
import { sendTextMessage } from "@/lib/wuzapi";

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

  tools.set("send_whatsapp", {
    name: "send_whatsapp",
    description: "Kirim pesan WhatsApp ke nomor tertentu. Gunakan untuk customer engagement, follow-up, atau notifikasi.",
    parameters: {
      type: "object",
      properties: {
        phone: { type: "string", description: "Nomor tujuan (format internasional, tanpa +)" },
        message: { type: "string", description: "Isi pesan" },
      },
      required: ["phone", "message"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const token = process.env.SYSTEM_WUZAPI_TOKEN || "";
        const phone = String(params.phone);
        const message = String(params.message);
        const result = await sendTextMessage(token, phone, message);
        if (result.success) {
          return { success: true, data: { message_id: result.messageId } };
        }
        return { success: false, error: "Failed to send WhatsApp message" };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("edit_template", {
    name: "edit_template",
    description: "Edit template pesan WhatsApp untuk event tertentu. Template dipake buat notifikasi otomatis ke customer.",
    parameters: {
      type: "object",
      properties: {
        event_type: {
          type: "string",
          enum: ["join_queue", "queue_called", "queue_serving", "queue_done", "queue_number_update", "booking_confirmed", "booking_reminder", "registration_otp", "password_reset_otp"],
          description: "Jenis event template yang diedit",
        },
        template_text: { type: "string", description: "Teks template baru. Pake {variable} untuk dynamic content." },
      },
      required: ["event_type", "template_text"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { createAdminClient } = await import("@/lib/supabase/admin");
        const supabase = createAdminClient() as unknown as {
          from: (t: string) => { upsert: (v: Record<string, unknown>) => Promise<{ error: { message: string } | null }> }
        };
        const { error } = await supabase
          .from("wa_templates")
          .upsert({
            event_type: String(params.event_type),
            template_text: String(params.template_text),
            updated_at: new Date().toISOString(),
          });
        if (error) return { success: false, error: error.message };
        return { success: true, data: { message: `Template '${params.event_type}' updated` } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("generate_content", {
    name: "generate_content",
    description: "Generate konten untuk blog atau social media. Men spawn script generate yang sudah ada.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["blog", "social"], description: "Jenis konten" },
        topic: { type: "string", description: "Topik konten (opsional)" },
        platform: { type: "string", description: "Platform untuk social media: ig/instagram/tiktok (opsional)" },
      },
      required: ["type"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { exec } = await import("child_process");
        const { promisify } = await import("util");
        const execAsync = promisify(exec);

        if (params.type === "blog") {
          const topic = params.topic ? `--topic="${String(params.topic)}"` : "";
          const { stdout, stderr } = await execAsync(
            `cd ${process.cwd()} && npx tsx scripts/generate-blog-post.ts ${topic}`,
            { timeout: 120000 }
          );
          return { success: true, data: { output: (stdout + stderr).slice(0, 2000) } };
        }

        if (params.type === "social") {
          const platform = params.platform === "ig" || params.platform === "instagram" ? "instagram" : "tiktok";
          const topic = params.topic ? `--topic="${String(params.topic)}"` : "";
          const { stdout, stderr } = await execAsync(
            `cd ${process.cwd()} && npx tsx scripts/generate-social-content.ts --platform=${platform} ${topic}`,
            { timeout: 120000 }
          );
          return { success: true, data: { output: (stdout + stderr).slice(0, 2000) } };
        }

        return { success: false, error: "Unknown content type" };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("check_brand_consistency", {
    name: "check_brand_consistency",
    description: "Analisis brand consistency dari teks. Cek tone-of-voice, penggunaan bahasa Indonesia-Inggris, dan konsistensi brand kapster.",
    parameters: {
      type: "object",
      properties: {
        text: { type: "string", description: "Teks yang ingin dicek" },
        context: { type: "string", description: "Konteks penggunaan (blog/social/wa/email)" },
      },
      required: ["text"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const { askGroq } = await import("@/lib/groq");
        const result = await askGroq(
          `Analyze this text for brand consistency with kapster (barbershop queue management platform):
           - Tone: casual yet professional, mix Indonesian and English, friendly
           - Target: Indonesian barbershop owners and customers
           - Brand values: modern, practical, tech-savvy

           Text to analyze: "${String(params.text).slice(0, 2000)}"
           Context: ${(params.context as string) || "general"}

           Rate (1-10) and give brief feedback:`
        );
        return { success: true, data: { analysis: result } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
