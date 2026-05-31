"use client";

import { useState, useRef } from "react";
import { submitFeedback } from "@/app/dashboard/feedback/actions";

interface FeedbackFormProps {
  barbershopId: string;
  profileId: string | null;
  profileName: string | null;
}

const categories = [
  { value: "feedback", label: "Feedback" },
  { value: "saran", label: "Saran" },
  { value: "kritik", label: "Kritik" },
  { value: "request_fitur", label: "Request Fitur" },
];

export default function FeedbackForm({ barbershopId, profileId, profileName }: FeedbackFormProps) {
  const [name, setName] = useState(profileName ?? "");
  const [category, setCategory] = useState("feedback");
  const [message, setMessage] = useState("");
  const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setUploading(true);

    if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, WebP, atau GIF)");
      setUploading(false);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ukuran file maksimal 5MB");
      setUploading(false);
      return;
    }

    try {
      const ext = file.type.split("/")[1];
      const fileName = `screenshot_${Date.now()}.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;
      const formData = new FormData();
      formData.append("file", file);
      formData.append("bucket", "feedback");
      formData.append("path", filePath);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengupload");
      setScreenshotUrl(data.url);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal mengupload screenshot";
      setError(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!name.trim()) { setError("Nama harus diisi"); return; }
    if (!message.trim()) { setError("Pesan harus diisi"); return; }

    setSubmitting(true);
    try {
      const result = await submitFeedback({
        barbershopId, profileId,
        name: name.trim(), category,
        message: message.trim(), screenshotUrl,
      });
      if (result.error) { setError(result.error); return; }
      setSuccess(true);
      setName(profileName ?? "");
      setCategory("feedback");
      setMessage("");
      setScreenshotUrl(null);
      setTimeout(() => setSuccess(false), 5000);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Feedback berhasil dikirim! Terima kasih atas masukannya.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Nama</label>
        <input type="text" value={name} onChange={(e) => setName(e.target.value)}
          placeholder="Nama Anda"
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors" />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Kategori</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)}
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white focus:outline-none focus:border-barber-400/50 transition-colors">
          {categories.map((cat) => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">Pesan</label>
        <textarea value={message} onChange={(e) => setMessage(e.target.value)}
          rows={5} placeholder="Tulis kritik, saran, feedback, atau request fitur Anda di sini..."
          className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/30 text-white placeholder-dark-500 focus:outline-none focus:border-barber-400/50 transition-colors resize-y" />
      </div>

      <div>
        <label className="block text-sm font-medium text-dark-200 mb-1.5">
          Screenshot <span className="text-dark-500">(opsional)</span>
        </label>
        <div className="flex items-center gap-4">
          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
            className="px-4 py-2 rounded-xl border border-dark-700/30 text-dark-300 text-sm hover:bg-dark-800/50 transition-colors disabled:opacity-50">
            {uploading ? "Mengupload..." : "Pilih File"}
          </button>
          {screenshotUrl && (
            <div className="relative">
              <img src={screenshotUrl} alt="Preview" className="h-16 w-16 rounded-lg object-cover border border-dark-700/30" />
              <button type="button" onClick={() => setScreenshotUrl(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600">×</button>
            </div>
          )}
          <input ref={fileInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleFileChange} className="hidden" />
        </div>
        <p className="text-dark-500 text-xs mt-1">PNG, JPG, WebP, atau GIF. Maks 5MB.</p>
      </div>

      <button type="submit" disabled={submitting}
        className="px-6 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
        {submitting ? "Mengirim..." : "Kirim Feedback"}
      </button>
    </form>
  );
}
