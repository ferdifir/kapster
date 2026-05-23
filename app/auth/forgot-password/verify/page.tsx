"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";
import { verifyOTP, sendOTP } from "@/app/auth/actions";

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get("phone") || "";

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(60);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [error, setError] = useState("");

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

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otpValues];
    newOtp[index] = value.slice(0, 1);
    setOtpValues(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otpValues[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    const code = otpValues.join("");
    if (code.length !== 6) {
      setError("Masukkan 6 digit kode OTP.");
      setLoading(false);
      return;
    }

    const result = await verifyOTP(phone, code, "password_reset");
    if (result.error) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push(`/auth/forgot-password/reset?phone=${encodeURIComponent(phone)}`);
  };

  const handleResend = async () => {
    setResendLoading(true);
    setError("");
    const result = await sendOTP(phone, "password_reset");
    if (result.error) {
      setError(result.error);
    } else {
      setResendCooldown(60);
    }
    setResendLoading(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
              <Logo className="w-6 h-6 text-dark-900" />
            </div>
            <span className="font-display text-xl font-bold text-white">Kapster</span>
          </Link>
          <h2 className="font-display text-2xl font-bold text-white mb-2">Verifikasi Kode OTP</h2>
          <p className="text-dark-400 text-sm leading-relaxed mb-2">
            Kode OTP dikirim ke <span className="text-barber-400">{phone}</span>
          </p>
          <p className="text-dark-500 text-xs mb-8">Masukkan 6 digit kode yang dikirim via WhatsApp</p>
        </div>

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
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="w-12 h-14 text-center text-xl font-bold rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
            />
          ))}
        </div>

        <button onClick={handleSubmit} disabled={loading}
          className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed mb-4">
          {loading ? "Memverifikasi..." : "Verifikasi"}
        </button>

        <button onClick={handleResend} disabled={resendLoading || resendCooldown > 0}
          className="text-sm text-dark-400 hover:text-barber-400 transition-colors disabled:opacity-50 block w-full mb-4">
          {resendLoading
            ? "Mengirim..."
            : resendCooldown > 0
              ? `Kirim ulang dalam ${resendCooldown} detik`
              : "Tidak menerima kode? Kirim ulang"}
        </button>

        <Link href="/auth/forgot-password"
          className="text-sm text-dark-500 hover:text-barber-400 transition-colors">
          Ganti nomor WhatsApp
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordVerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dark-950" />}>
      <VerifyForm />
    </Suspense>
  );
}
