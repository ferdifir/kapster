export type PlanKey = "starter" | "pro" | "enterprise";

export const PLAN_LIMITS: Record<PlanKey, { max_barbers: number; max_queue_per_day: number }> = {
  starter:    { max_barbers: 1,   max_queue_per_day: 30   },
  pro:        { max_barbers: 5,   max_queue_per_day: 100  },
  enterprise: { max_barbers: 999, max_queue_per_day: 9999 },
};

export const PLAN_AMOUNTS: Record<PlanKey, number> = {
  starter:    0,
  pro:        149000,
  enterprise: 349000,
};

export const PLAN_META: Record<PlanKey, {
  name: string;
  desc: string;
  billingFeatures: string[];
  landingFeatures: { included: boolean; label: string }[];
  ctaLabel: string;
  ctaHref: string;
  featured?: boolean;
}> = {
  starter: {
    name: "Starter",
    desc: "Cocok untuk barbershop yang baru mulai.",
    billingFeatures: [
      "1 barber",
      `${PLAN_LIMITS.starter.max_queue_per_day} antrian/hari`,
      "Booking publik",
      "Antrian walk-in",
      "TV Display",
    ],
    landingFeatures: [
      { included: true,  label: "1 Barber" },
      { included: true,  label: `${PLAN_LIMITS.starter.max_queue_per_day} Antrian/hari` },
      { included: true,  label: "Dashboard Dasar" },
      { included: false, label: "Notifikasi WhatsApp" },
      { included: true,  label: "Customer Display (TV)" },
    ],
    ctaLabel: "Mulai Gratis",
    ctaHref: "/auth/register",
  },
  pro: {
    name: "Pro",
    desc: "Untuk barbershop yang sudah berjalan serius.",
    billingFeatures: [
      `${PLAN_LIMITS.pro.max_barbers} barber`,
      `${PLAN_LIMITS.pro.max_queue_per_day} antrian/hari`,
      "Semua fitur Starter",
      "Analitik lengkap",
      "Prioritas support",
    ],
    landingFeatures: [
      { included: true, label: `${PLAN_LIMITS.pro.max_barbers} Barber` },
      { included: true, label: `${PLAN_LIMITS.pro.max_queue_per_day} Antrian/hari` },
      { included: true, label: "Dashboard + Laporan Lengkap" },
      { included: true, label: "Notifikasi WhatsApp" },
      { included: true, label: "Customer Display (TV)" },
    ],
    ctaLabel: "Coba Gratis 14 Hari",
    ctaHref: "/auth/register",
    featured: true,
  },
  enterprise: {
    name: "Enterprise",
    desc: "Untuk chain barbershop dengan banyak cabang.",
    billingFeatures: [
      "Barber tak terbatas",
      "Antrian tak terbatas",
      "Semua fitur Pro",
      "Multi-cabang (segera)",
      "API akses (segera)",
    ],
    landingFeatures: [
      { included: true, label: "Unlimited Barber" },
      { included: true, label: "Multi-Cabang" },
      { included: true, label: "Semua Fitur Pro" },
      { included: true, label: "API Access" },
      { included: true, label: "Support Priority 24/7" },
    ],
    ctaLabel: "Hubungi Sales",
    ctaHref: "https://wa.me/6285239110184?text=Halo%2C+saya+tertarik+dengan+paket+Enterprise+QueueBarber",
  },
};

export const PLAN_KEYS: PlanKey[] = ["starter", "pro", "enterprise"];

export function formatBillingPrice(key: PlanKey): string {
  const amount = PLAN_AMOUNTS[key];
  if (amount === 0) return "Gratis";
  return `Rp${amount.toLocaleString("id-ID")}/bulan`;
}

export function formatLandingPrice(key: PlanKey): string {
  const amount = PLAN_AMOUNTS[key];
  if (amount === 0) return "Rp0";
  return `Rp${amount / 1000}K`;
}
