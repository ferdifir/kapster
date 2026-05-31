"use server";

import { sendTelegramNotification } from "@/lib/telegram";

export async function notifyNewRegistration(shopName: string, email: string, city: string) {
  const text = [
    `🆕 <b>Barbershop Baru Terdaftar!</b>`,
    `🏪 ${shopName}`,
    `📍 ${city || "-"}`,
    `📧 ${email}`,
  ].join("\n");

  sendTelegramNotification(text);
}
