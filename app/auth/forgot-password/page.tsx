"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { sendOTP } from "@/app/auth/actions";
import { validatePhone } from "@/lib/phone";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const validation = validatePhone(phone);
    if (!validation.valid) {
      setError(validation.error!);
      setLoading(false);
      return;
    }

    const result = await sendOTP(phone, "password_reset");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSent(true);
    setTimeout(() => {
      router.push(`/auth/forgot-password/verify?phone=${encodeURIComponent(phone)}`);
    }, 1500);
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-barber-400/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Cek WhatsApp Kamu</h2>
          <p className="text-dark-400 text-sm leading-relaxed">
            Jika nomor terdaftar, kode OTP akan dikirim ke WhatsApp. Mengarahkan ke halaman verifikasi...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h1 className="font-display text-2xl font-bold text-white mb-2">Lupa Password</h1>
          <p className="text-dark-400 text-sm">
            Masukkan nomor WhatsApp yang terdaftar untuk menerima kode OTP reset password.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nomor WhatsApp</label>
            <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
              required placeholder="08123456789"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Mengirim..." : "Kirim Kode OTP"}
          </button>

          <p className="text-center">
            <Link href="/auth/login" className="text-sm text-dark-400 hover:text-barber-400 transition-colors">
              Kembali ke halaman login
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
