"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBarbershopCoverImage } from "@/app/dashboard/settings/actions";

interface CoverImageUploaderProps {
  barbershopId: string;
  currentCoverUrl: string | null;
}

export default function CoverImageUploader({ barbershopId, currentCoverUrl }: CoverImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentCoverUrl);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, atau WebP)");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Ukuran file maksimal 5MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.type.split("/")[1];
      const fileName = `cover_${Date.now()}.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;

      const supabase = createClient();

      const { error: uploadError } = await supabase.storage
        .from("cover-images")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("cover-images")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);

      const result = await updateBarbershopCoverImage(barbershopId, publicUrl);
      if (result.error) throw new Error(result.error);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengupload cover image";
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
          Cover image berhasil diperbarui
        </div>
      )}

      <div className="space-y-3">
        <div className="relative w-full h-40 rounded-xl overflow-hidden bg-dark-700/50 border-2 border-dark-600/30 group">
          {previewUrl ? (
            <>
              <img
                src={previewUrl}
                alt="Cover barbershop"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">Ganti Cover</span>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-dark-500">
              <svg className="w-12 h-12 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm">Belum ada cover image</span>
            </div>
          )}
          <label className="absolute inset-0 cursor-pointer">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-white font-medium text-sm">Cover Image</p>
            <p className="text-dark-500 text-xs mt-0.5">
              PNG, JPG, atau WebP. Maks 5MB. Rekomendasi: 1200x630px
            </p>
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-xs disabled:opacity-50"
          >
            {uploading ? "Mengupload..." : previewUrl ? "Ganti Cover" : "Upload Cover"}
          </button>
        </div>
      </div>
    </div>
  );
}
