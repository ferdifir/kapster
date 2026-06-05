export type WAEventType =
  | "join_queue"
  | "queue_called"
  | "queue_serving"
  | "queue_done"
  | "queue_number_update"
  | "booking_confirmed"
  | "booking_reminder"
  | "registration_otp"
  | "password_reset_otp";

export type WACustomizableEvent = Exclude<WAEventType, "registration_otp" | "password_reset_otp">;

export const CUSTOMIZABLE_EVENTS: WACustomizableEvent[] = [
  "join_queue",
  "queue_called",
  "queue_serving",
  "queue_done",
  "queue_number_update",
  "booking_confirmed",
  "booking_reminder",
];

export interface WAEventContext {
  name: string;
  barbershop: string;
  number?: string | number;
  date?: string;
  time?: string;
  estimated?: string;
  position?: number;
  service?: string;
  barber?: string;
  code?: string;
}

export const DEFAULT_TEMPLATES: Record<WAEventType, string> = {
  join_queue:
    "Halo {name}! Anda telah terdaftar di antrian *{barbershop}*. Nomor antrian: *#{number}*. Tanggal: {date}. Tunggu konfirmasi dari kami ya!",
  queue_called:
    "Halo {name}, giliran Anda hampir tiba! Nomor antrian *#{number}* di *{barbershop}*. Mohon bersiap ya!",
  queue_serving:
    "Halo {name}, Anda sekarang sedang dilayani di *{barbershop}* (#{number}). Terima kasih atas kesabarannya!",
  queue_done:
    "Halo {name}, layanan Anda di *{barbershop}* telah selesai (#{number}). Terima kasih sudah berkunjung!",
  queue_number_update:
    "Halo {name}, update antrian Anda di *{barbershop}*. Nomor: *#{number}*. Estimasi: {estimated}. Posisi Anda saat ini: {position} orang sebelum Anda.",
  booking_confirmed:
    "Halo {name}, booking Anda di *{barbershop}* telah dikonfirmasi! 📅 {date}, ⏰ {time}. Layanan: {service}. Barber: {barber}. Sampai jumpa!",
  booking_reminder:
    "Halo {name}, reminder: booking Anda di *{barbershop}* dalam 1 jam lagi. 📅 {date}, ⏰ {time}. Jangan sampai telat ya!",
  registration_otp:
    "Kode verifikasi akun Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.",
  password_reset_otp:
    "Kode reset password Kapster kamu: {code}. Kode berlaku 5 menit. Jangan bagikan kode ini ke siapa pun.",
};

export const WA_FOOTER = "\n\n> _Sent via kapster.my.id_";

export function renderWATemplate(
  eventType: WAEventType,
  context: WAEventContext,
  overrideTemplates?: Partial<Record<WAEventType, string>> | null
): string {
  const template = overrideTemplates?.[eventType] || DEFAULT_TEMPLATES[eventType];
  if (!template) return "";

  return (
    template
      .replace("{name}", context.name || "Pelanggan")
      .replace("{barbershop}", context.barbershop || "")
      .replace("{number}", String(context.number ?? ""))
      .replace("{date}", context.date ?? "")
      .replace("{time}", context.time ?? "")
      .replace("{estimated}", context.estimated ?? "")
      .replace("{position}", String(context.position ?? ""))
      .replace("{service}", context.service ?? "")
      .replace("{barber}", context.barber ?? "")
      .replace("{code}", context.code ?? "") + WA_FOOTER
  );
}
