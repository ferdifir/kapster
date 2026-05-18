"use client";

import { useState, useTransition } from "react";
import {
  addBarber,
  toggleBarberActive,
  deleteBarber,
  regenerateInviteToken,
} from "@/app/dashboard/barbers/actions";

type Barber = {
  id: string;
  display_name: string;
  is_active: boolean;
  invite_token: string | null;
  profile_id: string | null;
  created_at: string;
};

interface Props {
  barbershop: { id: string; name: string; slug: string };
  barbers: Barber[];
  maxBarbers: number;
}

export default function BarbersManager({ barbershop, barbers: initial, maxBarbers }: Props) {
  const [barbers, setBarbers] = useState<Barber[]>(initial);
  const [name, setName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  const handleAdd = () => {
    if (!name.trim()) return;
    setError("");
    startTransition(async () => {
      const result = await addBarber(barbershop.id, name);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        setBarbers((prev) => [
          ...prev,
          {
            id: result.data!.id,
            display_name: name.trim(),
            is_active: true,
            invite_token: result.data!.invite_token,
            profile_id: null,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      setName("");
      setShowForm(false);
    });
  };

  const handleToggle = (barberId: string, current: boolean) => {
    startTransition(async () => {
      const result = await toggleBarberActive(barberId, !current);
      if (!result.error) {
        setBarbers((prev) =>
          prev.map((b) => (b.id === barberId ? { ...b, is_active: !current } : b))
        );
      }
    });
  };

  const handleDelete = (barberId: string) => {
    startTransition(async () => {
      const result = await deleteBarber(barberId);
      if (!result.error) {
        setBarbers((prev) => prev.filter((b) => b.id !== barberId));
      }
    });
  };

  const handleRegenToken = (barberId: string) => {
    startTransition(async () => {
      const result = await regenerateInviteToken(barberId);
      if (result.data) {
        setBarbers((prev) =>
          prev.map((b) =>
            b.id === barberId ? { ...b, invite_token: result.data!.invite_token } : b
          )
        );
      }
    });
  };

  const copyInvite = (token: string | null) => {
    if (!token) return;
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || window.location.origin}/barber/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const atLimit = barbers.length >= maxBarbers;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Barber</h1>
          <p className="text-dark-400 text-sm">
            {barbers.length} / {maxBarbers} barber
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            disabled={atLimit}
            className="px-4 py-2 rounded-xl gold-gradient text-dark-900 text-sm font-bold disabled:opacity-40"
            title={atLimit ? `Batas plan: ${maxBarbers} barber` : ""}
          >
            + Tambah Barber
          </button>
        )}
      </div>

      {atLimit && (
        <div className="px-4 py-3 rounded-xl bg-barber-400/10 border border-barber-400/20 text-barber-400 text-sm">
          Batas barber plan Anda ({maxBarbers}) sudah tercapai. Upgrade untuk menambah lebih banyak.
        </div>
      )}

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 space-y-3">
          <p className="text-white font-medium text-sm">Barber Baru</p>
          <input
            type="text"
            placeholder="Nama barber"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            autoFocus
          />
          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              disabled={isPending || !name.trim()}
              className="flex-1 py-2.5 rounded-xl gold-gradient text-dark-900 text-sm font-bold disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : "Simpan"}
            </button>
            <button
              onClick={() => { setShowForm(false); setName(""); }}
              className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {barbers.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Belum ada barber. Tambahkan barber pertama Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {barbers.map((barber) => (
            <div
              key={barber.id}
              className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-barber-400/10 border border-barber-400/20 flex items-center justify-center shrink-0">
                  <span className="text-barber-400 font-bold text-sm">
                    {barber.display_name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium text-sm">{barber.display_name}</p>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        barber.is_active
                          ? "bg-green-500/10 text-green-400"
                          : "bg-dark-700/50 text-dark-500"
                      }`}
                    >
                      {barber.is_active ? "Aktif" : "Nonaktif"}
                    </span>
                    {barber.profile_id && (
                      <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/10 text-blue-400">
                        Terhubung
                      </span>
                    )}
                  </div>
                  {!barber.profile_id && barber.invite_token && (
                    <div className="flex items-center gap-2 mt-2">
                      <p className="text-dark-500 text-xs truncate max-w-[200px]">
                        {`${window?.location?.origin ?? ""}/barber/invite/${barber.invite_token}`}
                      </p>
                      <button
                        onClick={() => copyInvite(barber.invite_token)}
                        className="shrink-0 text-xs text-barber-400 hover:text-barber-300 transition-colors"
                      >
                        {copied === barber.invite_token ? "Tersalin!" : "Salin"}
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => handleToggle(barber.id, barber.is_active)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors text-xs"
                  >
                    {barber.is_active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                  {!barber.profile_id && (
                    <button
                      onClick={() => handleRegenToken(barber.id)}
                      disabled={isPending}
                      className="p-2 rounded-lg text-dark-400 hover:text-barber-400 hover:bg-barber-400/10 transition-colors"
                      title="Buat ulang link undangan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(barber.id)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
