# Settings Tab Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor monolithic SettingsForm.tsx into tab-based layout with 4 extract tab components.

**Architecture:** SettingsForm.tsx becomes a shell with tab bar state + conditional rendering of tab components. Each tab manages its own state, actions, error/success messages. Tab bar follows FeedbackTabs.tsx pattern.

**Tech Stack:** Next.js client component, Tailwind CSS v4, Lucide React icons

---

### Task 1: Create ProfilTab.tsx

**Files:**
- Create: `components/dashboard/settings/ProfilTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import LogoUploader from "@/components/dashboard/LogoUploader";
import CoverImageUploader from "@/components/dashboard/CoverImageUploader";
import GalleryManager from "@/components/dashboard/GalleryManager";
import { updateBarbershopAbout } from "@/app/dashboard/settings/actions";

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
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function ProfilTab({ barbershop }: { barbershop: Barbershop }) {
  const [about, setAbout] = useState(barbershop.about ?? "");
  const [aboutSuccess, setAboutSuccess] = useState(false);
  const [aboutError, setAboutError] = useState("");

  const galleryImages = ((barbershop.settings_json as Record<string, unknown>)?.gallery_images as string[]) ?? [];

  const handleAboutSave = () => {
    if (!about.trim()) return;
    setAboutSuccess(false);
    setAboutError("");
    updateBarbershopAbout(barbershop.id, about)
      .then((result) => {
        if (result.error) {
          setAboutError(result.error);
        } else {
          setAboutSuccess(true);
          setTimeout(() => setAboutSuccess(false), 3000);
        }
      })
      .catch(() => {
        setAboutError("Terjadi kesalahan");
      });
  };

  return (
    <div className="space-y-6">
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Logo Barbershop</h2>
        <LogoUploader barbershopId={barbershop.id} currentLogoUrl={barbershop.logo_url} />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Cover Image</h2>
        <CoverImageUploader barbershopId={barbershop.id} currentCoverUrl={barbershop.cover_image_url} />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Galeri Barbershop</h2>
        <GalleryManager barbershopId={barbershop.id} currentImages={galleryImages} />
      </div>

      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Tentang Barbershop</h2>

        {aboutError && (
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {aboutError}
          </div>
        )}
        {aboutSuccess && (
          <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            Deskripsi berhasil disimpan
          </div>
        )}

        <div className="space-y-3">
          <textarea
            rows={4}
            placeholder="Ceritakan tentang barbershop Anda, layanan yang ditawarkan, dll."
            value={about}
            onChange={(e) => {
              setAbout(e.target.value);
              setAboutSuccess(false);
              setAboutError("");
            }}
            className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50 resize-none"
          />
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleAboutSave}
              className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm"
            >
              Simpan Deskripsi
            </button>
            <span className="text-dark-500 text-xs">{about.length}/500 karakter</span>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### Task 2: Create InformasiTab.tsx

**Files:**
- Create: `components/dashboard/settings/InformasiTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useTransition } from "react";
import { updateBarbershopSettings, updateBookingMaxDays } from "@/app/dashboard/settings/actions";

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
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function InformasiTab({ barbershop }: { barbershop: Barbershop }) {
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

  const [bookingMaxDays, setBookingMaxDays] = useState(
    String((barbershop.settings_json as Record<string, unknown>)?.booking_max_days ?? 7)
  );
  const [bookingDaysPending, setBookingDaysPending] = useState(false);
  const [bookingDaysSuccess, setBookingDaysSuccess] = useState(false);
  const [bookingDaysError, setBookingDaysError] = useState("");

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

  const handleBookingMaxDaysSave = () => {
    const val = parseInt(bookingMaxDays, 10);
    if (isNaN(val) || val < 1 || val > 365) return;
    setBookingDaysError("");
    setBookingDaysSuccess(false);
    setBookingDaysPending(true);
    updateBookingMaxDays(barbershop.id, val)
      .then((result) => {
        setBookingDaysPending(false);
        if (result.error) {
          setBookingDaysError(result.error);
        } else {
          setBookingDaysSuccess(true);
          setTimeout(() => setBookingDaysSuccess(false), 3000);
        }
      })
      .catch(() => {
        setBookingDaysPending(false);
        setBookingDaysError("Terjadi kesalahan");
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
        <h2 className="font-semibold text-white">Pengaturan Antrian</h2>
        <div className="space-y-3">
          <div>
            <label className="text-dark-400 text-xs mb-1 block">
              Batas Hari Booking ke Depan
            </label>
            <input
              type="number"
              min={1}
              max={365}
              value={bookingMaxDays}
              onChange={(e) => {
                setBookingMaxDays(e.target.value);
                setBookingDaysSuccess(false);
                setBookingDaysError("");
              }}
              className="w-full px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white placeholder-dark-500 text-sm focus:outline-none focus:border-barber-400/50"
            />
            <p className="text-dark-600 text-xs mt-1">
              Customer bisa booking antrian hingga {bookingMaxDays} hari ke depan. Default: 7 hari.
            </p>
          </div>
          {bookingDaysError && (
            <p className="text-sm text-red-400">{bookingDaysError}</p>
          )}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleBookingMaxDaysSave}
              disabled={bookingDaysPending}
              className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
            >
              {bookingDaysPending ? "Menyimpan..." : "Simpan"}
            </button>
            {bookingDaysSuccess && (
              <span className="text-green-400 text-sm">Berhasil disimpan</span>
            )}
          </div>
        </div>
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
```

### Task 3: Create LokasiTab.tsx

**Files:**
- Create: `components/dashboard/settings/LokasiTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { updateBarbershopLocation } from "@/app/dashboard/settings/actions";

const MapPicker = dynamic(() => import("@/components/MapPicker"), { ssr: false });

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
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function LokasiTab({ barbershop }: { barbershop: Barbershop }) {
  const [locationSaved, setLocationSaved] = useState(false);
  const [locationSaving, setLocationSaving] = useState(false);
  const [locationError, setLocationError] = useState("");

  return (
    <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
      <h2 className="font-semibold text-white">Lokasi Barbershop</h2>
      <MapPicker
        latitude={barbershop.latitude}
        longitude={barbershop.longitude}
        onLocationChange={(coords) => {
          setLocationError("");
          setLocationSaved(false);
          setLocationSaving(true);
          updateBarbershopLocation(barbershop.id, coords.latitude, coords.longitude).then((result) => {
            setLocationSaving(false);
            if (result.error) {
              setLocationError(result.error);
            } else {
              setLocationSaved(true);
              setTimeout(() => setLocationSaved(false), 3000);
            }
          });
        }}
      />
      {locationSaving && (
        <p className="text-sm text-dark-400">Menyimpan lokasi...</p>
      )}
      {locationError && (
        <p className="text-sm text-red-400">{locationError}</p>
      )}
      {locationSaved && (
        <p className="text-sm text-green-400">Lokasi berhasil disimpan</p>
      )}
    </div>
  );
}
```

### Task 4: Create WhatsAppTab.tsx

**Files:**
- Create: `components/dashboard/settings/WhatsAppTab.tsx`

- [ ] **Step 1: Write the component**

```tsx
"use client";

import { useState, useEffect, useRef } from "react";
import {
  connectWhatsApp,
  getWhatsAppQr,
  checkWhatsAppStatus,
  disconnectWhatsApp,
} from "@/app/dashboard/settings/wa-connect/actions";

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
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

export default function WhatsAppTab({ barbershop }: { barbershop: Barbershop }) {
  const [waDisclaimerAccepted, setWaDisclaimerAccepted] = useState(false);
  const [waConnecting, setWaConnecting] = useState(false);
  const [waQrCode, setWaQrCode] = useState<string | null>(null);
  const [waStatus, setWaStatus] = useState<{
    connected: boolean;
    loggedIn: boolean;
  } | null>(null);
  const [waError, setWaError] = useState("");
  const [waSuccess, setWaSuccess] = useState("");
  const qrPollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (waQrCode) {
      qrPollRef.current = setInterval(async () => {
        const result = await checkWhatsAppStatus(barbershop.id);
        if (result.loggedIn) {
          setWaQrCode(null);
          setWaStatus({ connected: true, loggedIn: true });
          setWaSuccess("WhatsApp berhasil terhubung!");
          if (qrPollRef.current) clearInterval(qrPollRef.current);
        }
      }, 3000);
    }
    return () => {
      if (qrPollRef.current) clearInterval(qrPollRef.current);
    };
  }, [waQrCode, barbershop.id]);

  const handleWaConnect = async () => {
    setWaError("");
    setWaSuccess("");
    setWaConnecting(true);
    const result = await connectWhatsApp(barbershop.id);
    setWaConnecting(false);
    if (result.error) {
      setWaError(result.error);
      return;
    }
    if (result.needsQr) {
      const qrResult = await getWhatsAppQr(barbershop.id);
      if (qrResult.error) {
        setWaError(qrResult.error);
      } else if (qrResult.qr) {
        setWaQrCode(qrResult.qr);
      }
    } else {
      setWaSuccess("WhatsApp berhasil terhubung!");
      const statusResult = await checkWhatsAppStatus(barbershop.id);
      if (!statusResult.error) {
        setWaStatus({ connected: statusResult.connected ?? false, loggedIn: statusResult.loggedIn ?? false });
      }
    }
  };

  const handleWaDisconnect = async () => {
    setWaError("");
    setWaSuccess("");
    const result = await disconnectWhatsApp(barbershop.id);
    if (result.error) {
      setWaError(result.error);
    } else {
      setWaStatus(null);
      setWaQrCode(null);
      setWaSuccess("WhatsApp berhasil disconnect.");
    }
  };

  return (
    <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
      <h2 className="font-semibold text-white">WhatsApp Notification</h2>

      {waError && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {waError}
        </div>
      )}
      {waSuccess && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          {waSuccess}
        </div>
      )}

      {barbershop.wa_connected ? (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-green-400 text-sm font-medium">
              Terhubung: {barbershop.wa_phone_number}
            </span>
          </div>
          <button
            type="button"
            onClick={handleWaDisconnect}
            className="px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm hover:bg-red-500/20"
          >
            Disconnect WhatsApp
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
            <p className="text-amber-300 text-sm font-medium mb-2">⚠️ Peringatan</p>
            <p className="text-amber-300/80 text-xs leading-relaxed">
              Fitur ini menggunakan WhatsApp API tidak resmi (unofficial). Resiko pemblokiran
              nomor WhatsApp ditanggung oleh pemilik barbershop. Kami tidak bertanggung jawab
              atas nomor yang diblokir oleh WhatsApp. Gunakan dengan bijak dan hindari
              pengiriman pesan spam.
            </p>
            <label className="flex items-center gap-2 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={waDisclaimerAccepted}
                onChange={(e) => setWaDisclaimerAccepted(e.target.checked)}
                className="rounded border-dark-600 bg-dark-700 text-barber-400"
              />
              <span className="text-amber-300/80 text-xs">
                Saya memahami resiko dan ingin melanjutkan
              </span>
            </label>
          </div>

          {waQrCode && (
            <div className="space-y-3 text-center">
              <p className="text-dark-400 text-sm">
                Scan QR code ini dengan WhatsApp di HP Anda:
              </p>
              <div className="inline-block p-4 bg-white rounded-xl">
                <img src={waQrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
              </div>
              <p className="text-dark-500 text-xs">
                Menunggu scan... (akan otomatis terdeteksi)
              </p>
            </div>
          )}

          {!waQrCode && (
            <button
              type="button"
              onClick={handleWaConnect}
              disabled={waConnecting || !waDisclaimerAccepted}
              className="px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
            >
              {waConnecting ? "Menghubungkan..." : "Connect WhatsApp"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
```

### Task 5: Refactor SettingsForm.tsx

**Files:**
- Modify: `components/dashboard/SettingsForm.tsx`

- [ ] **Step 1: Rewrite with tab bar + import tab components**

```tsx
"use client";

import { useState } from "react";
import { User, Info, MapPin, MessageCircle } from "lucide-react";
import ProfilTab from "@/components/dashboard/settings/ProfilTab";
import InformasiTab from "@/components/dashboard/settings/InformasiTab";
import LokasiTab from "@/components/dashboard/settings/LokasiTab";
import WhatsAppTab from "@/components/dashboard/settings/WhatsAppTab";

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
  settings_json: unknown;
  logo_url: string | null;
  cover_image_url: string | null;
  about: string | null;
  wuzapi_user_id: string | null;
  wuzapi_token: string | null;
  wa_connected: boolean;
  wa_phone_number: string | null;
};

type Tab = "profil" | "informasi" | "lokasi" | "whatsapp";

const tabs: { key: Tab; label: string; icon: React.ReactNode }[] = [
  { key: "profil", label: "Profil", icon: <User size={16} /> },
  { key: "informasi", label: "Informasi", icon: <Info size={16} /> },
  { key: "lokasi", label: "Lokasi", icon: <MapPin size={16} /> },
  { key: "whatsapp", label: "WhatsApp", icon: <MessageCircle size={16} /> },
];

export default function SettingsForm({ barbershop }: { barbershop: Barbershop }) {
  const [activeTab, setActiveTab] = useState<Tab>("profil");

  return (
    <div className="space-y-6">
      <div className="flex gap-1 p-1 bg-dark-800/50 rounded-xl border border-dark-700/30 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.key
                ? "bg-barber-400/10 text-barber-400"
                : "text-dark-400 hover:text-dark-200"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "profil" && <ProfilTab barbershop={barbershop} />}
      {activeTab === "informasi" && <InformasiTab barbershop={barbershop} />}
      {activeTab === "lokasi" && <LokasiTab barbershop={barbershop} />}
      {activeTab === "whatsapp" && <WhatsAppTab barbershop={barbershop} />}
    </div>
  );
}
```

---

## Self-Review

1. **Spec coverage:** Every spec requirement is covered — 4 tabs (Profil, Informasi, Lokasi, WhatsApp), each with correct content, save behavior per tab consistent with design doc.
2. **No placeholders:** All code is complete and exact.
3. **Type consistency:** All 4 tab components use the same `Barbershop` type, same property names.
4. **Edge cases covered:** Empty about value, invalid booking max days, wa disclaimer not checked.
