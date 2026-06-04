import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendTelegramNotification } from "@/lib/telegram";
import { logError } from "@/lib/error-logger";

export async function POST(request: Request) {
  let rawBody = "{}";
  try {
    rawBody = await request.text();
    const body = JSON.parse(rawBody);
    const { amount, order_id, status, payment_method, completed_at } = body;

    if (!order_id || !amount || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (status !== "completed") {
      return NextResponse.json({ message: "Unhandled status" }, { status: 200 });
    }

    const supabase = createAdminClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("id, barbershop_id, status, amount")
      .eq("pakasir_order_id", order_id)
      .single();

    if (paymentError || !payment) {
      logError("webhook/pakasir", "Payment not found", { order_id });
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    if (Number(payment.amount) !== Number(amount)) {
      logError("webhook/pakasir", "Amount mismatch", {
        order_id, expected: payment.amount, received: amount,
      });
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_method: payment_method || null,
        paid_at: completed_at || now,
      })
      .eq("id", payment.id);

    if (updateError) {
      logError("webhook/pakasir", updateError.message, { order_id, payment_id: payment.id });
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .upsert({
        barbershop_id: payment.barbershop_id,
        status: "active",
        current_period_start: now,
        current_period_end: periodEnd,
        updated_at: now,
      }, {
        onConflict: "barbershop_id",
        ignoreDuplicates: false,
      })
      .select()
      .single();

    if (subError) {
      logError("webhook/pakasir", subError.message, { barbershop_id: payment.barbershop_id });
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const { error: linkError } = await supabase
      .from("payments")
      .update({ subscription_id: subscription.id })
      .eq("id", payment.id);

    if (linkError) {
      console.error("Failed to link payment to subscription:", linkError);
    }

    const { data: shop } = await supabase
      .from("barbershops")
      .select("name")
      .eq("id", payment.barbershop_id)
      .single();

    if (shop) {
      const { count } = await supabase
        .from("payments")
        .select("id", { count: "exact", head: true })
        .eq("barbershop_id", payment.barbershop_id)
        .eq("status", "completed")
        .neq("id", payment.id);

      const isRenewal = (count ?? 0) > 0;

      const text = [
        `💰 <b>Langganan ${isRenewal ? "Perpanjangan" : "Baru"}</b>`,
        `🏪 ${shop.name}`,
        `💵 Rp${Number(payment.amount).toLocaleString("id-ID")}`,
      ].join("\n");

      sendTelegramNotification(text);

      // Credit referral commission on first payment only
      if (!isRenewal) {
        const { creditReferralCommission } = await import("@/lib/referral");
        try {
          const result = await creditReferralCommission(payment.barbershop_id);
          if (result) {
            console.log(`Referral commission credited: Rp${result.commission} for barbershop ${payment.barbershop_id}`);
          }
        } catch (err) {
          console.error("Failed to credit referral commission:", err);
        }
      }
    }

    return NextResponse.json({ message: "Subscription activated" }, { status: 200 });
  } catch (err) {
    logError("webhook/pakasir", err, { body: rawBody });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
