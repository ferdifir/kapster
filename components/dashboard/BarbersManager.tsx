"use client";

import { useState, useTransition } from "react";
import {
  addBarber,
  toggleBarberActive,
  deleteBarber,
  regenerateInviteToken,
  sendInviteViaWhatsApp,
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
  const [success, setSuccess] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [waModal, setWaModal] = useState<{ barberId: string; name: string } | null>(null);
  const [waPhone, setWaPhone] = useState("");
  const [waSending, setWaSending] = useState(false);

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

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://kapster.my.id";

  const copyInvite = (token: string | null) => {
    if (!token) return;
    const url = `${baseUrl}/barber/invite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(token);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const openWaModal = (barberId: string, barberName: string) => {
    setWaModal({ barberId, name: barberName });
    setWaPhone("");
    setError("");
  };

  const handleSendWa = () => {
    if (!waModal || !waPhone.trim()) return;
    setWaSending(true);
    setError("");

    sendInviteViaWhatsApp(barbershop.id, waModal.barberId, waModal.name, waPhone.trim())
      .then((result) => {
        setWaSending(false);
        if (result.error) {
          setError(result.error);
        } else {
          setSuccess(`Undangan berhasil dikirim ke ${waModal.name} via WhatsApp`);
          setTimeout(() => setSuccess(""), 4000);
          setWaModal(null);
          setWaPhone("");
        }
      })
      .catch(() => {
        setWaSending(false);
        setError("Terjadi kesalahan saat mengirim pesan");
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
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {success}
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
                        {`${baseUrl}/barber/invite/${barber.invite_token}`}
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
                  {!barber.profile_id && (
                    <button
                      onClick={() => openWaModal(barber.id, barber.display_name)}
                      disabled={isPending}
                      className="p-2 rounded-lg text-green-400 hover:text-green-300 hover:bg-green-500/10 transition-colors"
                      title="Kirim undangan via WhatsApp"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                    </button>
                  )}
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

      {/* WhatsApp Modal */}
      {waModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setWaModal(null)}>
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl p-6 w-full max-w-sm space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm">Kirim Undangan via WhatsApp</h3>
                <p className="text-dark-400 text-xs">Ke: {waModal.name}</p>
              </div>
            </div>

            <div>
              <label className="text-dark-400 text-xs mb-1.5 block">Nomor WhatsApp</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-sm text-dark-500">+62</span>
                <input
                  type="tel"
                  placeholder="8xxxxxxxxxx"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendWa()}
                  className="w-full pl-14 pr-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-green-400/50"
                  autoFocus
                />
              </div>
              <p className="text-dark-600 text-xs mt-1">Format: 8xxxxxxxxxx, 08xx, 628xx, atau +628xx</p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSendWa}
                disabled={waSending || !waPhone.trim()}
                className="flex-1 py-2.5 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-bold hover:bg-green-500/20 disabled:opacity-50 transition-colors"
              >
                {waSending ? "Mengirim..." : "Kirim"}
              </button>
              <button
                onClick={() => { setWaModal(null); setWaPhone(""); }}
                className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
