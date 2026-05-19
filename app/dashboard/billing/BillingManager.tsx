"use client";

// import { useState, useTransition } from "react";
// import { createPayment } from "./actions";
// import { PLAN_KEYS, PLAN_META, formatBillingPrice, type PlanKey } from "@/lib/config/plans";

type Plan = "starter" | "basic" | "pro" | "enterprise";

type Subscription = {
  plan: Plan;
  status: string;
  period_end: string | null;
  max_barbers: number;
  max_queue_per_day: number;
};

// type Payment = {
//   id: string;
//   order_id: string;
//   amount: number;
//   plan: Plan;
//   status: string;
//   payment_method: string | null;
//   created_at: string;
//   completed_at: string | null;
// };

interface Props {
  subscription: Subscription;
  // payments: Payment[];
  barberCount: number;
}

const FEATURES = [
  { label: "3 Barber", desc: "Kelola hingga 3 tukang cukur" },
  { label: "50 Antrian/hari", desc: "Cukup untuk barbershop ramai" },
  { label: "Queue Digital", desc: "Antrian online real-time" },
  { label: "Public Booking Page", desc: "Halaman booking untuk pelanggan" },
  { label: "TV Display", desc: "Tampilkan nomor antrian di TV" },
  // { label: "WhatsApp Notification", desc: "Notifikasi otomatis ke pelanggan" },
  // { label: "Basic Reports", desc: "Laporan harian dan mingguan" },
  // { label: "Custom Logo", desc: "Upload logo barbershop" },
  // { label: "Analytics Lengkap", desc: "Dashboard analytics mendalam" },
  // { label: "Priority Support", desc: "Dukungan prioritas" },
  // { label: "API Access", desc: "Akses API untuk integrasi" },
];

// const STATUS_LABEL: Record<string, string> = {
//   pending: "Menunggu",
//   completed: "Berhasil",
//   expired: "Kadaluarsa",
//   cancelled: "Dibatalkan",
// };

// const STATUS_COLOR: Record<string, string> = {
//   pending: "bg-barber-400/10 text-barber-400 border-barber-400/20",
//   completed: "bg-green-500/10 text-green-400 border-green-500/20",
//   expired: "bg-dark-700/50 text-dark-500 border-dark-700/30",
//   cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
// };

// function fmt(price: number) {
//   return `Rp${price.toLocaleString("id-ID")}`;
// }

export default function BillingManager({ subscription, barberCount }: Props) {
  // const [isPending, startTransition] = useTransition();
  // const [upgradingPlan, setUpgradingPlan] = useState<Plan | null>(null);
  // const [error, setError] = useState("");

  // const handleUpgrade = (plan: PlanKey) => {
  //   setError("");
  //   setUpgradingPlan(plan);
  //   startTransition(async () => {
  //     const result = await createPayment(plan);
  //     if (result.error) {
  //       setError(result.error);
  //       setUpgradingPlan(null);
  //       return;
  //     }
  //     if (result.url) {
  //       window.location.href = result.url;
  //     }
  //   });
  // };

  // const periodEnd = subscription.period_end
  //   ? new Date(subscription.period_end).toLocaleDateString("id-ID", {
  //       day: "numeric",
  //       month: "long",
  //       year: "numeric",
  //     })
  //   : null;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Paket & Fitur</h1>
        <p className="text-dark-400 text-sm">Semua fitur tersedia gratis</p>
      </div>

      {/* Current Plan */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Paket Saat Ini</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-lg bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm font-semibold capitalize">
            Basic
          </span>
          <span className="px-2 py-0.5 rounded-lg text-xs border bg-green-500/10 text-green-400 border-green-500/20">
            Aktif
          </span>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-dark-500 text-xs mb-1">Barber</p>
            <p className="text-white text-sm font-medium">
              {barberCount} / {subscription.max_barbers}
            </p>
          </div>
          <div>
            <p className="text-dark-500 text-xs mb-1">Antrian per hari</p>
            <p className="text-white text-sm font-medium">
              {subscription.max_queue_per_day}/hari
            </p>
          </div>
        </div>
      </div>

      {/* Features */}
      <div>
        <h2 className="font-semibold text-white mb-4">Fitur Tersedia</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="flex items-start gap-3 p-4 rounded-xl bg-dark-800/50 border border-dark-700/30"
            >
              <div className="w-8 h-8 rounded-lg bg-barber-400/10 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-white text-sm font-medium">{f.label}</p>
                <p className="text-dark-400 text-xs">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment History - commented out */}
      {/*
      {payments.length > 0 && (
        <div>
          <h2 className="font-semibold text-white mb-4">Riwayat Pembayaran</h2>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
            <div className="divide-y divide-dark-700/30">
              {payments.map((p) => (
                <div key={p.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-white text-sm font-medium capitalize">{p.plan}</p>
                      <span className={`px-2 py-0.5 rounded-lg text-xs border ${STATUS_COLOR[p.status] ?? "bg-dark-700/50 text-dark-500 border-dark-700/30"}`}>
                        {STATUS_LABEL[p.status] ?? p.status}
                      </span>
                    </div>
                    <p className="text-dark-400 text-xs mt-0.5">
                      {new Date(p.created_at).toLocaleDateString("id-ID", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                      {p.payment_method && ` · ${p.payment_method.replace(/_/g, " ")}`}
                    </p>
                  </div>
                  <p className="text-white font-semibold text-sm shrink-0">{fmt(p.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      */}
    </div>
  );
}
