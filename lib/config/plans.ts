export type PlanKey = "starter" | "basic" | "pro";

// SEMUA PLAN PAKAI LIMIT BASIC (GRATIS)
export const PLAN_LIMITS: Record<PlanKey, { max_barbers: number; max_queue_per_day: number }> = {
  starter: { max_barbers: 3, max_queue_per_day: 50 },
  basic:   { max_barbers: 3, max_queue_per_day: 50 },
  pro:     { max_barbers: 3, max_queue_per_day: 50 },
};

// /* HARGA DINONAKTIFKAN — SEMUA GRATIS
export const PLAN_AMOUNTS: Record<PlanKey, number> = {
  starter: 0,
  basic:   29000,
  pro:     79000,
};

export const PLAN_ANNUAL_AMOUNTS: Record<PlanKey, number> = {
  starter: 0,
  basic: 278000,
  pro: 758000,
};

export function formatBillingPrice(key: PlanKey): string {
  const amount = PLAN_AMOUNTS[key];
  if (amount === 0) return "Gratis";
  return `Rp${amount.toLocaleString("id-ID")}/bulan`;
}

export function formatLandingPrice(key: PlanKey): string {
  const amount = PLAN_AMOUNTS[key];
  if (amount === 0) return "Gratis";
  return `Rp${(amount / 1000).toFixed(0)}K`;
}

export function formatAnnualPrice(key: PlanKey): string {
  const amount = PLAN_ANNUAL_AMOUNTS[key];
  if (amount === 0) return "Gratis";
  return `Rp${(amount / 1000).toFixed(0)}K`;
}

export function getYearlySavings(key: PlanKey): number {
  if (key === "starter") return 0;
  const monthly = PLAN_AMOUNTS[key] * 12;
  const yearly = PLAN_ANNUAL_AMOUNTS[key];
  return monthly - yearly;
}
// */

export const PLAN_META: Record<PlanKey, {
  name: string;
  desc: string;
  billingFeatures: string[];
  landingFeatures: { included: boolean; label: string }[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
  popular?: boolean;
}> = {
  starter: {
    name: "Basic",
    desc: "Semua fitur gratis untuk barbershop.",
    billingFeatures: [
      "3 barber",
      "50 antrian/hari",
      "Queue digital",
      "Booking publik",
      "TV Display",
      // "WhatsApp notification",
      // "Basic reports",
      // "Custom logo",
      // "Analytics lengkap",
      // "Priority support",
      // "API access",
    ],
    landingFeatures: [
      { included: true, label: "3 Barber" },
      { included: true, label: "50 Antrian/hari" },
      { included: true, label: "Queue Digital" },
      { included: true, label: "Public Booking Page" },
      { included: true, label: "TV Display" },
      // { included: true, label: "WhatsApp Notification" },
      // { included: true, label: "Basic Reports" },
      // { included: true, label: "Custom Logo" },
      // { included: true, label: "Analytics Lengkap" },
      // { included: true, label: "Priority Support" },
      // { included: true, label: "API Access" },
    ],
    ctaLabel: "Mulai Gratis",
    ctaHref: "/auth/register",
  },
  basic: {
    name: "Basic",
    desc: "Semua fitur gratis untuk barbershop.",
    billingFeatures: [
      "3 barber",
      "50 antrian/hari",
      "Queue digital",
      "Booking publik",
      "TV Display",
      // "WhatsApp notification",
      // "Basic reports",
      // "Custom logo",
      // "Analytics lengkap",
      // "Priority support",
      // "API access",
    ],
    landingFeatures: [
      { included: true, label: "3 Barber" },
      { included: true, label: "50 Antrian/hari" },
      { included: true, label: "Queue Digital" },
      { included: true, label: "Public Booking Page" },
      { included: true, label: "TV Display" },
      // { included: true, label: "WhatsApp Notification" },
      // { included: true, label: "Basic Reports" },
      // { included: true, label: "Custom Logo" },
      // { included: true, label: "Analytics Lengkap" },
      // { included: true, label: "Priority Support" },
      // { included: true, label: "API Access" },
    ],
    ctaLabel: "Mulai Gratis",
    ctaHref: "/auth/register",
  },
  pro: {
    name: "Basic",
    desc: "Semua fitur gratis untuk barbershop.",
    billingFeatures: [
      "3 barber",
      "50 antrian/hari",
      "Queue digital",
      "Booking publik",
      "TV Display",
      // "WhatsApp notification",
      // "Basic reports",
      // "Custom logo",
      // "Analytics lengkap",
      // "Priority support",
      // "API access",
    ],
    landingFeatures: [
      { included: true, label: "3 Barber" },
      { included: true, label: "50 Antrian/hari" },
      { included: true, label: "Queue Digital" },
      { included: true, label: "Public Booking Page" },
      { included: true, label: "TV Display" },
      // { included: true, label: "WhatsApp Notification" },
      // { included: true, label: "Basic Reports" },
      // { included: true, label: "Custom Logo" },
      // { included: true, label: "Analytics Lengkap" },
      // { included: true, label: "Priority Support" },
      // { included: true, label: "API Access" },
    ],
    ctaLabel: "Mulai Gratis",
    ctaHref: "/auth/register",
  },
};

export const PLAN_KEYS: PlanKey[] = ["starter", "basic", "pro"];
