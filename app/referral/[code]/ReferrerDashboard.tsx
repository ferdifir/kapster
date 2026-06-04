"use client";

import { useState } from "react";
import { requestPayout } from "@/app/referral/actions";
import Logo from "@/components/Logo";
import type { ReferralCodeRow } from "@/lib/referral-types";

interface ReferralItem {
  id: string;
  shop_name: string;
  status: string;
  commission: number;
  earned_at: string | null;
  created_at: string;
}

function formatRp(n: number) {
  return `Rp${n.toLocaleString("id-ID")}`;
}

function formatDate(d: string | null) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ReferrerDashboard({
  rc,
  referrals,
  pendingCount,
  earnedCount,
}: {
  rc: ReferralCodeRow;
  referrals: ReferralItem[];
  pendingCount: number;
  earnedCount: number;
}) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kapster.my.id";
  const referralLink = `${baseUrl}?ref=${rc.code}`;

  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState(rc.balance);
  const [payoutMethod, setPayoutMethod] = useState("bank_transfer");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [bankHolder, setBankHolder] = useState("");
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [payoutError, setPayoutError] = useState("");
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePayoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayoutLoading(true);
    setPayoutError("");

    const amount =
      payoutAmount > 0 && payoutAmount <= rc.balance
        ? payoutAmount
        : rc.balance;

    const fd = new FormData();
    fd.set("referral_code_id", rc.id);
    fd.set("amount", String(amount));
    fd.set("method", payoutMethod);

    if (payoutMethod === "bank_transfer") {
      fd.set(
        "bank_info",
        JSON.stringify({
          bank: bankName,
          account: bankAccount,
          holder: bankHolder,
        })
      );
    }

    const result = await requestPayout(fd);

    if ("error" in result) {
      setPayoutError(result.error ?? "Terjadi kesalahan.");
      setPayoutLoading(false);
      return;
    }

    setPayoutSuccess(true);
    setPayoutLoading(false);
  };

  const statusBadge = (status: string) => {
    if (status === "earned") {
      return (
        <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium">
          {formatRp(3500)}
        </span>
      );
    }
    if (status === "paid") {
      return (
        <span className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium">
          Ditarik
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-lg bg-dark-600/50 text-dark-400 text-sm font-medium">
        Menunggu
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-dark-950">
      <div className="max-w-lg mx-auto px-4 py-8 space-y-6">
        {/* Header */}
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <Logo className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Halo, {rc.name}!
          </h1>
          <p className="text-dark-400 text-sm">Pendapatan referral kamu</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-white">{referrals.length}</p>
            <p className="text-dark-400 text-xs mt-1">Total Diajak</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-barber-400">{earnedCount}</p>
            <p className="text-dark-400 text-xs mt-1">Sudah Bayar</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 text-center">
            <p className="text-2xl font-bold text-dark-400">{pendingCount}</p>
            <p className="text-dark-400 text-xs mt-1">Menunggu</p>
          </div>
        </div>

        {/* Balance Card */}
        <div className="rounded-2xl p-6 bg-gradient-to-br from-barber-500/20 via-dark-800/80 to-dark-800 border border-barber-500/20">
          <p className="text-dark-300 text-sm mb-1">Saldo kamu</p>
          <p className="font-display text-3xl font-bold text-white mb-4">
            {formatRp(rc.balance)}
          </p>
          {rc.balance >= 25000 ? (
            <button
              onClick={() => setShowModal(true)}
              className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
            >
              Tarik Saldo
            </button>
          ) : (
            <button
              disabled
              className="w-full py-3 rounded-xl bg-dark-700/50 text-dark-500 font-bold cursor-not-allowed"
            >
              Tarik Saldo
            </button>
          )}
          <p className="text-dark-500 text-xs text-center mt-3">
            Minimum tarik: Rp25.000 • Total sudah ditarik:{" "}
            {formatRp(rc.total_withdrawn)}
          </p>
        </div>

        {/* Referral Link */}
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-3">
          <h2 className="font-semibold text-white text-sm">Link Referral</h2>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={referralLink}
              readOnly
              className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
            >
              {copied ? "Tersalin!" : "Salin"}
            </button>
          </div>
        </div>

        {/* Referral History */}
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
          <h2 className="font-semibold text-white text-sm">Riwayat Referral</h2>
          {referrals.length === 0 ? (
            <p className="text-dark-500 text-sm text-center py-6">
              Belum ada referral. Bagikan link kamu!
            </p>
          ) : (
            <div className="space-y-3">
              {referrals.map((r: ReferralItem) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b border-dark-700/30 last:border-0"
                >
                  <div>
                    <p className="text-white text-sm font-medium">
                      {r.shop_name}
                    </p>
                    <p className="text-dark-500 text-xs">{formatDate(r.status === "earned" ? r.earned_at : r.created_at)}</p>
                  </div>
                  {statusBadge(r.status)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Payout Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setShowModal(false)}
          />
          <div className="relative bg-dark-800 border border-dark-700/50 rounded-2xl p-6 w-full max-w-sm space-y-5">
            {payoutSuccess ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-500/15 flex items-center justify-center mx-auto">
                  <svg
                    className="w-7 h-7 text-emerald-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="font-display text-xl font-bold text-white">
                  Permintaan terkirim!
                </h3>
                <p className="text-dark-400 text-sm">
                  Kami akan proses dalam 1-3 hari kerja.
                </p>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setPayoutSuccess(false);
                  }}
                  className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
                >
                  Tutup
                </button>
              </div>
            ) : (
              <>
                <h3 className="font-display text-lg font-bold text-white">
                  Tarik Saldo
                </h3>

                <form onSubmit={handlePayoutSubmit} className="space-y-4">
                  {payoutError && (
                    <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                      {payoutError}
                    </div>
                  )}

                  <div>
                    <label className="block text-dark-300 text-sm font-medium mb-2">
                      Jumlah
                    </label>
                    <input
                      type="number"
                      value={payoutAmount}
                      onChange={(e) => setPayoutAmount(Number(e.target.value))}
                      max={rc.balance}
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
                    />
                    <p className="text-dark-500 text-xs mt-1">
                      Maksimal: {formatRp(rc.balance)}
                    </p>
                  </div>

                  <div>
                    <label className="block text-dark-300 text-sm font-medium mb-2">
                      Metode
                    </label>
                    <select
                      value={payoutMethod}
                      onChange={(e) => setPayoutMethod(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors appearance-none"
                    >
                      <option value="bank_transfer">Transfer Bank</option>
                    </select>
                  </div>

                  {payoutMethod === "bank_transfer" && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                          Nama Bank
                        </label>
                        <input
                          type="text"
                          value={bankName}
                          onChange={(e) => setBankName(e.target.value)}
                          required
                          placeholder="BCA / Mandiri / BRI"
                          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                          No. Rekening
                        </label>
                        <input
                          type="text"
                          value={bankAccount}
                          onChange={(e) => setBankAccount(e.target.value)}
                          required
                          placeholder="1234567890"
                          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-dark-300 text-sm font-medium mb-2">
                          Nama Pemilik Rekening
                        </label>
                        <input
                          type="text"
                          value={bankHolder}
                          onChange={(e) => setBankHolder(e.target.value)}
                          required
                          placeholder="Nama sesuai rekening"
                          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                        />
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={payoutLoading}
                    className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {payoutLoading ? "Memproses..." : "Kirim Permintaan"}
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="w-full py-3 rounded-xl border border-dark-600 text-dark-200 hover:border-barber-400/50 hover:text-barber-400 transition-colors font-semibold text-sm"
                  >
                    Batal
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
