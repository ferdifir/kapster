export function normalizePhone(phone: string): string {
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (cleaned.startsWith("08")) return "62" + cleaned.slice(1);
  if (cleaned.startsWith("+62")) return cleaned.slice(1);
  if (cleaned.startsWith("62")) return cleaned;
  if (cleaned.startsWith("8")) return "62" + cleaned;
  return cleaned;
}

export function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || !phone.trim()) return { valid: true };
  const cleaned = phone.replace(/[\s\-\(\)]/g, "");
  if (!/^\+?62\d{9,13}$|^08\d{8,12}$|^8\d{8,13}$/.test(cleaned)) {
    return {
      valid: false,
      error: "Format nomor HP tidak valid. Gunakan 08xx, 8xx, 628xx, atau +628xx",
    };
  }
  return { valid: true };
}
