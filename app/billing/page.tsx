import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateOrderId, getPaymentUrl } from "@/lib/pakasir";
import PayButton from "./pay-button";

export default async function BillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("barbershop_id", barbershop.id)
    .maybeSingle();

  const now = new Date().toISOString();

  const isActive = subscription && (subscription.status === "active" || subscription.status === "cancelled") && subscription.current_period_end > now;

  if (isActive) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl bg-dark-800/50 border border-dark-700/30 p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Langganan Aktif</h1>
          <p className="text-dark-300 mb-1">{barbershop.name}</p>
          <p className="text-dark-400 text-sm">
            Periode: {new Date(subscription.current_period_start).toLocaleDateString("id-ID")} — {new Date(subscription.current_period_end).toLocaleDateString("id-ID")}
          </p>
          {subscription.status === "cancelled" && (
            <p className="text-yellow-400 text-sm mt-2">Berakhir pada periode ini</p>
          )}
          <a href="/dashboard" className="mt-6 inline-block px-6 py-3 rounded-xl gold-gradient text-dark-900 font-bold">
            Ke Dashboard
          </a>
        </div>
      </div>
    );
  }

  const orderId = generateOrderId(barbershop.id);
  const paymentUrl = getPaymentUrl(orderId);

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-2xl bg-dark-800/50 border border-dark-700/30 p-8 text-center">
        <h1 className="font-display text-2xl font-bold text-white mb-2">Aktifkan Langganan</h1>
        <p className="text-dark-300 mb-6">Akses semua fitur Kapster</p>

        <div className="bg-dark-900/50 rounded-xl p-6 mb-6">
          <p className="text-dark-400 text-sm mb-1">Harga</p>
          <p className="font-display text-4xl font-bold text-white">
            Rp10.000
            <span className="text-lg text-dark-400 font-normal">/bulan</span>
          </p>
        </div>

        <ul className="text-left space-y-3 mb-8">
          {[
            "Manajemen antrian real-time",
            "Booking online",
            "Notifikasi WhatsApp otomatis",
            "Manajemen barber & layanan",
            "Dashboard analitik",
            "Tampilan TV monitor",
          ].map((f) => (
            <li key={f} className="flex items-center gap-3 text-dark-200 text-sm">
              <svg className="w-5 h-5 text-barber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {f}
            </li>
          ))}
        </ul>

        <PayButton orderId={orderId} paymentUrl={paymentUrl} />

        <p className="text-dark-500 text-xs mt-4">Bayar sekali, pakai 30 hari penuh. Cancel kapan saja.</p>
      </div>
    </div>
  );
}
