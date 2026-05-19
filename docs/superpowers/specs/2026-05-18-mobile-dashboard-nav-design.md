# Mobile Dashboard Navigation Design

## Problem

Sidebar dashboard menggunakan `hidden lg:flex` sehingga tersembunyi di layar < 1024px. User mobile tidak bisa navigasi antar menu.

## Solution

Hamburger menu + slide-out drawer di Header.

## Architecture

### 1. `app/dashboard/layout.tsx`
- Tambah `useState` untuk `mobileMenuOpen`
- Pass `mobileMenuOpen` dan `setMobileMenuOpen` ke Header dan Sidebar

### 2. `components/dashboard/Header.tsx`
- Tambah hamburger button di kiri (hanya tampil di mobile: `lg:hidden`)
- On click: toggle `mobileMenuOpen`

### 3. `components/dashboard/Sidebar.tsx`
- Tambah props: `mobileOpen?: boolean`, `onClose?: () => void`
- Desktop: tetap seperti sekarang (`hidden lg:flex`)
- Mobile: fixed overlay drawer saat `mobileOpen` true
  - Backdrop gelap (`fixed inset-0 bg-black/50`)
  - Panel slide dari kiri (`fixed left-0 top-0 h-full w-64`)
  - Close saat klik backdrop atau pilih menu

## Changes Summary

| File | Change |
|------|--------|
| `app/dashboard/layout.tsx` | Lift state `mobileMenuOpen` |
| `components/dashboard/Header.tsx` | Hamburger button |
| `components/dashboard/Sidebar.tsx` | Mobile drawer mode |
