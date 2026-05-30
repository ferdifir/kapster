"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function PayButton({ orderId, paymentUrl }: { orderId: string; paymentUrl: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handlePay = async () => {
    setLoading(true);
    setError("");

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: barbershop } = await supabase
        .from("barbershops")
        .select("id")
        .eq("owner_id", user.id)
        .single();

      if (!barbershop) {
        setError("Barbershop tidak ditemukan");
        return;
      }

      const { error: insertError } = await supabase.from("payments").insert({
        barbershop_id: barbershop.id,
        pakasir_order_id: orderId,
        amount: 10000,
        status: "pending",
      });

      if (insertError) {
        setError("Gagal membuat pembayaran. Silakan coba lagi.");
        return;
      }

      window.location.href = paymentUrl;
    } catch {
      setError("Terjadi kesalahan. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handlePay}
        disabled={loading}
        className="w-full px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-lg hover:shadow-lg hover:shadow-barber-400/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Memproses..." : "Bayar Rp10.000 Sekarang"}
      </button>
      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}
    </div>
  );
}
