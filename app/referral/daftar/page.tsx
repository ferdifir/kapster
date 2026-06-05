"use client";

import { useState } from "react";
import { daftarReferrer } from "../actions";
import Logo from "@/components/Logo";

export default function DaftarReferralPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState<{ code: string; token: string } | null>(null);
  const [copied, setCopied] = useState<"referral" | "performance" | null>(null);

  const baseUrl = "https://kapster.my.id";

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const result = await daftarReferrer(formData);

    if ("error" in result) {
      setError(result.error ?? "");
      setLoading(false);
      return;
    }

    setSuccess({ code: result.code!, token: result.token! });
    setLoading(false);
  };

  const copyToClipboard = async (text: string, type: "referral" | "performance") => {
    await navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(null), 2000);
  };

  if (success) {
    const referralLink = `${baseUrl}?ref=${success.code}`;
    const performanceLink = `${baseUrl}/referral/${success.code}?t=${success.token}`;

    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
              <Logo className="w-7 h-7 text-dark-900" />
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-1">
              Pendaftaran Berhasil!
            </h1>
          </div>

          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Link Referral
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={referralLink}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(referralLink, "referral")}
                  className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
                >
                  {copied === "referral" ? "Tersalin!" : "Salin"}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-dark-300 text-sm font-medium mb-2">
                Link Performa
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={performanceLink}
                  readOnly
                  className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none"
                />
                <button
                  onClick={() => copyToClipboard(performanceLink, "performance")}
                  className="px-4 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm whitespace-nowrap transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
                >
                  {copied === "performance" ? "Tersalin!" : "Salin"}
                </button>
              </div>
            </div>

            <a
              href={performanceLink}
              className="block w-full py-3 rounded-xl border border-dark-600 text-dark-200 hover:border-barber-400/50 hover:text-barber-400 transition-colors font-semibold text-center"
            >
              Lihat Halaman Performa
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <Logo className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Dapatkan Link Referral
          </h1>
          <p className="text-dark-400 text-sm">
            Dapatkan Rp3.500 untuk setiap barbershop yang daftar via link kamu
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Nama <span className="text-barber-400">*</span>
            </label>
            <input
              type="text"
              name="name"
              required
              minLength={2}
              placeholder="Nama lengkap kamu"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">
              Nomor WhatsApp <span className="text-barber-400">*</span>
            </label>
            <div className="flex items-center rounded-xl overflow-hidden border border-dark-600/50 focus-within:border-barber-400/50 transition-colors">
              <span className="px-3 py-3 bg-dark-700/80 text-dark-400 text-sm border-r border-dark-600/50">
                +62
              </span>
              <input
                type="tel"
                name="wa_number"
                required
                minLength={8}
                placeholder="812 3456 7890"
                className="flex-1 px-3 py-3 bg-dark-700/50 text-white placeholder-dark-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/15">
            <p className="text-dark-300 text-sm">
              Dapatkan Rp3.500 untuk setiap pemilik barbershop yang mendaftar
              via link referral kamu. Bayaran langsung masuk ke saldo kamu!
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "Dapatkan Link Referral"}
          </button>
        </form>
      </div>
    </div>
  );
}
