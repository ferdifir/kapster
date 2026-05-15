"use client";

import { useState, useTransition } from "react";
import {
  addService,
  updateService,
  toggleServiceActive,
  deleteService,
} from "@/app/dashboard/services/actions";

type Service = {
  id: string;
  name: string;
  price: number;
  duration_min: number;
  is_active: boolean;
  created_at: string;
};

interface Props {
  barbershop: { id: string; name: string };
  services: Service[];
}

const EMPTY_FORM = { name: "", price: "", duration_min: "30" };

function fmt(price: number) {
  return `Rp${price.toLocaleString("id-ID")}`;
}

export default function ServicesManager({ barbershop, services: initial }: Props) {
  const [services, setServices] = useState<Service[]>(initial);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setEditId(null);
    setShowForm(false);
    setError("");
  };

  const startEdit = (s: Service) => {
    setForm({
      name: s.name,
      price: String(s.price),
      duration_min: String(s.duration_min),
    });
    setEditId(s.id);
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name.trim(),
      price: parseInt(form.price) || 0,
      duration_min: parseInt(form.duration_min) || 30,
    };
    if (!payload.name) return;

    setError("");
    startTransition(async () => {
      if (editId) {
        const result = await updateService(editId, payload);
        if (result.error) { setError(result.error); return; }
        setServices((prev) =>
          prev.map((s) => (s.id === editId ? { ...s, ...payload } : s))
        );
      } else {
        const result = await addService(barbershop.id, payload);
        if (result.error) { setError(result.error); return; }
        setServices((prev) => [
          ...prev,
          {
            id: crypto.randomUUID(),
            ...payload,
            is_active: true,
            created_at: new Date().toISOString(),
          },
        ]);
      }
      resetForm();
    });
  };

  const handleToggle = (serviceId: string, current: boolean) => {
    startTransition(async () => {
      const result = await toggleServiceActive(serviceId, !current);
      if (!result.error) {
        setServices((prev) =>
          prev.map((s) => (s.id === serviceId ? { ...s, is_active: !current } : s))
        );
      }
    });
  };

  const handleDelete = (serviceId: string) => {
    startTransition(async () => {
      const result = await deleteService(serviceId);
      if (!result.error) {
        setServices((prev) => prev.filter((s) => s.id !== serviceId));
      }
    });
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Layanan</h1>
          <p className="text-dark-400 text-sm">{services.length} layanan terdaftar</p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="px-4 py-2 rounded-xl gold-gradient text-dark-900 text-sm font-bold"
          >
            + Tambah Layanan
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {showForm && (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4 space-y-3">
          <p className="text-white font-medium text-sm">
            {editId ? "Edit Layanan" : "Layanan Baru"}
          </p>
          <input
            type="text"
            placeholder="Nama layanan (mis. Potong Rambut)"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            autoFocus
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-dark-500 text-xs mb-1 block">Harga (Rp)</label>
              <input
                type="number"
                placeholder="25000"
                min="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
              />
            </div>
            <div>
              <label className="text-dark-500 text-xs mb-1 block">Durasi (menit)</label>
              <input
                type="number"
                placeholder="30"
                min="5"
                max="240"
                value={form.duration_min}
                onChange={(e) => setForm((f) => ({ ...f, duration_min: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={isPending || !form.name.trim()}
              className="flex-1 py-2.5 rounded-xl gold-gradient text-dark-900 text-sm font-bold disabled:opacity-50"
            >
              {isPending ? "Menyimpan..." : editId ? "Update" : "Simpan"}
            </button>
            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl bg-dark-700/50 text-dark-400 text-sm hover:bg-dark-700 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-12 text-center">
          <p className="text-dark-400">Belum ada layanan. Tambahkan layanan pertama Anda.</p>
        </div>
      ) : (
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          <div className="divide-y divide-dark-700/30">
            {services.map((service) => (
              <div key={service.id} className="flex items-center gap-3 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-medium ${service.is_active ? "text-white" : "text-dark-500"}`}>
                      {service.name}
                    </p>
                    {!service.is_active && (
                      <span className="text-xs text-dark-600">(nonaktif)</span>
                    )}
                  </div>
                  <p className="text-dark-400 text-xs mt-0.5">
                    {fmt(service.price)} · {service.duration_min} menit
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(service)}
                    className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleToggle(service.id, service.is_active)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-dark-400 hover:text-white hover:bg-dark-700/50 transition-colors text-xs"
                    title={service.is_active ? "Nonaktifkan" : "Aktifkan"}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={service.is_active ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
                    disabled={isPending}
                    className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
