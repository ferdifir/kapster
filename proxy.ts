import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/types";
import { checkSubscription } from "@/lib/subscription";
import { logError } from "@/lib/error-logger";

function setCsp(response: NextResponse) {
  response.headers.set(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https://*.supabase.co https://tile.openstreetmap.org https://*.tile.openstreetmap.org; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://*.supabase.co https://nominatim.openstreetmap.org https://tile.openstreetmap.org https://*.tile.openstreetmap.org;"
  );
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
}

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  try {

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/barber") ||
    pathname.startsWith("/onboarding") ||
    pathname.startsWith("/billing");

  const isSubProtected =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/barber");

  const isAuthPage =
    pathname.startsWith("/auth/login") ||
    pathname.startsWith("/auth/register");

  if (!user && isAuthProtected) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/auth/login";
    loginUrl.searchParams.set("next", pathname);
    const r = NextResponse.redirect(loginUrl);
    setCsp(r);
    return r;
  }

  if (user && isAuthPage && request.method === "GET") {
    const r = NextResponse.redirect(new URL("/dashboard", request.url));
    setCsp(r);
    return r;
  }

  if (user && isSubProtected) {
    const result = await checkSubscription(supabase, user.id, request);
    if (!result.hasAccess && result.redirect) {
      setCsp(result.redirect);
      return result.redirect;
    }
  }

  setCsp(supabaseResponse);
  return supabaseResponse;
  } catch (err) {
    logError("proxy middleware", err, { pathname: request.nextUrl.pathname });
    const r = NextResponse.redirect(new URL("/auth/login", request.url));
    setCsp(r);
    return r;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
