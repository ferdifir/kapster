import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { logError } from "@/lib/error-logger";

export async function GET(request: Request) {
  try {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get("code");
    const next = searchParams.get("next") ?? "/onboarding";

    if (code) {
      const cookieStore = await cookies();
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() {
              return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            },
          },
        }
      );

      const { error } = await supabase.auth.exchangeCodeForSession(code);
      const base = process.env.NEXT_PUBLIC_BASE_URL || origin;
      if (!error) {
        return NextResponse.redirect(`${base}${next}`);
      }
      logError("auth/callback", "exchangeCodeForSession failed", { error: error?.message });
      return NextResponse.redirect(`${base}/auth/login?error=auth_callback_failed`);
    }

    const base = process.env.NEXT_PUBLIC_BASE_URL || origin;
    logError("auth/callback", "Missing code parameter", { url: request.url });
    return NextResponse.redirect(
      `${base}/auth/login?error=auth_callback_failed`
    );
  } catch (err) {
    logError("auth/callback", err);
    const base = process.env.NEXT_PUBLIC_BASE_URL || origin;
    return NextResponse.redirect(`${base}/auth/login?error=auth_callback_failed`);
  }
}
