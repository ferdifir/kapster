"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Props {
  token: string;
  barberName: string;
  barbershopName: string;
  isLoggedIn: boolean;
}

export default function InviteClaim({
  token,
  barberName,
  barbershopName,
  isLoggedIn,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"login" | "register">("login");

  const handleClaim = () => {
    setError("");
    startTransition(async () => {
      const supabase = createClient();

      if (!isLoggedIn) {
        const authFn =
          mode === "login"
            ? supabase.auth.signInWithPassword({ email, password })
            : supabase.auth.signUp({ email, password });

        const { error: authError } = await authFn;
        if (authError) {
          setError(authError.message);
          return;
        }
      }

      const { error: rpcError } = await supabase.rpc("claim_barber_invite", {
        p_token: token,
      });

      if (rpcError) {
        setError(rpcError.message);
        return;
      }

      router.push("/barber");
    });
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="font-display text-lg font-bold text-white">
            Queue<span className="text-barber-400">Barber</span>
          </span>
        </div>

        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
          <div>
            <h1 className="font-display text-xl font-bold text-white">Undangan Barber</h1>
            <p className="text-dark-400 text-sm mt-1">
              Anda diundang sebagai{" "}
              <span className="text-barber-400 font-medium">{barberName}</span>
              {barbershopName && (
                <>
                  {" "}
                  di <span className="text-white">{barbershopName}</span>
                </>
              )}
            </p>
          </div>

          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {!isLoggedIn && (
            <div className="space-y-3">
              <div className="flex gap-2 p-1 bg-dark-700/50 rounded-xl">
                {(["login", "register"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      mode === m
                        ? "bg-dark-600 text-white"
                        : "text-dark-400 hover:text-white"
                    }`}
                  >
                    {m === "login" ? "Masuk" : "Daftar"}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
                />
              </div>
            </div>
          )}

          <button
            onClick={handleClaim}
            disabled={isPending || (!isLoggedIn && (!email || !password))}
            className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
          >
            {isPending
              ? "Memproses..."
              : isLoggedIn
                ? "Klaim Undangan"
                : mode === "login"
                  ? "Masuk & Klaim"
                  : "Daftar & Klaim"}
          </button>
        </div>
      </div>
    </div>
  );
}
