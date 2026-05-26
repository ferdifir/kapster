"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBarbershopLogo } from "@/app/dashboard/settings/actions";
import Logo from "@/components/Logo";

interface LogoUploaderProps {
  barbershopId: string;
  currentLogoUrl: string | null;
}

export default function LogoUploader({ barbershopId, currentLogoUrl }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, WebP, atau GIF)");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Ukuran file maksimal 2MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.type.split("/")[1];
      const fileName = `logo_${Date.now()}.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;

      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);

      const result = await updateBarbershopLogo(barbershopId, publicUrl);
      if (result.error) throw new Error(result.error);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengupload logo";
      setError(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Logo berhasil diperbarui
        </div>
      )}

      <div className="flex items-center gap-6">
        <label className="relative cursor-pointer group">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-dark-700/50 border-2 border-dark-600/30 flex items-center justify-center group-hover:border-barber-400/50 transition-colors">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Logo barbershop"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Ganti</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-dark-500">
                <Logo className="w-10 h-10" />
                <span className="text-xs">No logo</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <div>
          <p className="text-white font-medium text-sm">Logo Barbershop</p>
          <p className="text-dark-500 text-xs mt-1">
            PNG, JPG, WebP, atau GIF. Maks 2MB.
          </p>
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement;
              input?.click();
            }}
            disabled={uploading}
            className="mt-3 px-4 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-xs disabled:opacity-50"
          >
            {uploading ? "Mengupload..." : previewUrl ? "Ganti Logo" : "Upload Logo"}
          </button>
        </div>
      </div>
    </div>
  );
}
