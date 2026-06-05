"use client";

import { useState } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = [
    { href: "/#fitur", label: "Fitur" },
    { href: "/#cara-kerja", label: "Cara Kerja" },
    { href: "/#harga", label: "Harga" },
    { href: "/blog", label: "Blog" },
    { href: "/#testimoni", label: "Testimoni" },
  ];

  return (
    <nav className="relative overflow-hidden border-b border-white/10 bg-[#080807] py-4">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-barber-400/60 to-transparent" />
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-3 transition duration-300 hover:opacity-90">
          <span className="grid h-9 w-9 place-items-center rounded-xl border border-barber-300/30 bg-gradient-to-br from-barber-300 to-barber-600 text-dark-950 shadow-lg shadow-barber-500/20">
            <Logo className="h-5 w-5" />
          </span>
          <span className="font-display text-base font-semibold tracking-tight text-white">
            Kapster
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-dark-400 transition duration-300 hover:text-barber-200"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="hidden md:block">
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-barber-300 to-barber-600 px-5 py-2.5 text-sm font-semibold text-dark-950 shadow-lg shadow-barber-500/20 transition duration-300 hover:-translate-y-0.5 hover:shadow-barber-500/30"
          >
            Masuk
          </a>
        </div>

        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-dark-200 md:hidden"
          aria-label="Toggle menu"
        >
          {mobileOpen ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M5 7h14M5 12h14M5 17h14" />
            </svg>
          )}
        </button>
      </div>

      {mobileOpen && (
        <div className="mx-5 mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-3 backdrop-blur md:hidden">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              className="block rounded-xl px-4 py-3 text-sm text-dark-300 hover:bg-white/5"
            >
              {l.label}
            </a>
          ))}
          <a
            href="/auth/login"
            onClick={() => setMobileOpen(false)}
            className="mt-2 block rounded-xl bg-barber-400 px-4 py-3 text-center text-sm font-semibold text-dark-950"
          >
            Masuk
          </a>
        </div>
      )}
    </nav>
  );
}
