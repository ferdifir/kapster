export type PlanKey = "starter" | "basic" | "pro";

export const PLAN_LIMITS: Record<PlanKey, { max_barbers: number; max_queue_per_day: number }> = {
  starter: { max_barbers: 1, max_queue_per_day: 30 },
  basic:   { max_barbers: 3, max_queue_per_day: 50 },
  pro:     { max_barbers: 5, max_queue_per_day: 100 },
};

export const PLAN_AMOUNTS: Record<PlanKey, number> = {
  starter: 0,
  basic:   29000,
  pro:     79000,
};

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
    name: "Starter",
    desc: "Coba gratis, tanpa biaya.",
    billingFeatures: [
      "1 barber",
      "30 antrian/hari",
      "Queue digital",
      "Booking publik",
      "TV Display",
    ],
    landingFeatures: [
      { included: true, label: "1 Barber" },
      { included: true, label: "30 Antrian/hari" },
      { included: true, label: "Queue Digital" },
      { included: true, label: "Public Booking Page" },
      { included: true, label: "TV Display" },
      { included: false, label: "WhatsApp Notification" },
      { included: false, label: "Basic Reports" },
    ],
    ctaLabel: "Mulai Gratis",
    ctaHref: "/auth/register",
  },
  basic: {
    name: "Basic",
    desc: "Untuk barbershop kecil yang serius.",
    billingFeatures: [
      "3 barber",
      "50 antrian/hari",
      "Semua fitur Starter",
      "WhatsApp notification",
      "Basic reports",
      "Custom logo",
    ],
    landingFeatures: [
      { included: true, label: "3 Barber" },
      { included: true, label: "50 Antrian/hari" },
      { included: true, label: "Queue Digital" },
      { included: true, label: "Public Booking Page" },
      { included: true, label: "TV Display" },
      { included: true, label: "WhatsApp Notification" },
      { included: true, label: "Basic Reports" },
      { included: true, label: "Custom Logo" },
    ],
    ctaLabel: "Coba Rp 29.000/bln",
    ctaHref: "/auth/register",
    featured: true,
  },
  pro: {
    name: "Pro",
    desc: "Untuk barbershop yang butuh analytics lengkap.",
    billingFeatures: [
      "5 barber",
      "100 antrian/hari",
      "Semua fitur Basic",
      "Analytics lengkap",
      "Priority support",
      "API access",
    ],
    landingFeatures: [
      { included: true, label: "5 Barber" },
      { included: true, label: "100 Antrian/hari" },
      { included: true, label: "Semua Fitur Basic" },
      { included: true, label: "Analytics Lengkap" },
      { included: true, label: "Priority Support" },
      { included: true, label: "API Access" },
      { included: true, label: "Laporan Bulanan" },
    ],
    ctaLabel: "Coba Rp 79.000/bln",
    ctaHref: "/auth/register",
  },
};

export const PLAN_KEYS: PlanKey[] = ["starter", "basic", "pro"];

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

export const PLAN_ANNUAL_AMOUNTS: Record<PlanKey, number> = {
  starter: 0,
  basic: 278000,
  pro: 758000,
};

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
