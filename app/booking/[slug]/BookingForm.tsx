"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBooking } from "./actions";
import { validatePhone } from "@/lib/phone";

interface Props {
  barbershopId: string;
  slug: string;
  barbers: { id: string; display_name: string }[];
  services: { id: string; name: string; price: number; duration_min: number }[];
}

function fmt(price: number) {
  return `Rp${price.toLocaleString("id-ID")}`;
}

function minDatetime() {
  const d = new Date();
  d.setMinutes(d.getMinutes() + 60);
  d.setSeconds(0);
  d.setMilliseconds(0);
  return d.toISOString().slice(0, 16);
}

export default function BookingForm({ barbershopId, slug, barbers, services }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    barber_id: "",
    service_id: "",
    scheduled_at: "",
    notes: "",
  });

  const set = (key: keyof typeof form) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customer_name.trim() || !form.phone.trim() || !form.scheduled_at) return;
    const phoneCheck = validatePhone(form.phone);
    if (!phoneCheck.valid) {
      setError(phoneCheck.error!);
      return;
    }
    setError("");
    startTransition(async () => {
      const result = await createBooking(barbershopId, {
        customer_name: form.customer_name,
        phone: form.phone,
        barber_id: form.barber_id || undefined,
        service_id: form.service_id || undefined,
        scheduled_at: new Date(form.scheduled_at).toISOString(),
        notes: form.notes || undefined,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/booking/${slug}/success`);
    });
  };

  const selectedService = services.find((s) => s.id === form.service_id);

  return (
    <form onSubmit={handleSubmit} className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-5 space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className="text-dark-400 text-xs mb-1 block">Nama Lengkap *</label>
          <input
            type="text"
            required
            placeholder="Nama Anda"
            value={form.customer_name}
            onChange={set("customer_name")}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
          />
        </div>
        <div>
          <label className="text-dark-400 text-xs mb-1 block">No. WhatsApp *</label>
          <input
            type="tel"
            required
            placeholder="0812-xxxx-xxxx"
            value={form.phone}
            onChange={set("phone")}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
          />
        </div>
        <div>
          <label className="text-dark-400 text-xs mb-1 block">Jadwal *</label>
          <input
            type="datetime-local"
            required
            min={minDatetime()}
            value={form.scheduled_at}
            onChange={set("scheduled_at")}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50"
          />
        </div>
        {services.length > 0 && (
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Layanan</label>
            <select
              value={form.service_id}
              onChange={set("service_id")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50"
            >
              <option value="">Pilih layanan (opsional)</option>
              {services.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} — {fmt(s.price)} ({s.duration_min} mnt)
                </option>
              ))}
            </select>
          </div>
        )}
        {barbers.length > 1 && (
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Barber</label>
            <select
              value={form.barber_id}
              onChange={set("barber_id")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50"
            >
              <option value="">Barber mana saja</option>
              {barbers.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.display_name}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="text-dark-400 text-xs mb-1 block">Catatan</label>
          <textarea
            placeholder="Permintaan khusus (opsional)"
            value={form.notes}
            onChange={set("notes")}
            rows={2}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 resize-none"
          />
        </div>
      </div>

      {selectedService && (
        <div className="px-4 py-3 rounded-xl bg-barber-400/5 border border-barber-400/20 text-sm">
          <p className="text-dark-300">
            {selectedService.name} ·{" "}
            <span className="text-barber-400 font-semibold">{fmt(selectedService.price)}</span>
          </p>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || !form.customer_name.trim() || !form.phone.trim() || !form.scheduled_at}
        className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
      >
        {isPending ? "Memproses..." : "Buat Reservasi"}
      </button>
    </form>
  );
}
