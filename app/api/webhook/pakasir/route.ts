import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "completed") {
      return NextResponse.json({ message: "Already processed" }, { status: 200 });
    }

    if (Number(payment.amount) !== Number(amount)) {
      return NextResponse.json({ error: "Amount mismatch" }, { status: 400 });
    }

    const now = new Date().toISOString();
    const periodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

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
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const { error: updateError } = await supabase
      .from("payments")
      .update({
        status: "completed",
        payment_method: payment_method || null,
        paid_at: completed_at || now,
        subscription_id: subscription.id,
      })
      .eq("id", payment.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to update payment" }, { status: 500 });
    }

    return NextResponse.json({ message: "Subscription activated" }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
