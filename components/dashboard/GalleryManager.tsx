"use client";

import { useState } from "react";
import { addGalleryImage, removeGalleryImage } from "@/app/dashboard/settings/actions";
import Image from "next/image";

interface GalleryManagerProps {
  barbershopId: string;
  currentImages: string[];
}

export default function GalleryManager({ barbershopId, currentImages }: GalleryManagerProps) {
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState(currentImages);

  const MAX_SIZE = 3 * 1024 * 1024; // 3MB
  const MAX_IMAGES = 12;
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess("");

    if (images.length >= MAX_IMAGES) {
      setError(`Maksimal ${MAX_IMAGES} gambar galeri`);
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, atau WebP)");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Ukuran file maksimal 3MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.type.split("/")[1];
      const timestamp = Date.now();
      const fileName = `gallery_${timestamp}.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;

      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "gallery-images");
      formData.append("path", filePath);

      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Gagal mengupload");

      const result = await addGalleryImage(barbershopId, data.url);
      if (result.error) throw new Error(result.error);

      setImages((prev) => [...prev, data.url]);
      setSuccess("Gambar berhasil ditambahkan");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengupload gambar";
      setError(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleRemove = async (imageUrl: string) => {
    setDeleting(imageUrl);
    setError("");
    setSuccess("");

    try {
      const result = await removeGalleryImage(barbershopId, imageUrl);
      if (result.error) throw new Error(result.error);

      setImages((prev) => prev.filter((img) => img !== imageUrl));
      setSuccess("Gambar berhasil dihapus");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal menghapus gambar";
      setError(message);
    } finally {
      setDeleting(null);
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
          {success}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        {images.map((img, index) => (
          <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-dark-700/50 border border-dark-600/30">
            <Image
              src={img}
              alt={`Gallery ${index + 1}`}
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => handleRemove(img)}
                disabled={deleting === img}
                className="px-3 py-1.5 rounded-lg bg-red-500/20 border border-red-500/30 text-red-400 text-xs font-medium hover:bg-red-500/30 disabled:opacity-50"
              >
                {deleting === img ? "Menghapus..." : "Hapus"}
              </button>
            </div>
          </div>
        ))}

        {images.length < MAX_IMAGES && (
          <label className="relative aspect-square rounded-xl border-2 border-dashed border-dark-600/50 flex flex-col items-center justify-center cursor-pointer hover:border-barber-400/50 transition-colors bg-dark-700/30">
            <svg className="w-8 h-8 text-dark-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
            </svg>
            <span className="text-dark-500 text-xs">Tambah</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="hidden"
            />
          </label>
        )}
      </div>

      <p className="text-dark-500 text-xs">
        PNG, JPG, atau WebP. Maks 3MB per gambar. Maksimal {MAX_IMAGES} gambar.
      </p>
    </div>
  );
}
