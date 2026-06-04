"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

const COOKIE_NAME = "referrer_code";
const COOKIE_MAX_AGE = 45 * 24 * 60 * 60;

export default function ReferralCookieSetter() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref && /^[a-zA-Z0-9_-]{1,50}$/.test(ref)) {
      document.cookie = `${COOKIE_NAME}=${encodeURIComponent(ref)}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
    }
  }, [searchParams]);

  return null;
}
