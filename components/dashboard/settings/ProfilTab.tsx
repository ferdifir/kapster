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
      {/* Logo */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Logo Barbershop</h2>
        <LogoUploader
          barbershopId={barbershop.id}
          currentLogoUrl={barbershop.logo_url}
        />
      </div>

      {/* Cover Image */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Cover Image</h2>
        <CoverImageUploader
          barbershopId={barbershop.id}
          currentCoverUrl={barbershop.cover_image_url}
        />
      </div>

      {/* Gallery */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Galeri Barbershop</h2>
        <GalleryManager
          barbershopId={barbershop.id}
          currentImages={galleryImages}
        />
      </div>

      {/* About */}
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
            <span className="text-dark-500 text-xs">
              {about.length}/500 karakter
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
