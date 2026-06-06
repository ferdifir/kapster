import type { ToolDefinition, ToolResult } from "../types";
import { sendTextMessage } from "@/lib/wuzapi";
import type { SupabaseClient } from "@supabase/supabase-js";

async function getAdminClient(): Promise<SupabaseClient> {
  const { createAdminClient } = await import("@/lib/supabase/admin");
  return createAdminClient();
}

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
        const supabase = await getAdminClient();
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
        const supabase = await getAdminClient();
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

  tools.set("send_wa_promo", {
    name: "send_wa_promo",
    description: "Kirim pesan promosi WhatsApp ke pelanggan. Bisa broadcast ke semua atau barbershop tertentu.",
    parameters: {
      type: "object",
      properties: {
        message: { type: "string", description: "Isi pesan promosi" },
        target: { type: "string", enum: ["all", "active"], description: "Target: 'all' semua pelanggan, 'active' yang aktif 30 hari terakhir" },
        barbershop_id: { type: "string", description: "Filter ke barbershop tertentu (opsional)" },
      },
      required: ["message", "target"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const supabase = await getAdminClient();
        const token = process.env.SYSTEM_WUZAPI_TOKEN || "";
        const anyDB = supabase as any;
        const { data: customers, error } = params.barbershop_id
          ? await anyDB.from("profiles").select("phone").not("phone", "is", null).eq("barbershop_id", String(params.barbershop_id))
          : await anyDB.from("profiles").select("phone").not("phone", "is", null);

        const phones = ((customers || []) as { phone: string }[])
          .map((c) => c.phone)
          .filter(Boolean)
          .slice(0, 50);

        const results: { phone: string; status: string }[] = [];
        for (const phone of phones) {
          try {
            const result = await sendTextMessage(token, phone, String(params.message));
            results.push({ phone, status: result.success ? "sent" : "failed" });
          } catch {
            results.push({ phone, status: "error" });
          }
        }

        return { success: true, data: { sent: results.filter((r) => r.status === "sent").length, total: phones.length, details: results } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("track_referrals", {
    name: "track_referrals",
    description: "Cek statistik program referral: total referral, komisi, dan barbershop top referrer.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["week", "month", "all"], description: "Periode (default month)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const supabase = await getAdminClient();
        const period = (params.period as string) || "month";
        const since = period === "all" ? undefined : new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000).toISOString();

        let query = supabase.from("referrals").select("*", { count: "exact", head: true });
        if (since) query = query.gte("created_at", since);
        const { count: total, error: countError } = await query;
        if (countError) return { success: false, error: countError.message };

        let commissionQuery = supabase.from("referral_commissions").select("amount", { count: "exact" });
        if (since) commissionQuery = commissionQuery.gte("created_at", since);
        const { data: commissions, error: commError } = await commissionQuery;
        if (commError) return { success: false, error: commError.message };

        const totalCommission = ((commissions || []) as { amount: number }[]).reduce((s, c) => s + (c.amount || 0), 0);

        const { data: topReferrers } = await supabase
          .from("referrals")
          .select("referred_by")
          .order("created_at", { ascending: false })
          .limit(10);

        return {
          success: true,
          data: {
            total_referrals: total || 0,
            total_commission: totalCommission,
            period: period,
            top_referrers: (topReferrers || []).slice(0, 5),
          },
        };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("get_customer_stats", {
    name: "get_customer_stats",
    description: "Ambil statistik customer: total registered, aktif, churn rate, dan rata-rata per barbershop.",
    parameters: {
      type: "object",
      properties: {
        period: { type: "string", enum: ["week", "month", "all"], description: "Periode (default month)" },
      },
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const supabase = await getAdminClient();
        const period = (params.period as string) || "month";
        const since = period === "all" ? undefined : new Date(Date.now() - (period === "week" ? 7 : 30) * 86400000).toISOString();

        let totalQuery = supabase.from("profiles").select("id", { count: "exact", head: true });
        if (since) totalQuery = totalQuery.gte("created_at", since);
        const { count: totalCustomers, error: totalError } = await totalQuery;
        if (totalError) return { success: false, error: totalError.message };

        let activeQuery = supabase.from("queue_entries").select("customer_id", { count: "exact", head: true });
        if (since) activeQuery = activeQuery.gte("created_at", since);
        const { count: activeCustomers, error: activeError } = await activeQuery;
        if (activeError) return { success: false, error: activeError.message };

        const { data: barbershopCount } = await supabase
          .from("barbershops")
          .select("id", { count: "exact", head: true });

        return {
          success: true,
          data: {
            total_customers: totalCustomers || 0,
            active_customers: activeCustomers || 0,
            engagement_rate: totalCustomers ? Math.round(((activeCustomers || 0) / totalCustomers) * 100) : 0,
            barbershops: (barbershopCount as unknown as { count: number })?.count || 0,
            period,
          },
        };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  tools.set("send_engagement", {
    name: "send_engagement",
    description: "Kirim pesan engagement ke pelanggan. Misal: reminder booking, follow-up after visit, atau special offer.",
    parameters: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["reminder", "followup", "offer"], description: "Jenis engagement" },
        message: { type: "string", description: "Isi pesan" },
        barbershop_id: { type: "string", description: "Filter ke barbershop tertentu (opsional)" },
      },
      required: ["type", "message"],
    },
    handler: async (params): Promise<ToolResult> => {
      try {
        const supabase = await getAdminClient();
        const token = process.env.SYSTEM_WUZAPI_TOKEN || "";
        const type = String(params.type);

        const anyDB = supabase as any;
        const { data: customers, error } = params.barbershop_id
          ? await anyDB.from("profiles").select("phone").not("phone", "is", null).limit(100).eq("barbershop_id", String(params.barbershop_id))
          : await anyDB.from("profiles").select("phone").not("phone", "is", null).limit(100);
        if (error) return { success: false, error: error.message };

        const phones = ((customers || []) as { phone: string }[])
          .map((c) => c.phone)
          .filter(Boolean)
          .slice(0, 30);

        let sent = 0;
        for (const phone of phones) {
          try {
            const result = await sendTextMessage(token, phone, String(params.message));
            if (result.success) sent++;
          } catch {
            // skip failed
          }
        }

        try {
          await anyDB.from("engagement_logs").insert({
            type,
            message: String(params.message),
            target_count: phones.length,
            sent_count: sent,
          });
        } catch {
          // Table may not exist yet, skip
        }

        return { success: true, data: { type, sent, total_target: phones.length } };
      } catch (err) {
        return { success: false, error: String(err) };
      }
    },
  });

  return tools;
}
