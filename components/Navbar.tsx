"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Logo from "./Logo";

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.pageYOffset > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const links = [
    { href: "#fitur", label: "Fitur" },
    { href: "#cara-kerja", label: "Cara Kerja" },
    { href: "#harga", label: "Harga" },
    { href: "#testimoni", label: "Testimoni" },
  ];

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled ? "glass border-b border-dark-700/30" : ""
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative">
              <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
                <Logo className="w-6 h-6 text-dark-900" />
              </div>
              <div className="absolute -inset-1 rounded-lg gold-gradient opacity-0 group-hover:opacity-30 blur transition-opacity duration-300" />
            </div>
            <span className="font-display text-xl font-bold text-white">
              Queue<span className="text-barber-400">Barber</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-dark-300 hover:text-barber-400 transition-colors text-sm font-medium"
              >
                {l.label}
              </a>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a
              href="/auth/login"
              className="text-dark-300 hover:text-white transition-colors text-sm font-medium"
            >
              Masuk
            </a>
            <a
              href="#harga"
              className="relative group px-6 py-2.5 rounded-lg gold-gradient text-dark-900 font-semibold text-sm transition-all duration-300 hover:shadow-lg hover:shadow-barber-400/25"
            >
              Coba Gratis
            </a>
          </div>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="md:hidden text-dark-300 hover:text-white p-2"
            aria-label="Toggle menu"
          >
            {mobileOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden pb-6 border-t border-dark-700/50">
            <div className="flex flex-col gap-4 pt-4">
              {links.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-dark-300 hover:text-barber-400 transition-colors text-sm font-medium py-2"
                >
                  {l.label}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 border-t border-dark-700/50">
                <a href="/auth/login" className="text-dark-300 hover:text-white transition-colors text-sm font-medium py-2 text-center">
                  Masuk
                </a>
                <a
                  href="#harga"
                  onClick={() => setMobileOpen(false)}
                  className="px-6 py-2.5 rounded-lg gold-gradient text-dark-900 font-semibold text-sm text-center"
                >
                  Coba Gratis
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
