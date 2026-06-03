"use client";

import { useEffect, useState } from "react";

export default function AdminAuthGate() {
  const [status, setStatus] = useState<"loading" | "error" | "redirecting">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let attempts = 0;
    const maxAttempts = 10;

    async function verify() {
      try {
        const tg = (window as unknown as Record<string, unknown>).Telegram;
        const initData = (tg as { WebApp?: { initData?: string } } | undefined)?.WebApp?.initData;

        if (!initData) {
          if (attempts < maxAttempts) {
            attempts++;
            setTimeout(verify, 500);
            return;
          }
          setStatus("error");
          const hasTg = !!tg;
          const hasWebApp = !!(tg as { WebApp?: unknown } | undefined)?.WebApp;
          const isTg = typeof (window as unknown as Record<string, unknown>).Telegram;
          setError(
            `Halaman ini hanya bisa dibuka dari Telegram. (tg=${hasTg}, webapp=${hasWebApp}, initData=${typeof initData}, typeof=${isTg})`
          );
          return;
        }

        const res = await fetch("/admin/api/init", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ initData }),
        });

        if (!res.ok) {
          const json = await res.json();
          setStatus("error");
          setError(json.error || "Unauthorized");
          return;
        }

        setStatus("redirecting");
        window.location.reload();
      } catch (err) {
        setStatus("error");
        setError(String(err));
      }
    }

    verify();
  }, []);

  if (status === "loading") {
    return (
      <div className="h-screen bg-dark-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 rounded-xl gold-gradient mx-auto mb-4 animate-pulse" />
          <p className="text-dark-400">Memverifikasi...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="h-screen bg-dark-950 flex items-center justify-center p-8">
        <div className="text-center max-w-md">
          <h1 className="font-display text-2xl font-bold text-white mb-2">Akses Ditolak</h1>
          <p className="text-dark-400">{error}</p>
        </div>
      </div>
    );
  }

  return null;
}
