"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { requestPayout } from "@/app/referral/actions";
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

export default function OwnerReferralClient({
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
  const router = useRouter();
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
    router.refresh();
  };

  const statusBadge = (status: string, commission: number) => {
    if (status === "earned") {
      return (
        <span className="px-3 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-sm font-medium whitespace-nowrap">
          {formatRp(commission)}
        </span>
      );
    }
    if (status === "paid") {
      return (
        <span className="px-3 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-sm font-medium whitespace-nowrap">
          Ditarik
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-lg bg-dark-600/50 text-dark-400 text-sm font-medium whitespace-nowrap">
        Menunggu
      </span>
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-white mb-1">
          Referral
        </h1>
        <p className="text-dark-400 text-sm">
          Ajak barbershop lain dan dapatkan komisi
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-white">{referrals.length}</p>
          <p className="text-dark-400 text-xs mt-1">Total Diajak</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-barber-400">{earnedCount}</p>
          <p className="text-dark-400 text-xs mt-1">Komisi Didapat</p>
        </div>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-dark-400">{pendingCount}</p>
          <p className="text-dark-400 text-xs mt-1">Menunggu</p>
        </div>
      </div>

      <div className="rounded-2xl p-6 bg-gradient-to-br from-barber-500/20 via-dark-800/80 to-dark-800 border border-barber-500/20">
        <p className="text-dark-300 text-sm mb-1">Saldo Komisi</p>
        <p className="font-display text-3xl font-bold text-white mb-4">
          {formatRp(rc.balance)}
        </p>
        {rc.balance >= 25000 ? (
          <button
            onClick={() => setShowModal(true)}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
          >
            Tarik Saldo (min Rp25.000)
          </button>
        ) : (
          <button
            disabled
            className="w-full py-3 rounded-xl bg-dark-700/50 text-dark-500 font-bold cursor-not-allowed"
          >
            Tarik Saldo (min Rp25.000)
          </button>
        )}
      </div>

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

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-dark-700/30">
          <h2 className="font-semibold text-white">Riwayat Referral</h2>
        </div>
        {referrals.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-dark-400 text-sm">
              Belum ada referral. Bagikan link kamu!
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-700/30">
                  <th className="text-left px-6 py-3 text-dark-400 font-medium">Barbershop</th>
                  <th className="text-left px-4 py-3 text-dark-400 font-medium">Tanggal</th>
                  <th className="text-right px-6 py-3 text-dark-400 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-700/20">
                {referrals.map((r: ReferralItem) => (
                  <tr key={r.id} className="hover:bg-dark-700/20 transition-colors">
                    <td className="px-6 py-3 text-white font-medium">{r.shop_name}</td>
                    <td className="px-4 py-3 text-dark-400">
                      {formatDate(r.status === "earned" ? r.earned_at : r.created_at)}
                    </td>
                    <td className="px-6 py-3 text-right">{statusBadge(r.status, r.commission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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
                      <option value="subscription_offset">Potong Subscription</option>
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

                  {payoutMethod === "subscription_offset" && (
                    <div className="px-4 py-3 rounded-xl bg-barber-400/10 border border-barber-400/20 text-barber-300 text-sm">
                      Komisi akan dipotongkan dari subscription bulan depan
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
