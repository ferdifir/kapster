"use client";

import { createClient } from "@/lib/supabase/client";

export default function PayButton({ orderId, paymentUrl }: { orderId: string; paymentUrl: string }) {
  const supabase = createClient();

  const handlePay = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: barbershop } = await supabase
      .from("barbershops")
      .select("id")
      .eq("owner_id", user.id)
      .single();

    if (!barbershop) return;

    await supabase.from("payments").insert({
      barbershop_id: barbershop.id,
      pakasir_order_id: orderId,
      amount: 10000,
      status: "pending",
    });

    window.location.href = paymentUrl;
  };

  return (
    <button
      onClick={handlePay}
      className="w-full px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300"
    >
      Bayar Rp10.000 Sekarang
    </button>
  );
}
