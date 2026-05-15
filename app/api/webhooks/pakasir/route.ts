import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { PLAN_LIMITS, type PlanKey } from "@/lib/config/plans";

const PERIOD_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amount, order_id, project, status, payment_method, completed_at } = body;

    if (project !== "queuebarber") {
      return NextResponse.json({ error: "Invalid project" }, { status: 400 });
    }

    // Only process completed payments
    if (status !== "completed") {
      return NextResponse.json({ ok: true });
    }

    const supabase = createAdminClient();

    const { data: payment, error: paymentError } = await supabase
      .from("payments")
      .select("*")
      .eq("order_id", order_id)
      .single();

    if (paymentError || !payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.amount !== amount) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    // Idempotency — skip if already processed
    if (payment.status === "completed") {
      return NextResponse.json({ ok: true });
    }

    // Update payment record
    await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_method: payment_method ?? null,
        pakasir_response: body,
        completed_at: completed_at ?? new Date().toISOString(),
      })
      .eq("id", payment.id);

    // Calculate new subscription period
    const now = new Date();
    const periodEnd = new Date(now);
    periodEnd.setDate(periodEnd.getDate() + PERIOD_DAYS);

    const plan = payment.plan as PlanKey;
    const limits = PLAN_LIMITS[plan] ?? PLAN_LIMITS.starter;

    await supabase
      .from("subscriptions")
      .update({
        plan: payment.plan,
        status: "active",
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        pakasir_order_id: order_id,
        max_barbers: limits.max_barbers,
        max_queue_per_day: limits.max_queue_per_day,
      })
      .eq("barbershop_id", payment.barbershop_id);

    await supabase
      .from("barbershops")
      .update({ plan: payment.plan })
      .eq("id", payment.barbershop_id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Pakasir webhook error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
