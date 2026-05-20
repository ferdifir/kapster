# SEO Optimization Design — Kapster

**Date:** 2026-05-19
**Status:** Draft — awaiting review

## Goals

1. Improve homepage ranking for keywords: "sistem antrian barbershop", "software barbershop", "aplikasi barbershop"
2. Make individual barbershop pages discoverable via Google (selective — only barbershops with `show_in_directory: true` in `settings_json`)
3. Improve Core Web Vitals scores for better ranking signal

## Section 1: Dynamic Metadata per-Barbershop

### Problem
`booking/[slug]`, `q/[slug]`, `map`, and `display/[slug]` pages have no metadata. Google sees blank title/description.

### Solution

#### `booking/[slug]/page.tsx`
- Add `generateMetadata()` function
- Title: `"Booking Online - {barbershop.name} | Kapster"`
- Description: `"Reservasi antrian di {barbershop.name}, {barbershop.city}. Pilih barber, layanan, dan jadwal tanpa perlu datang langsung."`
- Canonical: `https://kapster.my.id/booking/{slug}`
- Robots: conditional based on `settings_json.show_in_directory` (default `true`)

#### `q/[slug]/page.tsx`
- Add `generateMetadata()` function
- Title: `"Antrian Real-time - {barbershop.name} | Kapster"`
- Description: `"Cek antrian {barbershop.name} secara real-time. Lihat berapa orang yang mengantri dan ambil nomor antrian online."`
- Canonical: `https://kapster.my.id/q/{slug}`
- Robots: conditional based on `settings_json.show_in_directory` (default `true`)

#### `display/[slug]/page.tsx`
- Add `robots: { index: false, follow: false }` — this is for in-shop TV monitors, not for public

#### Map page (`map/page.tsx`)
- NOT optimized per user request. No metadata changes needed.

#### Selective Indexing Logic
- Read `settings_json.show_in_directory` from barbershop record
- If `false` → set `robots: { index: false }`
- If `undefined` or `true` → allow indexing (default)
- Applied in both `booking/[slug]` and `q/[slug]`

### Files Modified
- `app/booking/[slug]/page.tsx`
- `app/q/[slug]/page.tsx`
- `app/display/[slug]/page.tsx`

## Section 2: Sitemap & Structured Data

### Sitemap Update

Current sitemap only has homepage + anchor fragments. Will be updated to:

| URL | Priority | Change Frequency | Condition |
|-----|----------|------------------|-----------|
| `/` | 1.0 | daily | Always |
| `/privacy-policy` | 0.3 | yearly | Always |
| `/terms-of-service` | 0.3 | yearly | Always |
| `/cookie-policy` | 0.3 | yearly | Always |
| `/q/{slug}` | 0.7 | daily | `settings_json.show_in_directory === true` |
| `/booking/{slug}` | 0.7 | daily | `settings_json.show_in_directory === true` |

Map page (`/map`) is NOT included per user request.

### JSON-LD Structured Data

#### Homepage (`app/layout.tsx`)
- Keep existing `SoftwareApplication` schema
- Add `FAQPage` schema with common questions about Kapster
- Add `HowTo` schema: "Cara menggunakan Kapster" (3 steps: pilih barbershop → ambil antrian → datang)
- Fix `aggregateRating` — remove hardcoded "4.9 / 500 review" (Google penalty risk). Replace with real data or remove entirely.

#### Per-Barbershop (`q/[slug]` and `booking/[slug]`)
- Inject `LocalBusiness` JSON-LD with:
  - `@type`: `"HairSalon"` or `"LocalBusiness"`
  - `name`: barbershop name
  - `address`: address + city
  - `url`: booking page URL
  - `image`: logo URL (if available)
  - `geo`: latitude/longitude (if available)
  - `sameAs`: social links (if available in future)
  - `priceRange`: from services data

### Files Modified
- `app/sitemap.ts`
- `app/layout.tsx`
- `app/q/[slug]/page.tsx`
- `app/booking/[slug]/page.tsx`

## Section 3: Core Web Vitals & Performance

### Preconnect & Resource Hints
Add to `<head>` in `app/layout.tsx`:
```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
```
Note: Supabase calls are server-side, so preconnect to Supabase is not needed for client performance.

### Image Optimization
- Replace `<img>` tags for barbershop logos with `next/image` `<Image>` component
- Set explicit `width`, `height`, `sizes` attributes
- Add `loading="lazy"` for below-the-fold logos
- Apply in: `app/q/[slug]/page.tsx`, `app/display/[slug]/page.tsx`, `components/BrandLogos.tsx` (if applicable)

### Lazy Load Homepage Components
Use CSS `content-visibility: auto` for below-the-fold homepage sections. This keeps content server-rendered (good for SEO) while deferring browser rendering cost.

Components to apply:
- `BrandLogos`
- `ProblemSection`
- `FeaturesSection`
- `HowItWorks`
- `PricingSection`
- `Testimonials`
- `CTASection`

Approach: Wrap each in a `<div style={{ contentVisibility: 'auto' }}>` or add a utility class.

### Font Optimization
- Playfair Display and Inter already use `next/font/google` with `display: swap` — already optimal
- No changes needed

### Miscellaneous
- Fix Google verification code in `layout.tsx` — replace placeholder `"your-google-verification-code"` with real code, or remove if not yet configured
- Add `<meta name="theme-color" content="#0a0a0a">` for mobile browser chrome
- Ensure all pages have proper `lang="id"` attribute (already set in layout.tsx)

### Files Modified
- `app/layout.tsx`
- `app/page.tsx` (wrap sections with content-visibility)
- `app/q/[slug]/page.tsx` (Image component)
- `app/display/[slug]/page.tsx` (Image component)

## Implementation Order

1. Dynamic metadata (Section 1) — highest impact, lowest risk
2. Sitemap + structured data (Section 2) — medium impact
3. Core Web Vitals (Section 3) — incremental improvement

## Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Sitemap query too slow (fetching all barbershops) | Add index on `is_active` column, cache sitemap for 1 hour |
| `content-visibility` breaks layout | Test on mobile and desktop; add `contain-intrinsic-size` to prevent scroll jumps |
| JSON-LD validation errors | Test with Google Rich Results Test tool before deploy |
| Google verification code still placeholder | Leave placeholder but add TODO comment; user must replace with real code |

## Success Metrics

- Google Search Console: impressions increase 50%+ within 30 days
- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Individual barbershop pages appear in Google search results for "{barbershop name} antrian"
