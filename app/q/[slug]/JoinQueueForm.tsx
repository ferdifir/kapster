"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinQueue } from "./actions";

interface Props {
  queueId: string;
  slug: string;
  services: { id: string; name: string; price: number }[];
  barbers: { id: string; display_name: string }[];
}

export default function JoinQueueForm({
  queueId,
  slug,
  services,
  barbers,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    service_id: "",
    barber_id: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim()) return;
    setError("");

    startTransition(async () => {
      const result = await joinQueue(queueId, {
        customer_name: form.customer_name,
        phone: form.phone || undefined,
        service_id: form.service_id || undefined,
        barber_id: form.barber_id || undefined,
      });

      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.data) {
        router.push(`/q/${slug}/status/${result.data.id}`);
      }
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4"
    >
      <h2 className="font-semibold text-white">Daftar Antrian</h2>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-dark-400 text-sm mb-1.5">
          Nama <span className="text-barber-400">*</span>
        </label>
        <input
          type="text"
          required
          value={form.customer_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, customer_name: e.target.value }))
          }
          placeholder="Nama lengkap"
          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-dark-400 text-sm mb-1.5">No. HP</label>
        <input
          type="tel"
          value={form.phone}
          onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          placeholder="08xxxxxxxxxx"
          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
        />
      </div>

      {services.length > 0 && (
        <div>
          <label className="block text-dark-400 text-sm mb-1.5">Layanan</label>
          <select
            value={form.service_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, service_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
          >
            <option value="">Pilih layanan...</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — Rp{s.price.toLocaleString("id-ID")}
              </option>
            ))}
          </select>
        </div>
      )}

      {barbers.length > 1 && (
        <div>
          <label className="block text-dark-400 text-sm mb-1.5">
            Pilih Barber
          </label>
          <select
            value={form.barber_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, barber_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white focus:outline-none focus:border-barber-400/50 transition-colors"
          >
            <option value="">Barber manapun</option>
            {barbers.map((b) => (
              <option key={b.id} value={b.id}>
                {b.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !form.customer_name.trim()}
        className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending ? "Mendaftar..." : "Daftar Sekarang"}
      </button>
    </form>
  );
}
