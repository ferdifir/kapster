"use client";

import { useState, useTransition } from "react";
import { updateBarbershopSettings, updateBarbershopLocation } from "@/app/dashboard/settings/actions";
import MapPicker from "@/components/MapPicker";

type Barbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  wa_number: string | null;
  latitude: number | null;
  longitude: number | null;
};

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
  const [form, setForm] = useState({
    name: barbershop.name,
    address: barbershop.address ?? "",
    city: barbershop.city ?? "",
    phone: barbershop.phone ?? "",
    wa_number: barbershop.wa_number ?? "",
  });
  const [isPending, startTransition] = useTransition();
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setError("");
    setSuccess(false);
    startTransition(async () => {
      const result = await updateBarbershopSettings(barbershop.id, form);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Pengaturan berhasil disimpan
        </div>
      )}

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Informasi Barbershop</h2>

        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Nama Barbershop *</label>
            <input
              type="text"
              required
              value={form.name}
              onChange={set("name")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Slug (URL)</label>
            <input
              type="text"
              value={barbershop.slug}
              disabled
              className="w-full px-4 py-3 rounded-xl bg-dark-700/30 border border-dark-700/30 text-dark-500 text-sm cursor-not-allowed"
            />
            <p className="text-dark-600 text-xs mt-1">Slug tidak dapat diubah</p>
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Alamat</label>
            <input
              type="text"
              placeholder="Jl. Contoh No. 1"
              value={form.address}
              onChange={set("address")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">Kota</label>
            <input
              type="text"
              placeholder="Jakarta"
              value={form.city}
              onChange={set("city")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
        </div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Kontak</h2>
        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">No. Telepon</label>
            <input
              type="text"
              placeholder="0812-xxxx-xxxx"
              value={form.phone}
              onChange={set("phone")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
          </div>
          <div>
            <label className="text-dark-400 text-xs mb-1 block">No. WhatsApp</label>
            <input
              type="text"
              placeholder="6281xxxxxxxx (format internasional)"
              value={form.wa_number}
              onChange={set("wa_number")}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
            <p className="text-dark-600 text-xs mt-1">Digunakan untuk notifikasi WhatsApp ke pelanggan</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Lokasi Barbershop</h2>
        <MapPicker
          latitude={barbershop.latitude ?? null}
          longitude={barbershop.longitude ?? null}
          onLocationChange={async (coords) => {
            setLocationSaving(true);
            setLocationSaved(false);
            const result = await updateBarbershopLocation(barbershop.id, coords.latitude, coords.longitude);
            setLocationSaving(false);
            if (!result.error) {
              setLocationSaved(true);
            }
          }}
        />
        {locationSaving && (
          <p className="text-sm text-dark-400">Menyimpan lokasi...</p>
        )}
        {locationSaved && (
          <p className="text-sm text-green-400">Lokasi berhasil disimpan</p>
        )}
      </div>

      <button
        type="submit"
        disabled={isPending || !form.name.trim()}
        className="w-full py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
      >
        {isPending ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
