import { createClient } from "https://esm.sh/@supabase/supabase-js@2.105.4";

const WUZAPI_URL = Deno.env.get("WUZAPI_URL") || "https://wa.linkjo.my.id";
const SYSTEM_WUZAPI_TOKEN = Deno.env.get("SYSTEM_WUZAPI_TOKEN") || "";
const SYSTEM_WA_PHONE = Deno.env.get("SYSTEM_WA_PHONE") || "62881027979168";

function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("08")) return "62" + cleaned.slice(1);
  if (cleaned.startsWith("+62")) return cleaned.slice(1);
  if (cleaned.startsWith("62")) return cleaned;
  return cleaned;
}

interface Notification {
  id: string;
  barbershop_id: string;
  customer_phone: string;
  customer_name: string;
  event_type: string;
  message_body: string;
  status: string;
  wuzapi_message_id: string | null;
  retry_count: number;
  created_at: string;
}

const RETRY_DELAYS: Record<number, number> = {
  1: 30,    // 30 seconds
  2: 120,   // 2 minutes
  3: 300,   // 5 minutes
};

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Fetch pending notifications with retry delay check
  const { data: notifications, error: fetchError } = await supabase
    .from("wa_notifications")
    .select("*")
    .in("status", ["pending", "retrying"])
    .lt("retry_count", 3)
    .is("wuzapi_message_id", null)
    .order("created_at", { ascending: true })
    .limit(10);

  if (fetchError || !notifications || notifications.length === 0) {
    return new Response(JSON.stringify({ processed: 0, sent: 0, failed: 0 }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // Filter by retry delay
  const now = new Date();
  const eligible = notifications.filter((n: Notification) => {
    if (n.retry_count === 0) return true;
    const delay = RETRY_DELAYS[n.retry_count] || 300;
    const createdAt = new Date(n.created_at);
    const nextAttempt = new Date(createdAt.getTime() + delay * 1000);
    return now >= nextAttempt;
  });

  let sent = 0;
  let failed = 0;

  for (const notification of eligible) {
    // Fetch barbershop token
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("wuzapi_token, wa_connected")
      .eq("id", notification.barbershop_id)
      .single();

    let token = barbershop?.wuzapi_token;
    let sentViaSystem = false;

    if (!token || !barbershop?.wa_connected) {
      // Fallback to system WhatsApp number
      if (!SYSTEM_WUZAPI_TOKEN) {
        await supabase
          .from("wa_notifications")
          .update({
            status: "failed",
            error_message: "WA not connected and no system token configured",
          })
          .eq("id", notification.id);
        failed++;
        continue;
      }
      token = SYSTEM_WUZAPI_TOKEN;
      sentViaSystem = true;
    }

    // Send message via WuzAPI
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(`${WUZAPI_URL}/chat/send/text`, {
        method: "POST",
        headers: {
          Token: token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Phone: normalizePhone(notification.customer_phone),
          Body: notification.message_body,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const updateData: Record<string, unknown> = {
          status: "sent",
          wuzapi_message_id: data.data?.Id || "",
          sent_at: new Date().toISOString(),
        };
        if (sentViaSystem) {
          updateData.sent_via_system = true;
        }
        await supabase
          .from("wa_notifications")
          .update(updateData)
          .eq("id", notification.id);
        sent++;
      } else {
        const status = res.status;
        const text = await res.text();

        if (status === 400) {
          // Invalid phone number — don't retry
          await supabase
            .from("wa_notifications")
            .update({
              status: "failed",
              error_message: `Invalid phone: ${text}`,
            })
            .eq("id", notification.id);
          failed++;
        } else {
          // Retry
          const newRetryCount = notification.retry_count + 1;
          await supabase
            .from("wa_notifications")
            .update({
              status: "retrying",
              retry_count: newRetryCount,
              error_message: `WuzAPI ${status}: ${text}`,
            })
            .eq("id", notification.id);
          failed++;
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const newRetryCount = notification.retry_count + 1;
      await supabase
        .from("wa_notifications")
        .update({
          status: newRetryCount >= 3 ? "failed" : "retrying",
          retry_count: newRetryCount,
          error_message: message,
        })
        .eq("id", notification.id);
      failed++;
    }
  }

  return new Response(
    JSON.stringify({
      processed: eligible.length,
      sent,
      failed,
    }),
    { headers: { "Content-Type": "application/json" } }
  );
});
