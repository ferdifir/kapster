const SUBSCRIPTION_PRICE = 10000;
const PAKASIR_BASE = "https://app.pakasir.com";
const PAKASIR_SLUG = process.env.PAKASIR_PROJECT_SLUG || "kapster";
const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function generateOrderId(barbershopId: string): string {
  const ts = Date.now().toString(36);
  const shortId = barbershopId.replace(/-/g, "").slice(0, 8);
  return `KAP-${shortId}-${ts}`;
}

export function getPaymentUrl(orderId: string): string {
  const redirect = encodeURIComponent(`${BASE_URL}/billing?success=1`);
  return `${PAKASIR_BASE}/pay/${PAKASIR_SLUG}/${SUBSCRIPTION_PRICE}?order_id=${orderId}&redirect=${redirect}`;
}
