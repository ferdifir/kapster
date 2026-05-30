"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { setupPhoneVerification, verifyOTP } from "@/app/auth/actions";
import { validatePhone } from "@/lib/phone";
import Logo from "@/components/Logo";

export default function RegisterPage() {
  const supabase = createClient();
  const router = useRouter();

  const [step, setStep] = useState<"form" | "otp">("form");
  const [form, setForm] = useState({ full_name: "", email: "", password: "", phone: "" });
  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      cooldownRef.current = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
    };
  }, [resendCooldown]);

  // Handle redirect dari onboarding — user sudah punya session, butuh verify WA
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("phone_unverified") === "true") {
      supabase.auth.getUser().then(async ({ data: { user } }) => {
        if (user) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("phone")
            .eq("id", user.id)
            .single();
          if (profile?.phone) {
            setForm(prev => ({ ...prev, phone: profile.phone ?? "" }));
            setStep("otp");
          }
        }
      });
    }
  }, []);

  // Redirect ke dashboard kalau sudah login (kecuali datang dari onboarding)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("phone_unverified") === "true") return;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        router.push("/dashboard");
      }
    });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(0, 1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      const next = document.getElementById(`otp-${index + 1}`);
      next?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      const prev = document.getElementById(`otp-${index - 1}`);
      prev?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const phoneValidation = validatePhone(form.phone);
    if (!phoneValidation.valid) {
      setError(phoneValidation.error!);
      setLoading(false);
      return;
    }

    const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || location.origin;
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.full_name },
        emailRedirectTo: `${siteUrl}/auth/callback?next=/onboarding`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    if (data.user?.identities?.length === 0) {
      setError("Email ini sudah terdaftar. Silakan login atau gunakan email lain.");
      setLoading(false);
      return;
    }

    // Send OTP to WhatsApp
    const result = await setupPhoneVerification(form.phone);
    if (result.error) {
      setError(result.error);
    }
    setStep("otp");
    setLoading(false);
    setResendCooldown(60);
  };

  const handleVerifyOtp = async () => {
    setVerifyLoading(true);
    setError("");

    const code = otpValues.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP.");
      setVerifyLoading(false);
      return;
    }

    const result = await verifyOTP(form.phone, code, "registration_verification");
    if (result.error) {
      setError(result.error);
      setVerifyLoading(false);
      return;
    }

    router.push("/onboarding");
  };

  const handleResendOtp = async () => {
    setResendLoading(true);
    setError("");
    const result = await setupPhoneVerification(form.phone);
    if (result.error) {
      setError(result.error);
    } else {
      setResendCooldown(60);
    }
    setResendLoading(false);
  };

  if (step === "otp") {
    return (
      <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-barber-400/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-barber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h2 className="font-display text-2xl font-bold text-white mb-3">
            Verifikasi WhatsApp
          </h2>
          <p className="text-dark-400 text-sm leading-relaxed mb-2">
            Kode OTP sudah dikirim ke <span className="text-barber-400">{form.phone}</span>
          </p>
          <p className="text-dark-500 text-xs mb-8">Masukkan 6 digit kode di bawah</p>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-6">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-center mb-8">
            {otpValues.map((digit, i) => (
              <input
                key={i}
                id={`otp-${i}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpChange(i, e.target.value)}
                onKeyDown={(e) => handleOtpKeyDown(i, e)}
                className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
              />
            ))}
          </div>

          <button
            onClick={handleVerifyOtp}
            disabled={verifyLoading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed mb-4"
          >
            {verifyLoading ? "Memverifikasi..." : "Verifikasi"}
          </button>

          <button
            onClick={handleResendOtp}
            disabled={resendLoading || resendCooldown > 0}
            className="text-sm text-dark-400 hover:text-barber-400 transition-colors disabled:opacity-50"
          >
            {resendLoading
              ? "Mengirim..."
              : resendCooldown > 0
                ? `Kirim ulang dalam ${resendCooldown} detik`
                : "Tidak menerima kode? Kirim ulang"}
          </button>
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
          <h1 className="font-display text-2xl font-bold text-white mb-2">Daftar</h1>
          <p className="text-dark-400 text-sm">
            Sudah punya akun?{" "}
            <Link href="/auth/login" className="text-barber-400 hover:text-barber-300 transition-colors">
              Masuk
            </Link>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5">
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nama Lengkap</label>
            <input type="text" name="full_name" value={form.full_name} onChange={handleChange} required
              placeholder="Budi Santoso"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Email</label>
            <input type="email" name="email" value={form.email} onChange={handleChange} required
              placeholder="nama@barbershop.com"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Password</label>
            <input type="password" name="password" value={form.password} onChange={handleChange}
              required minLength={8} placeholder="Min. 8 karakter"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <div>
            <label className="block text-dark-300 text-sm font-medium mb-2">Nomor WhatsApp</label>
            <input type="tel" name="phone" value={form.phone} onChange={handleChange} required
              placeholder="08123456789"
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
          </div>

          <button type="submit" disabled={loading}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed">
            {loading ? "Mendaftar..." : "Daftar Sekarang"}
          </button>

          <p className="text-dark-500 text-xs text-center">
            Dengan mendaftar kamu setuju dengan{" "}
            <a href="/terms-of-service" className="text-barber-400 hover:text-barber-300">Syarat & Ketentuan</a>{" "}
            dan{" "}
            <a href="/privacy-policy" className="text-barber-400 hover:text-barber-300">Kebijakan Privasi</a>{" "}
            kami.
          </p>
        </form>
      </div>
    </div>
  );
}
