const PAKASIR_BASE = "https://app.pakasir.com";

const config = {
  slug: process.env.PAKASIR_PROJECT_SLUG!,
  apiKey: process.env.PAKASIR_API_KEY!,
  baseUrl: process.env.NEXT_PUBLIC_BASE_URL!,
};

export function generateOrderId(barbershopId: string): string {
  const ts = Date.now().toString(36);
  const shortId = barbershopId.replace(/-/g, "").slice(0, 8);
  return `KAP-${shortId}-${ts}`;
}

export function getPaymentUrl(orderId: string): string {
  const redirect = encodeURIComponent(`${config.baseUrl}/billing?success=1`);
  return `${PAKASIR_BASE}/pay/${config.slug}/10000?order_id=${orderId}&redirect=${redirect}`;
}
