"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { resetPassword } from "@/app/auth/actions";

function ResetForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (password.length < 8) {
      setError("Password minimal 8 karakter.");
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Konfirmasi password tidak cocok.");
      setLoading(false);
      return;
    }

    const result = await resetPassword(phone, password);
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/auth/login"), 2000);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">Password Berhasil Diubah</h2>
          <p className="text-dark-400 text-sm">Mengarahkan ke halaman login...</p>
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
          <h1 className="font-display text-2xl font-bold text-white mb-2">Buat Password Baru</h1>
          <p className="text-dark-400 text-sm">Masukkan password baru untuk akun kamu.</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Password Baru</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required minLength={8} placeholder="Min. 8 karakter"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Konfirmasi Password</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
              required minLength={8} placeholder="Masukkan ulang password"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Menyimpan..." : "Simpan Password Baru"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ForgotPasswordResetPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950" />}>
      <ResetForm />
    </Suspense>
  );
}
