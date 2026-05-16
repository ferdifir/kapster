"use client";

import { useState, useTransition } from "react";
import { createPayment } from "./actions";
import { PLAN_KEYS, PLAN_META, formatBillingPrice, type PlanKey } from "@/lib/config/plans";

type Plan = PlanKey | "enterprise";

type Subscription = {
  plan: Plan;
  status: string;
  period_end: string | null;
  max_barbers: number;
  max_queue_per_day: number;
};

type Payment = {
  id: string;
  order_id: string;
  amount: number;
  plan: Plan;
  status: string;
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
};

interface Props {
  subscription: Subscription;
  payments: Payment[];
  barberCount: number;
}

const STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  completed: "Berhasil",
  expired: "Kadaluarsa",
  cancelled: "Dibatalkan",
};

const STATUS_COLOR: Record<string, string> = {
  pending: "bg-barber-400/10 text-barber-400 border-barber-400/20",
  completed: "bg-green-500/10 text-green-400 border-green-500/20",
  expired: "bg-dark-700/50 text-dark-500 border-dark-700/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
};

function fmt(price: number) {
  return `Rp${price.toLocaleString("id-ID")}`;
}

export default function BillingManager({ subscription, payments, barberCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [upgradingPlan, setUpgradingPlan] = useState<Plan | null>(null);
  const [error, setError] = useState("");

  const handleUpgrade = (plan: PlanKey) => {
    setError("");
    setUpgradingPlan(plan);
    startTransition(async () => {
      const result = await createPayment(plan);
      if (result.error) {
        setError(result.error);
        setUpgradingPlan(null);
        return;
      }
      if (result.url) {
        window.location.href = result.url;
      }
    });
  };

  const periodEnd = subscription.period_end
    ? new Date(subscription.period_end).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;

  return (
    <div className="max-w-3xl space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Billing</h1>
        <p className="text-dark-400 text-sm">Kelola langganan dan riwayat pembayaran</p>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Current Plan */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Paket Saat Ini</h2>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="px-3 py-1 rounded-lg bg-barber-400/10 text-barber-400 border border-barber-400/20 text-sm font-semibold capitalize">
            {subscription.plan}
          </span>
          <span className={`px-2 py-0.5 rounded-lg text-xs border capitalize ${
            subscription.status === "active"
              ? "bg-green-500/10 text-green-400 border-green-500/20"
              : subscription.status === "trial"
              ? "bg-barber-400/10 text-barber-400 border-barber-400/20"
              : "bg-dark-700/50 text-dark-500 border-dark-700/30"
          }`}>
            {subscription.status === "active" ? "Aktif" : subscription.status === "trial" ? "Trial" : subscription.status}
          </span>
          {periodEnd && (
            <span className="text-dark-400 text-sm">Berlaku hingga {periodEnd}</span>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <p className="text-dark-500 text-xs mb-1">Barber</p>
            <p className="text-white text-sm font-medium">
              {barberCount} / {subscription.max_barbers === 999 ? "∞" : subscription.max_barbers}
            </p>
          </div>
          <div>
            <p className="text-dark-500 text-xs mb-1">Antrian per hari</p>
            <p className="text-white text-sm font-medium">
              {subscription.max_queue_per_day === 9999 ? "Tak terbatas" : `${subscription.max_queue_per_day}/hari`}
            </p>
          </div>
        </div>
      </div>

      {/* Plan Cards */}
      <div>
        <h2 className="font-semibold text-white mb-4">Pilih Paket</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {PLAN_KEYS.map((key) => {
            const meta = PLAN_META[key];
            const isCurrent = subscription.plan === key;
            const isUpgrading = isPending && upgradingPlan === key;

            return (
              <div
                key={key}
                className={`rounded-2xl p-5 space-y-4 border ${
                  isCurrent
                    ? "bg-barber-400/5 border-barber-400/30"
                    : "bg-dark-800/50 border-dark-700/30"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-white font-semibold">{meta.name}</p>
                    {isCurrent && (
                      <span className="text-xs text-barber-400 font-medium">Aktif</span>
                    )}
                  </div>
                  <p className="text-barber-400 font-bold text-lg">{formatBillingPrice(key)}</p>
                </div>

                <ul className="space-y-2">
                  {meta.billingFeatures.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-dark-300 text-sm">
                      <svg className="w-4 h-4 text-green-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>

                {key === "starter" ? (
                  <div className="py-2 text-center text-dark-500 text-sm">
                    {isCurrent ? "Paket gratis Anda" : "Downgrade tidak tersedia"}
                  </div>
                ) : (
                  <button
                    onClick={() => handleUpgrade(key as PlanKey)}
                    disabled={isCurrent || isPending}
                    className={`w-full py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50 ${
                      isCurrent
                        ? "bg-dark-700/50 text-dark-400 cursor-default"
                        : "gold-gradient text-dark-900 hover:opacity-90"
                    }`}
                  >
                    {isUpgrading
                      ? "Memproses..."
                      : isCurrent
                      ? "Paket Aktif"
                      : `Upgrade ke ${meta.name}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-dark-600 text-xs mt-3 text-center">
          Pembayaran diproses via Pakasir · QRIS & Virtual Account tersedia
        </p>
      </div>

      {/* Payment History */}
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
    </div>
  );
}
