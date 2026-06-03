import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co https://telegram.org",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org",
  "font-src 'self' data: https://fonts.gstatic.com",
  "connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://telegram.org",
].join("; ");

export function proxy(_request: NextRequest) {
  const response = NextResponse.next();

  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Content-Security-Policy", CSP);

  return response;
}
