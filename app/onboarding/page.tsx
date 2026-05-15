"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Logo from "@/components/Logo";

const DEFAULT_SERVICES = [
  { name: "Potong Rambut", price: 30000, duration_min: 30 },
  { name: "Cukur Jenggot", price: 20000, duration_min: 20 },
  { name: "Potong + Jenggot", price: 45000, duration_min: 45 },
];

const slugify = (str: string) =>
  str
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createClient();

  const [step, setStep] = useState<1 | 2>(1);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    city: "",
    address: "",
    phone: "",
    wa_number: "",
  });
  const [slugEdited, setSlugEdited] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setForm((prev) => ({
      ...prev,
      name,
      slug: slugEdited ? prev.slug : slugify(name),
    }));
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSlugEdited(true);
    setForm((prev) => ({ ...prev, slug: slugify(e.target.value) }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) { router.push("/auth/login"); return; }

    const { data: shop, error: shopError } = await supabase
      .from("barbershops")
      .insert({
        owner_id: user.id,
        name: form.name,
        slug: form.slug,
        city: form.city || null,
        address: form.address || null,
        phone: form.phone || null,
        wa_number: form.wa_number || null,
      })
      .select("id")
      .single();

    if (shopError) {
      setError(
        shopError.code === "23505"
          ? "Slug sudah dipakai barbershop lain. Ganti slug-nya."
          : shopError.message
      );
      setLoading(false);
      return;
    }

    await supabase.from("services").insert(
      DEFAULT_SERVICES.map((s) => ({ ...s, barbershop_id: shop.id }))
    );

    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl gold-gradient flex items-center justify-center mx-auto mb-4">
            <Logo className="w-7 h-7 text-dark-900" />
          </div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">
            Setup Barbershop
          </h1>
          <p className="text-dark-400 text-sm">
            Langkah {step} dari 2 — selesai dalam 2 menit
          </p>
        </div>

        {/* Progress */}
        <div className="flex gap-2 mb-8">
          {[1, 2].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full transition-colors ${
                s <= step ? "gold-gradient" : "bg-dark-700"
              }`}
            />
          ))}
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 space-y-5"
        >
          {error && (
            <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          {step === 1 && (
            <>
              <h2 className="font-semibold text-white text-lg">Info Barbershop</h2>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Nama Barbershop <span className="text-barber-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={handleNameChange}
                  required
                  placeholder="Gentlemen's Barbershop"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  URL Antrian (slug) <span className="text-barber-400">*</span>
                </label>
                <div className="flex items-center rounded-xl overflow-hidden border border-dark-600/50 focus-within:border-barber-400/50 transition-colors">
                  <span className="px-3 py-3 bg-dark-700/80 text-dark-400 text-sm border-r border-dark-600/50 whitespace-nowrap">
                    queuebarber.id/q/
                  </span>
                  <input
                    type="text"
                    value={form.slug}
                    onChange={handleSlugChange}
                    required
                    placeholder="gentlemens-barbershop"
                    className="flex-1 px-3 py-3 bg-dark-700/50 text-white placeholder-dark-500 focus:outline-none"
                  />
                </div>
                <p className="text-dark-500 text-xs mt-1">
                  Hanya huruf kecil, angka, dan tanda hubung.
                </p>
              </div>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Kota
                </label>
                <input
                  type="text"
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Jakarta"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                />
              </div>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Alamat Lengkap
                </label>
                <input
                  type="text"
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Jl. Sudirman No. 10"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <h2 className="font-semibold text-white text-lg">Info Kontak</h2>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Nomor WhatsApp
                </label>
                <div className="flex items-center rounded-xl overflow-hidden border border-dark-600/50 focus-within:border-barber-400/50 transition-colors">
                  <span className="px-3 py-3 bg-dark-700/80 text-dark-400 text-sm border-r border-dark-600/50">
                    +62
                  </span>
                  <input
                    type="tel"
                    name="wa_number"
                    value={form.wa_number}
                    onChange={handleChange}
                    placeholder="812 3456 7890"
                    className="flex-1 px-3 py-3 bg-dark-700/50 text-white placeholder-dark-500 focus:outline-none"
                  />
                </div>
                <p className="text-dark-500 text-xs mt-1">
                  Untuk notifikasi otomatis ke pelanggan.
                </p>
              </div>

              <div>
                <label className="block text-dark-300 text-sm font-medium mb-2">
                  Nomor Telepon
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="021-1234567"
                  className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors"
                />
              </div>

              <div className="p-4 rounded-xl bg-barber-400/5 border border-barber-400/15">
                <p className="text-dark-300 text-sm font-medium mb-2">
                  Layanan default yang akan ditambahkan:
                </p>
                <ul className="space-y-1">
                  {DEFAULT_SERVICES.map((s) => (
                    <li key={s.name} className="text-dark-400 text-sm flex justify-between">
                      <span>{s.name}</span>
                      <span className="text-barber-400">
                        Rp{s.price.toLocaleString("id-ID")}
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="text-dark-500 text-xs mt-2">
                  Bisa diubah di dashboard nanti.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex-1 py-3 rounded-xl border border-dark-600 text-dark-200 hover:border-barber-400/50 hover:text-barber-400 transition-colors font-semibold"
              >
                Kembali
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 rounded-xl gold-gradient text-dark-900 font-bold transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading
                ? "Menyimpan..."
                : step === 1
                  ? "Lanjut"
                  : "Selesai & Masuk Dashboard"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
