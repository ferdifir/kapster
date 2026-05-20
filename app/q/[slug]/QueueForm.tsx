"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { joinQueue } from "./actions";
import { validatePhone } from "@/lib/phone";

interface Props {
  barbershopId: string;
  date: string;
  slug: string;
  services: { id: string; name: string; price: number }[];
  barbers: { id: string; display_name: string }[];
  isOpen: boolean;
  selectedDate: string;
  today: string;
}

export default function QueueForm({
  barbershopId,
  date,
  slug,
  services,
  barbers,
  isOpen,
  selectedDate,
  today,
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
    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) {
      setError(phoneCheck.error!);
      return;
    }
    setError("");

    startTransition(async () => {
      const result = await joinQueue(barbershopId, date, {
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

  const isFutureDate = selectedDate > today;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div>
        <label className="block text-dark-400 text-xs font-semibold mb-2">Nama Lengkap *</label>
        <input
          type="text"
          required
          value={form.customer_name}
          onChange={(e) =>
            setForm((f) => ({ ...f, customer_name: e.target.value }))
          }
          placeholder="Masukkan nama Anda"
          className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
        />
      </div>

      <div>
        <label className="block text-dark-400 text-xs font-semibold mb-2">Nomor WhatsApp *</label>
        <div className="relative">
          <span className="absolute left-4 top-3 text-sm text-dark-500">+62</span>
          <input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            placeholder="8xxxxxxxxxx"
            className="w-full pl-14 pr-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 transition-colors"
          />
        </div>
      </div>

      {services.length > 0 && (
        <div>
          <label className="block text-dark-400 text-xs font-semibold mb-2">Pilih Layanan</label>
          <select
            value={form.service_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, service_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors appearance-none"
          >
            <option value="">-- Pilih Layanan Barbershop --</option>
            {services.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} (Rp{s.price.toLocaleString("id-ID")})
              </option>
            ))}
          </select>
        </div>
      )}

      {barbers.length > 1 && (
        <div>
          <label className="block text-dark-400 text-xs font-semibold mb-2">Pilih Barber</label>
          <select
            value={form.barber_id}
            onChange={(e) =>
              setForm((f) => ({ ...f, barber_id: e.target.value }))
            }
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50 transition-colors appearance-none"
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
        className="w-full py-3.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2"
      >
        {isPending
          ? "Mendaftar..."
          : isFutureDate
          ? "Booking Sekarang"
          : isOpen
          ? "Daftar Sekarang"
          : "Booking Sekarang"}
      </button>
    </form>
  );
}
