import { createAdminClient } from "@/lib/supabase/admin";
import { renderWATemplate, type WAEventType } from "@/lib/wa-templates";
import { logError } from "@/lib/error-logger";

export async function enqueueWANotification(
  barbershopId: string,
  customerPhone: string,
  customerName: string,
  eventType: WAEventType,
  context: {
    number?: string | number;
    date?: string;
    time?: string;
    estimated?: string;
    position?: number;
    service?: string;
    barber?: string;
  }
) {
  try {
    const supabase = createAdminClient();

    // Fetch barbershop name
    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("name")
      .eq("id", barbershopId)
      .single();

    if (!barbershop) return;

    const messageBody = renderWATemplate(eventType, {
      name: customerName,
      barbershop: barbershop.name,
      ...context,
    });

    await supabase.from("wa_notifications").insert({
      barbershop_id: barbershopId,
      customer_phone: customerPhone,
      customer_name: customerName,
      event_type: eventType,
      message_body: messageBody,
      status: "pending",
    });
  } catch (err) {
    logError("enqueueWANotification", err, { barbershopId, eventType, customerPhone });
  }
}
