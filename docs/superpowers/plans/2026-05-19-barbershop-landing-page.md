# Barbershop Landing Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable each barbershop to customize their public page (`/q/{slug}`) with templates, colors, sections, and gallery — transforming it from a simple queue page into a professional landing page.

**Architecture:** All design config stored in existing `settings_json` column on `barbershops` table. New dashboard page at `/dashboard/design` for management. Public page refactored to render landing sections conditionally. New Supabase storage bucket for gallery images.

**Tech Stack:** Next.js 16 (App Router), React 19, Supabase, Tailwind CSS 4, TypeScript, Maplibre GL (existing)

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `supabase/migrations/add_gallery_storage.sql` | Create | Storage bucket + RLS for gallery images |
| `app/dashboard/design/page.tsx` | Create | Dashboard design page (server component) |
| `app/dashboard/design/actions.ts` | Create | Server actions for design management |
| `components/dashboard/DesignManager.tsx` | Create | Main client component for design settings |
| `components/dashboard/TemplateSelector.tsx` | Create | Template picker UI |
| `components/dashboard/GalleryManager.tsx` | Create | Gallery upload/reorder/delete UI |
| `components/dashboard/SectionToggles.tsx` | Create | Section visibility toggles |
| `components/dashboard/ColorPicker.tsx` | Create | Color customization UI |
| `components/dashboard/TestimonialsManager.tsx` | Create | Testimonial CRUD UI |
| `components/dashboard/HoursEditor.tsx` | Create | Operating hours editor |
| `components/landing/StickyBar.tsx` | Create | Sticky top bar on public page |
| `components/landing/HeroSection.tsx` | Create | Hero section |
| `components/landing/QueueWidget.tsx` | Create | Queue status widget |
| `components/landing/ServicesSection.tsx` | Create | Services list |
| `components/landing/GallerySection.tsx` | Create | Photo grid with lightbox |
| `components/landing/BarbersSection.tsx` | Create | Barber team profiles |
| `components/landing/HoursSection.tsx` | Create | Operating hours display |
| `components/landing/LocationSection.tsx` | Create | Address + map |
| `components/landing/TestimonialsSection.tsx` | Create | Testimonials carousel |
| `components/landing/LandingFooter.tsx` | Create | "Powered by Kapster" footer |
| `components/dashboard/Sidebar.tsx` | Modify | Add "Desain" nav item |
| `app/q/[slug]/page.tsx` | Modify | Refactor to landing page |
| `lib/supabase/types.ts` | Modify | (regenerate via supabase gen types) |

---

### Task 1: Gallery Storage Migration

**Files:**
- Create: `supabase/migrations/add_gallery_storage.sql`

- [ ] **Step 1: Create migration file**

```sql
-- Create storage bucket for gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery-images', 'gallery-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access
CREATE POLICY "Gallery images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'gallery-images');

-- Policy: Allow authenticated users (barbershop owners) to upload
CREATE POLICY "Authenticated users can upload gallery images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to update their gallery images
CREATE POLICY "Authenticated users can update their gallery images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to delete their gallery images
CREATE POLICY "Authenticated users can delete their gallery images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'gallery-images'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);
```

- [ ] **Step 2: Apply migration**

Run: `npx supabase db push` or apply via Supabase dashboard SQL editor.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/add_gallery_storage.sql
git commit -m "feat: add gallery-images storage bucket with RLS policies"
```

---

### Task 2: Design Server Actions

**Files:**
- Create: `app/dashboard/design/actions.ts`

- [ ] **Step 1: Write server actions**

```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";
import type { Json } from "@/lib/supabase/types";

type DesignSettings = {
  template?: string;
  colors?: { primary?: string; accent?: string; background?: string };
  sections?: Record<string, { visible: boolean }>;
  gallery_images?: Array<{ url: string; caption: string; order: number }>;
  tagline?: string;
  operating_hours?: Record<string, { open: string; close: string; closed: boolean }>;
  testimonials?: Array<{ name: string; rating: number; comment: string }>;
};

async function verifyOwnership(barbershopId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json, slug")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };
  return { barbershop, settings: (barbershop.settings_json as Record<string, unknown> & { design?: DesignSettings }) ?? {} };
}

function getDesign(settings: Record<string, unknown>): DesignSettings {
  return (settings.design ?? {}) as DesignSettings;
}

export async function updateDesignTemplate(barbershopId: string, template: string) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.template = template;
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function updateDesignColors(
  barbershopId: string,
  colors: { primary: string; accent: string; background: string }
) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.colors = colors;
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function toggleSection(barbershopId: string, section: string, visible: boolean) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.sections = design.sections ?? {};
  design.sections[section] = { visible };
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function updateTagline(barbershopId: string, tagline: string) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.tagline = tagline;
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function updateOperatingHours(
  barbershopId: string,
  hours: Record<string, { open: string; close: string; closed: boolean }>
) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.operating_hours = hours;
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function addTestimonial(
  barbershopId: string,
  testimonial: { name: string; rating: number; comment: string }
) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.testimonials = design.testimonials ?? [];
  design.testimonials.push(testimonial);
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function deleteTestimonial(barbershopId: string, index: number) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  design.testimonials = design.testimonials ?? [];
  design.testimonials.splice(index, 1);
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function uploadGalleryImage(barbershopId: string, file: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, settings_json, slug")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  const imageFile = file.get("file") as File;
  if (!imageFile) return { error: "No file provided" };

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
  if (!ALLOWED_TYPES.includes(imageFile.type)) {
    return { error: "File harus berupa gambar (PNG, JPG, WebP, atau GIF)" };
  }

  const MAX_SIZE = 5 * 1024 * 1024; // 5MB
  if (imageFile.size > MAX_SIZE) {
    return { error: "Ukuran file maksimal 5MB" };
  }

  const ext = imageFile.type.split("/")[1];
  const fileName = `${Date.now()}.${ext}`;
  const filePath = `${barbershopId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from("gallery-images")
    .upload(filePath, imageFile);

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage
    .from("gallery-images")
    .getPublicUrl(filePath);

  const settings = (barbershop.settings_json as Record<string, unknown> & { design?: DesignSettings }) ?? {};
  const design = getDesign(settings);
  design.gallery_images = design.gallery_images ?? [];
  design.gallery_images.push({
    url: publicUrl,
    caption: "",
    order: design.gallery_images.length,
  });
  settings.design = design;

  const { error: updateError } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (updateError) {
    // Clean up uploaded file if DB update fails
    await supabase.storage.from("gallery-images").remove([filePath]);
    return { error: updateError.message };
  }

  revalidatePath("/q/[slug]");
  return { url: publicUrl };
}

export async function reorderGallery(barbershopId: string, orderedUrls: string[]) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings } = result as { settings: Record<string, unknown> };
  const design = getDesign(settings);
  const images = design.gallery_images ?? [];

  const reordered = orderedUrls.map((url, index) => {
    const existing = images.find((img) => img.url === url);
    return existing ? { ...existing, order: index } : { url, caption: "", order: index };
  });

  design.gallery_images = reordered;
  settings.design = design;

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}

export async function deleteGalleryImage(barbershopId: string, url: string) {
  const result = await verifyOwnership(barbershopId);
  if (result.error) return result;

  const { settings, barbershop } = result as { settings: Record<string, unknown>; barbershop: { slug: string } };
  const design = getDesign(settings);
  design.gallery_images = (design.gallery_images ?? []).filter((img) => img.url !== url);
  settings.design = design;

  // Remove from storage
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/storage/v1/object/public/gallery-images/");
    if (pathParts.length === 2) {
      const admin = createAdminClient();
      await admin.storage.from("gallery-images").remove([decodeURIComponent(pathParts[1])]);
    }
  } catch {
    // Silently ignore cleanup errors
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("barbershops")
    .update({ settings_json: settings as Json })
    .eq("id", barbershopId);

  if (error) return { error: error.message };
  revalidatePath("/q/[slug]");
  return {};
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/design/actions.ts
git commit -m "feat: add design management server actions"
```

---

### Task 3: Dashboard Design Page (Server Component)

**Files:**
- Create: `app/dashboard/design/page.tsx`

- [ ] **Step 1: Create the page**

```typescript
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DesignManager from "@/components/dashboard/DesignManager";

export const dynamic = "force-dynamic";

export default async function DesignPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, name, slug, settings_json")
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) redirect("/onboarding");

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const design = (settings.design as Record<string, unknown>) ?? {};

  const barbershopData = {
    id: barbershop.id,
    name: barbershop.name,
    slug: barbershop.slug,
    template: (design.template as string) ?? "classic",
    colors: (design.colors as { primary: string; accent: string; background: string }) ?? {
      primary: "#d4a574",
      accent: "#c4956a",
      background: "#0f0f0f",
    },
    sections: (design.sections as Record<string, { visible: boolean }>) ?? {
      hero: { visible: true },
      queue_status: { visible: true },
      services: { visible: true },
      gallery: { visible: true },
      barbers: { visible: true },
      location: { visible: true },
      hours: { visible: true },
      testimonials: { visible: false },
    },
    gallery_images: (design.gallery_images as Array<{ url: string; caption: string; order: number }>) ?? [],
    tagline: (design.tagline as string) ?? "",
    operating_hours: (design.operating_hours as Record<string, { open: string; close: string; closed: boolean }>) ?? {
      monday: { open: "09:00", close: "21:00", closed: false },
      tuesday: { open: "09:00", close: "21:00", closed: false },
      wednesday: { open: "09:00", close: "21:00", closed: false },
      thursday: { open: "09:00", close: "21:00", closed: false },
      friday: { open: "09:00", close: "21:00", closed: false },
      saturday: { open: "09:00", close: "22:00", closed: false },
      sunday: { open: "10:00", close: "20:00", closed: false },
    },
    testimonials: (design.testimonials as Array<{ name: string; rating: number; comment: string }>) ?? [],
  };

  return <DesignManager barbershop={barbershopData} />;
}
```

- [ ] **Step 2: Commit**

```bash
git add app/dashboard/design/page.tsx
git commit -m "feat: add design dashboard page"
```

---

### Task 4: TemplateSelector Component

**Files:**
- Create: `components/dashboard/TemplateSelector.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

const templates = [
  {
    id: "classic",
    name: "Classic",
    description: "Dark theme, gold accents, premium feel",
    preview: {
      background: "#0f0f0f",
      accent: "#d4a574",
      text: "#ffffff",
    },
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean, minimal, light theme",
    preview: {
      background: "#ffffff",
      accent: "#3b82f6",
      text: "#111827",
    },
  },
  {
    id: "bold",
    name: "Bold",
    description: "High contrast, vibrant, energetic",
    preview: {
      background: "#0a0a0a",
      accent: "#ef4444",
      text: "#ffffff",
    },
  },
];

export default function TemplateSelector({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (template: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {templates.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={`relative rounded-2xl overflow-hidden border-2 transition-all ${
            selected === t.id
              ? "border-barber-400 ring-2 ring-barber-400/20"
              : "border-dark-700/30 hover:border-dark-600"
          }`}
        >
          <div
            className="h-32 flex flex-col items-center justify-center p-4"
            style={{ backgroundColor: t.preview.background }}
          >
            <div
              className="w-12 h-12 rounded-xl mb-2"
              style={{ backgroundColor: t.preview.accent }}
            />
            <span style={{ color: t.preview.text }} className="text-sm font-bold">
              {t.name}
            </span>
          </div>
          <div className="bg-dark-800/50 p-3 text-left">
            <p className="text-white text-sm font-medium">{t.name}</p>
            <p className="text-dark-400 text-xs mt-1">{t.description}</p>
          </div>
          {selected === t.id && (
            <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-barber-400 flex items-center justify-center">
              <svg className="w-4 h-4 text-dark-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/TemplateSelector.tsx
git commit -m "feat: add template selector component"
```

---

### Task 5: ColorPicker Component

**Files:**
- Create: `components/dashboard/ColorPicker.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

export default function ColorPicker({
  colors,
  onChange,
}: {
  colors: { primary: string; accent: string; background: string };
  onChange: (colors: { primary: string; accent: string; background: string }) => void;
}) {
  const fields = [
    { key: "primary" as const, label: "Primary Color" },
    { key: "accent" as const, label: "Accent Color" },
    { key: "background" as const, label: "Background Color" },
  ];

  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <div key={field.key} className="flex items-center gap-4">
          <label className="text-dark-400 text-sm w-32">{field.label}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colors[field.key]}
              onChange={(e) => onChange({ ...colors, [field.key]: e.target.value })}
              className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent"
            />
            <input
              type="text"
              value={colors[field.key]}
              onChange={(e) => onChange({ ...colors, [field.key]: e.target.value })}
              className="w-24 px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm font-mono focus:outline-none focus:border-barber-400/50"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/ColorPicker.tsx
git commit -m "feat: add color picker component"
```

---

### Task 6: SectionToggles Component

**Files:**
- Create: `components/dashboard/SectionToggles.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

const sectionLabels: Record<string, string> = {
  hero: "Hero Section",
  queue_status: "Queue Status",
  services: "Daftar Layanan",
  gallery: "Gallery Foto",
  barbers: "Tim Barber",
  location: "Lokasi & Peta",
  hours: "Jam Buka",
  testimonials: "Testimoni",
};

export default function SectionToggles({
  sections,
  onToggle,
}: {
  sections: Record<string, { visible: boolean }>;
  onToggle: (section: string, visible: boolean) => void;
}) {
  return (
    <div className="space-y-3">
      {Object.entries(sectionLabels).map(([key, label]) => {
        const visible = sections[key]?.visible ?? true;
        return (
          <div key={key} className="flex items-center justify-between py-2">
            <span className="text-white text-sm">{label}</span>
            <button
              onClick={() => onToggle(key, !visible)}
              className={`relative w-11 h-6 rounded-full transition-colors ${
                visible ? "bg-barber-400" : "bg-dark-600"
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  visible ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/SectionToggles.tsx
git commit -m "feat: add section toggles component"
```

---

### Task 7: GalleryManager Component

**Files:**
- Create: `components/dashboard/GalleryManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import {
  uploadGalleryImage,
  reorderGallery,
  deleteGalleryImage,
} from "@/app/dashboard/design/actions";

type GalleryImage = { url: string; caption: string; order: number };

export default function GalleryManager({
  barbershopId,
  images,
}: {
  barbershopId: string;
  images: GalleryImage[];
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [localImages, setLocalImages] = useState(images);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setError("");
    setUploading(true);

    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.set("file", file);

      const result = await uploadGalleryImage(barbershopId, formData);
      if (result.error) {
        setError(result.error);
        break;
      }
    }

    setUploading(false);
    if (!error) {
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
      window.location.reload();
    }
  };

  const handleDelete = async (url: string) => {
    const result = await deleteGalleryImage(barbershopId, url);
    if (result.error) {
      setError(result.error);
      return;
    }
    window.location.reload();
  };

  const handleMove = (index: number, direction: "up" | "down") => {
    const newIndex = direction === "up" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= localImages.length) return;

    const updated = [...localImages];
    [updated[index], updated[newIndex]] = [updated[newIndex], updated[index]];

    const orderedUrls = updated.map((img) => img.url);
    reorderGallery(barbershopId, orderedUrls).then((result) => {
      if (!result.error) {
        setLocalImages(updated);
        window.location.reload();
      }
    });
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          Upload berhasil
        </div>
      )}

      <label className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gold-gradient text-dark-900 font-bold text-sm cursor-pointer disabled:opacity-50">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        {uploading ? "Uploading..." : "Upload Foto"}
        <input
          type="file"
          accept="image/png,image/jpeg,image/webp,image/gif"
          multiple
          onChange={handleUpload}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {localImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {localImages
            .sort((a, b) => a.order - b.order)
            .map((img, index) => (
              <div key={img.url} className="relative group rounded-xl overflow-hidden bg-dark-700/50 border border-dark-600/30">
                <img src={img.url} alt={img.caption || "Gallery"} className="w-full h-32 object-cover" />
                <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <button
                    onClick={() => handleMove(index, "up")}
                    disabled={index === 0}
                    className="p-1.5 rounded-lg bg-dark-800 text-white hover:bg-dark-700 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleMove(index, "down")}
                    disabled={index === localImages.length - 1}
                    className="p-1.5 rounded-lg bg-dark-800 text-white hover:bg-dark-700 disabled:opacity-30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(img.url)}
                    className="p-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/GalleryManager.tsx
git commit -m "feat: add gallery manager component"
```

---

### Task 8: HoursEditor Component

**Files:**
- Create: `components/dashboard/HoursEditor.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { updateOperatingHours } from "@/app/dashboard/design/actions";

type DayHours = { open: string; close: string; closed: boolean };
type WeekHours = Record<string, DayHours>;

const dayLabels: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

export default function HoursEditor({
  barbershopId,
  hours,
}: {
  barbershopId: string;
  hours: WeekHours;
}) {
  const [localHours, setLocalHours] = useState(hours);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const updateDay = (day: string, field: keyof DayHours, value: string | boolean) => {
    setLocalHours((prev) => ({
      ...prev,
      [day]: { ...prev[day], [field]: value },
    }));
  };

  const handleSave = () => {
    setSaving(true);
    updateOperatingHours(barbershopId, localHours).then((result) => {
      setSaving(false);
      if (!result.error) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    });
  };

  return (
    <div className="space-y-3">
      {Object.entries(dayLabels).map(([day, label]) => {
        const h = localHours[day];
        return (
          <div key={day} className="flex items-center gap-3">
            <span className="text-white text-sm w-20">{label}</span>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={!h.closed}
                onChange={(e) => updateDay(day, "closed", !e.target.checked)}
                className="rounded border-dark-600 bg-dark-700 text-barber-400"
              />
              <span className="text-dark-400 text-xs">Buka</span>
            </label>
            {!h.closed && (
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={h.open}
                  onChange={(e) => updateDay(day, "open", e.target.value)}
                  className="px-2 py-1 rounded bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50"
                />
                <span className="text-dark-500">-</span>
                <input
                  type="time"
                  value={h.close}
                  onChange={(e) => updateDay(day, "close", e.target.value)}
                  className="px-2 py-1 rounded bg-dark-700/50 border border-dark-600/50 text-white text-sm focus:outline-none focus:border-barber-400/50"
                />
              </div>
            )}
            {h.closed && (
              <span className="text-dark-500 text-xs italic">Tutup</span>
            )}
          </div>
        );
      })}
      <div className="flex items-center gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Simpan"}
        </button>
        {saved && <span className="text-green-400 text-sm">Berhasil</span>}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/HoursEditor.tsx
git commit -m "feat: add operating hours editor component"
```

---

### Task 9: TestimonialsManager Component

**Files:**
- Create: `components/dashboard/TestimonialsManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import { addTestimonial, deleteTestimonial } from "@/app/dashboard/design/actions";

type Testimonial = { name: string; rating: number; comment: string };

export default function TestimonialsManager({
  barbershopId,
  testimonials,
}: {
  barbershopId: string;
  testimonials: Testimonial[];
}) {
  const [form, setForm] = useState({ name: "", rating: 5, comment: "" });
  const [saving, setSaving] = useState(false);
  const [localTestimonials, setLocalTestimonials] = useState(testimonials);

  const handleAdd = () => {
    if (!form.name.trim() || !form.comment.trim()) return;
    setSaving(true);
    addTestimonial(barbershopId, form).then((result) => {
      setSaving(false);
      if (!result.error) {
        setLocalTestimonials((prev) => [...prev, { ...form }]);
        setForm({ name: "", rating: 5, comment: "" });
      }
    });
  };

  const handleDelete = (index: number) => {
    deleteTestimonial(barbershopId, index).then((result) => {
      if (!result.error) {
        setLocalTestimonials((prev) => prev.filter((_, i) => i !== index));
      }
    });
  };

  return (
    <div className="space-y-4">
      {localTestimonials.length > 0 && (
        <div className="space-y-3">
          {localTestimonials.map((t, index) => (
            <div key={index} className="bg-dark-700/30 border border-dark-600/30 rounded-xl p-4 flex items-start justify-between gap-4">
              <div>
                <p className="text-white text-sm font-medium">{t.name}</p>
                <div className="flex gap-0.5 mt-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <svg key={i} className={`w-4 h-4 ${i < t.rating ? "text-yellow-400" : "text-dark-600"}`} fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-dark-400 text-sm mt-1">{t.comment}</p>
              </div>
              <button
                onClick={() => handleDelete(index)}
                className="p-1.5 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="bg-dark-700/30 border border-dark-600/30 rounded-xl p-4 space-y-3">
        <p className="text-white text-sm font-medium">Tambah Testimoni</p>
        <input
          type="text"
          placeholder="Nama pelanggan"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
        />
        <div className="flex items-center gap-2">
          <span className="text-dark-400 text-sm">Rating:</span>
          <div className="flex gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
                className="p-0.5"
              >
                <svg className={`w-5 h-5 ${i < form.rating ? "text-yellow-400" : "text-dark-600"}`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              </button>
            ))}
          </div>
        </div>
        <textarea
          placeholder="Komentar"
          value={form.comment}
          onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-barber-400/50 resize-none"
        />
        <button
          onClick={handleAdd}
          disabled={saving || !form.name.trim() || !form.comment.trim()}
          className="px-4 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50"
        >
          {saving ? "Menyimpan..." : "Tambah"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/TestimonialsManager.tsx
git commit -m "feat: add testimonials manager component"
```

---

### Task 10: DesignManager Component (Assemble Dashboard)

**Files:**
- Create: `components/dashboard/DesignManager.tsx`

- [ ] **Step 1: Create the component**

```typescript
"use client";

import { useState } from "react";
import TemplateSelector from "@/components/dashboard/TemplateSelector";
import ColorPicker from "@/components/dashboard/ColorPicker";
import SectionToggles from "@/components/dashboard/SectionToggles";
import GalleryManager from "@/components/dashboard/GalleryManager";
import HoursEditor from "@/components/dashboard/HoursEditor";
import TestimonialsManager from "@/components/dashboard/TestimonialsManager";
import {
  updateDesignTemplate,
  updateDesignColors,
  toggleSection,
  updateTagline,
} from "@/app/dashboard/design/actions";

type DesignManagerProps = {
  barbershop: {
    id: string;
    name: string;
    slug: string;
    template: string;
    colors: { primary: string; accent: string; background: string };
    sections: Record<string, { visible: boolean }>;
    gallery_images: Array<{ url: string; caption: string; order: number }>;
    tagline: string;
    operating_hours: Record<string, { open: string; close: string; closed: boolean }>;
    testimonials: Array<{ name: string; rating: number; comment: string }>;
  };
};

export default function DesignManager({ barbershop }: DesignManagerProps) {
  const [template, setTemplate] = useState(barbershop.template);
  const [colors, setColors] = useState(barbershop.colors);
  const [sections, setSections] = useState(barbershop.sections);
  const [tagline, setTagline] = useState(barbershop.tagline);
  const [saving, setSaving] = useState("");

  const handleTemplateChange = (t: string) => {
    setTemplate(t);
    setSaving("template");
    updateDesignTemplate(barbershop.id, t).finally(() => setSaving(""));
  };

  const handleColorsChange = (c: { primary: string; accent: string; background: string }) => {
    setColors(c);
    setSaving("colors");
    updateDesignColors(barbershop.id, c).finally(() => setSaving(""));
  };

  const handleToggle = (section: string, visible: boolean) => {
    setSections((prev) => ({ ...prev, [section]: { visible } }));
    setSaving("section");
    toggleSection(barbershop.id, section, visible).finally(() => setSaving(""));
  };

  const handleTaglineSave = () => {
    setSaving("tagline");
    updateTagline(barbershop.id, tagline).finally(() => setSaving(""));
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-bold text-white">Desain Landing Page</h1>
          <p className="text-dark-400 text-sm mt-1">Atur tampilan halaman publik barbershop kamu</p>
        </div>
        <a
          href={`/q/${barbershop.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm hover:bg-dark-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          Lihat Landing Page
        </a>
      </div>

      {/* Template */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Pilih Template</h2>
        <TemplateSelector selected={template} onSelect={handleTemplateChange} />
        {saving === "template" && <p className="text-dark-400 text-xs">Menyimpan...</p>}
      </div>

      {/* Colors */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Kustomisasi Warna</h2>
        <ColorPicker colors={colors} onChange={handleColorsChange} />
        {saving === "colors" && <p className="text-dark-400 text-xs">Menyimpan...</p>}
      </div>

      {/* Tagline */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Tagline</h2>
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Contoh: Barbershop Terbaik di Jaksel"
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-dark-700/50 border border-dark-600/50 text-white text-sm placeholder-dark-500 focus:outline-none focus:border-barber-400/50"
          />
          <button
            onClick={handleTaglineSave}
            disabled={saving === "tagline"}
            className="px-5 py-3 rounded-xl gold-gradient text-dark-900 font-bold text-sm disabled:opacity-50 whitespace-nowrap"
          >
            {saving === "tagline" ? "..." : "Simpan"}
          </button>
        </div>
      </div>

      {/* Sections */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Tampilkan Section</h2>
        <SectionToggles sections={sections} onToggle={handleToggle} />
        {saving === "section" && <p className="text-dark-400 text-xs">Menyimpan...</p>}
      </div>

      {/* Gallery */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Gallery Foto</h2>
        <GalleryManager barbershopId={barbershop.id} images={barbershop.gallery_images} />
      </div>

      {/* Hours */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Jam Operasional</h2>
        <HoursEditor barbershopId={barbershop.id} hours={barbershop.operating_hours} />
      </div>

      {/* Testimonials */}
      <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
        <h2 className="font-semibold text-white">Testimoni</h2>
        <TestimonialsManager barbershopId={barbershop.id} testimonials={barbershop.testimonials} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/DesignManager.tsx
git commit -m "feat: add design manager component assembling all dashboard sections"
```

---

### Task 11: Add "Desain" to Sidebar

**Files:**
- Modify: `components/dashboard/Sidebar.tsx`

- [ ] **Step 1: Add nav item**

In `components/dashboard/Sidebar.tsx`, add a new item to `navItems` array after "Layanan":

```typescript
  {
    href: "/dashboard/design",
    label: "Desain",
    icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01",
  },
```

Insert after the "Layanan" entry (line ~32).

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/Sidebar.tsx
git commit -m "feat: add Desain nav item to dashboard sidebar"
```

---

### Task 12: Landing Page Components (Part 1 — StickyBar, Hero, QueueWidget)

**Files:**
- Create: `components/landing/StickyBar.tsx`
- Create: `components/landing/HeroSection.tsx`
- Create: `components/landing/QueueWidget.tsx`

- [ ] **Step 1: Create StickyBar**

```typescript
"use client";

import Image from "next/image";
import Link from "next/link";

export default function StickyBar({
  barbershop,
  isOpen,
}: {
  barbershop: { name: string; logo_url: string | null; slug: string };
  isOpen: boolean;
}) {
  return (
    <div className="sticky top-0 z-50 bg-dark-900/95 backdrop-blur-sm border-b border-dark-800/50 px-4 py-3">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          {barbershop.logo_url ? (
            <Image
              src={barbershop.logo_url}
              alt=""
              width={32}
              height={32}
              className="rounded-lg object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-lg gold-gradient flex items-center justify-center">
              <span className="font-display text-xs font-bold text-dark-900">
                {barbershop.name[0]}
              </span>
            </div>
          )}
          <span className="font-display text-sm font-bold text-white">{barbershop.name}</span>
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              isOpen ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"
            }`}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        </div>
        {isOpen && (
          <Link
            href={`/q/${barbershop.slug}#join-queue`}
            className="px-4 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-xs"
          >
            Join Queue
          </Link>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create HeroSection**

```typescript
export default function HeroSection({
  barbershop,
  tagline,
  colors,
  isOpen,
}: {
  barbershop: { name: string };
  tagline?: string;
  colors?: { primary: string; accent: string; background: string };
  isOpen: boolean;
}) {
  const bg = colors?.background ?? "#0f0f0f";
  const primary = colors?.primary ?? "#d4a574";

  return (
    <section
      className="relative px-4 py-16 text-center overflow-hidden"
      style={{ background: `linear-gradient(180deg, ${bg}, ${bg}ee)` }}
    >
      <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at 50% 0%, ${primary}, transparent 70%)` }} />
      <div className="relative max-w-2xl mx-auto">
        <h1 className="font-display text-4xl sm:text-5xl font-bold text-white">
          {barbershop.name}
        </h1>
        {tagline && (
          <p className="text-dark-400 text-lg mt-4 max-w-md mx-auto">{tagline}</p>
        )}
        {isOpen && (
          <a
            href="#join-queue"
            className="inline-block mt-8 px-8 py-3 rounded-xl text-dark-900 font-bold text-sm"
            style={{ background: `linear-gradient(135deg, ${primary}, ${colors?.accent ?? primary})` }}
          >
            Join Queue Sekarang
          </a>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create QueueWidget**

```typescript
"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function QueueWidget({
  barbershopId,
  date,
  isOpen: initialOpen,
  totalServed: initialServed,
  waiting: initialWaiting,
}: {
  barbershopId: string;
  date: string;
  isOpen: boolean;
  totalServed: number;
  waiting: number;
}) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [waiting, setWaiting] = useState(initialWaiting);
  const [served, setServed] = useState(initialServed);

  useEffect(() => {
    const interval = setInterval(fetchQueue, 30000);
    return () => clearInterval(interval);
  }, [barbershopId, date]);

  const fetchQueue = async () => {
    const supabase = createClient();
    const { data: queue } = await supabase
      .from("queues")
      .select("id, is_open, total_served")
      .eq("barbershop_id", barbershopId)
      .eq("date", date)
      .maybeSingle();

    if (queue) {
      setIsOpen(!!queue.is_open);
      setServed(queue.total_served ?? 0);

      const { count } = await supabase
        .from("queue_entries")
        .select("id", { count: "exact", head: true })
        .eq("queue_id", queue.id)
        .in("status", ["waiting", "called", "serving"]);

      setWaiting(count ?? 0);
    }
  };

  if (!isOpen) {
    return (
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center">
            <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-dark-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-dark-300 font-semibold">Antrian Hari Ini Belum Dibuka</p>
            <p className="text-dark-500 text-sm mt-1">Silakan pilih tanggal lain atau tunggu hingga barbershop buka</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 text-center">
            <p className="font-display text-4xl font-bold text-barber-400">
              {waiting}
            </p>
            <p className="text-dark-400 text-sm mt-2">Sedang Menunggu</p>
          </div>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 text-center">
            <p className="font-display text-4xl font-bold text-white">{served}</p>
            <p className="text-dark-400 text-sm mt-2">Selesai</p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/StickyBar.tsx components/landing/HeroSection.tsx components/landing/QueueWidget.tsx
git commit -m "feat: add landing page core components (StickyBar, Hero, QueueWidget)"
```

---

### Task 13: Landing Page Components (Part 2 — Services, Gallery, Barbers)

**Files:**
- Create: `components/landing/ServicesSection.tsx`
- Create: `components/landing/GallerySection.tsx`
- Create: `components/landing/BarbersSection.tsx`

- [ ] **Step 1: Create ServicesSection**

```typescript
export default function ServicesSection({
  services,
}: {
  services: Array<{ id: string; name: string; price: number; duration_min: number }>;
}) {
  if (!services?.length) return null;

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Layanan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {services.map((s) => (
            <div key={s.id} className="bg-dark-800/50 border border-dark-700/30 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-white font-medium">{s.name}</h3>
                  <p className="text-dark-400 text-sm mt-1">{s.duration_min} menit</p>
                </div>
                <p className="font-display text-lg font-bold text-barber-400">
                  Rp{s.price.toLocaleString("id-ID")}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create GallerySection**

```typescript
"use client";

import { useState } from "react";

export default function GallerySection({
  images,
}: {
  images: Array<{ url: string; caption: string; order: number }>;
}) {
  const [selected, setSelected] = useState<number | null>(null);

  if (!images?.length) return null;

  const sorted = [...images].sort((a, b) => a.order - b.order);

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Gallery</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {sorted.map((img, index) => (
            <button
              key={img.url}
              onClick={() => setSelected(index)}
              className="rounded-xl overflow-hidden bg-dark-700/50 aspect-square"
            >
              <img src={img.url} alt={img.caption || "Gallery"} className="w-full h-full object-cover hover:scale-105 transition-transform" loading="lazy" />
            </button>
          ))}
        </div>
      </div>

      {selected !== null && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setSelected(null)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <img
            src={sorted[selected].url}
            alt={sorted[selected].caption || "Gallery"}
            className="max-w-full max-h-[80vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
          {sorted[selected].caption && (
            <p className="absolute bottom-4 left-0 right-0 text-center text-white text-sm">
              {sorted[selected].caption}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
```

- [ ] **Step 3: Create BarbersSection**

```typescript
import Image from "next/image";

export default function BarbersSection({
  barbers,
}: {
  barbers: Array<{ id: string; display_name: string; photo_url: string | null }>;
}) {
  if (!barbers?.length) return null;

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Tim Barber</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 snap-x">
          {barbers.map((b) => (
            <div key={b.id} className="flex-shrink-0 snap-start text-center">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-dark-700/50 border-2 border-dark-600/30 mx-auto">
                {b.photo_url ? (
                  <Image src={b.photo_url} alt={b.display_name} width={80} height={80} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-dark-500 text-xl font-bold">
                    {b.display_name[0]}
                  </div>
                )}
              </div>
              <p className="text-white text-sm mt-2 font-medium">{b.display_name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add components/landing/ServicesSection.tsx components/landing/GallerySection.tsx components/landing/BarbersSection.tsx
git commit -m "feat: add landing page content components (Services, Gallery, Barbers)"
```

---

### Task 14: Landing Page Components (Part 3 — Hours, Location, Testimonials, Footer)

**Files:**
- Create: `components/landing/HoursSection.tsx`
- Create: `components/landing/LocationSection.tsx`
- Create: `components/landing/TestimonialsSection.tsx`
- Create: `components/landing/LandingFooter.tsx`

- [ ] **Step 1: Create HoursSection**

```typescript
const dayLabels: Record<string, string> = {
  monday: "Senin",
  tuesday: "Selasa",
  wednesday: "Rabu",
  thursday: "Kamis",
  friday: "Jumat",
  saturday: "Sabtu",
  sunday: "Minggu",
};

export default function HoursSection({
  hours,
}: {
  hours: Record<string, { open: string; close: string; closed: boolean }>;
}) {
  if (!hours) return null;

  const todayIndex = new Date().getDay();
  const todayKey = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"][todayIndex];

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Jam Buka</h2>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          {Object.entries(dayLabels).map(([key, label]) => {
            const h = hours[key];
            if (!h) return null;
            const isToday = key === todayKey;
            return (
              <div
                key={key}
                className={`flex items-center justify-between px-4 py-3 ${
                  isToday ? "bg-dark-700/30" : ""
                } ${key !== "sunday" ? "border-b border-dark-700/20" : ""}`}
              >
                <span className={`text-sm ${isToday ? "text-white font-medium" : "text-dark-400"}`}>
                  {label}
                  {isToday && <span className="ml-2 text-barber-400 text-xs">(Hari Ini)</span>}
                </span>
                <span className={`text-sm ${h.closed ? "text-red-400" : "text-dark-300"}`}>
                  {h.closed ? "Tutup" : `${h.open} - ${h.close}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Create LocationSection**

```typescript
export default function LocationSection({
  barbershop,
}: {
  barbershop: { name: string; address: string | null; city: string | null; latitude: number | null; longitude: number | null; slug: string };
}) {
  const hasCoords = barbershop.latitude && barbershop.longitude;
  const address = [barbershop.address, barbershop.city].filter(Boolean).join(", ");

  if (!address && !hasCoords) return null;

  const mapsUrl = address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
    : `https://www.google.com/maps?q=${barbershop.latitude},${barbershop.longitude}`;

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Lokasi</h2>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl overflow-hidden">
          {hasCoords && (
            <div className="h-48 bg-dark-700/50" id="map-container" data-lat={barbershop.latitude} data-lng={barbershop.longitude} />
          )}
          <div className="p-4 space-y-3">
            <p className="text-white text-sm">{address}</p>
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-barber-400 text-sm hover:underline"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Buka di Google Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Create TestimonialsSection**

```typescript
"use client";

import { useState } from "react";

export default function TestimonialsSection({
  testimonials,
}: {
  testimonials: Array<{ name: string; rating: number; comment: string }>;
}) {
  const [current, setCurrent] = useState(0);

  if (!testimonials?.length) {
    return (
      <section className="px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-white mb-6">Testimoni</h2>
          <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-8 text-center">
            <p className="text-dark-400">Belum ada testimoni</p>
          </div>
        </div>
      </section>
    );
  }

  const t = testimonials[current];

  return (
    <section className="px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h2 className="font-display text-2xl font-bold text-white mb-6">Testimoni</h2>
        <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <svg key={i} className={`w-5 h-5 ${i < t.rating ? "text-yellow-400" : "text-dark-600"}`} fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
          <p className="text-white text-lg italic">"{t.comment}"</p>
          <p className="text-dark-400 text-sm mt-4">— {t.name}</p>
          {testimonials.length > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setCurrent((c) => (c - 1 + testimonials.length) % testimonials.length)}
                className="p-2 rounded-full bg-dark-700/50 text-dark-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <button
                onClick={() => setCurrent((c) => (c + 1) % testimonials.length)}
                className="p-2 rounded-full bg-dark-700/50 text-dark-400 hover:text-white"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Create LandingFooter**

```typescript
export default function LandingFooter() {
  return (
    <footer className="border-t border-dark-800/50 px-4 py-8 text-center">
      <p className="text-dark-500 text-sm">
        Powered by{" "}
        <a href="/" className="text-barber-400 hover:underline">
          Kapster
        </a>
      </p>
    </footer>
  );
}
```

- [ ] **Step 5: Commit**

```bash
git add components/landing/HoursSection.tsx components/landing/LocationSection.tsx components/landing/TestimonialsSection.tsx components/landing/LandingFooter.tsx
git commit -m "feat: add landing page remaining components (Hours, Location, Testimonials, Footer)"
```

---

### Task 15: Refactor Public Page to Landing Page

**Files:**
- Modify: `app/q/[slug]/page.tsx`

- [ ] **Step 1: Refactor the page**

Replace the entire content of `app/q/[slug]/page.tsx` with:

```typescript
import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import QueueDatePicker from "./QueueDatePicker";
import JoinQueueForm from "./JoinQueueForm";
import StickyBar from "@/components/landing/StickyBar";
import HeroSection from "@/components/landing/HeroSection";
import QueueWidget from "@/components/landing/QueueWidget";
import ServicesSection from "@/components/landing/ServicesSection";
import GallerySection from "@/components/landing/GallerySection";
import BarbersSection from "@/components/landing/BarbersSection";
import HoursSection from "@/components/landing/HoursSection";
import LocationSection from "@/components/landing/LocationSection";
import TestimonialsSection from "@/components/landing/TestimonialsSection";
import LandingFooter from "@/components/landing/LandingFooter";

const siteUrl = "https://kapster.my.id";

const getBarbershop = cache(async (slug: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("barbershops")
    .select("id, name, slug, city, address, settings_json, logo_url, latitude, longitude")
    .eq("slug", slug)
    .eq("is_active", true)
    .single();
  return data;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const barbershop = await getBarbershop(slug);
  if (!barbershop) return { title: "Not Found" };

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const showInDirectory = settings.show_in_directory !== false;

  return {
    title: `${barbershop.name} - Antrian Real-time`,
    description: `Cek antrian ${barbershop.name} secara real-time. Lihat berapa orang yang mengantri dan ambil nomor antrian online.`,
    alternates: { canonical: `${siteUrl}/q/${slug}` },
    robots: { index: showInDirectory, follow: showInDirectory },
    openGraph: {
      title: `${barbershop.name} | Kapster`,
      description: `Cek antrian ${barbershop.name} secara real-time.`,
      url: `${siteUrl}/q/${slug}`,
      siteName: "Kapster",
      locale: "id_ID",
      type: "website",
      images: barbershop.logo_url
        ? [{ url: barbershop.logo_url, width: 400, height: 400, alt: `Logo ${barbershop.name}` }]
        : undefined,
    },
  };
}

export default async function PublicQueuePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ date?: string }>;
}) {
  const { slug } = await params;
  const resolvedSearchParams = await searchParams;
  const barbershop = await getBarbershop(slug);
  if (!barbershop) notFound();

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];
  const selectedDate = resolvedSearchParams.date ?? today;

  const settings = (barbershop.settings_json as Record<string, unknown>) ?? {};
  const design = (settings.design as Record<string, unknown>) ?? {};
  const maxDays = (settings.booking_max_days as number) ?? 7;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + maxDays);
  const maxDateStr = maxDate.toISOString().split("T")[0];
  const validDate = selectedDate >= today && selectedDate <= maxDateStr ? selectedDate : today;

  const [{ data: queue }, { data: services }, { data: barbers }] = await Promise.all([
    supabase.from("queues").select("id, is_open, total_served").eq("barbershop_id", barbershop.id).eq("date", validDate).maybeSingle(),
    supabase.from("services").select("id, name, price, duration_min").eq("barbershop_id", barbershop.id).eq("is_active", true),
    supabase.from("barbers").select("id, display_name, photo_url").eq("barbershop_id", barbershop.id).eq("is_active", true),
  ]);

  const { count: waitingCount } = queue?.is_open
    ? await supabase.from("queue_entries").select("id", { count: "exact", head: true }).eq("queue_id", queue.id).in("status", ["waiting", "called", "serving"])
    : { count: 0 };

  const isOpen = !!queue?.is_open;

  // Design config
  const sections = ((design.sections as Record<string, { visible: boolean }>) ?? {});
  const colors = (design.colors as { primary: string; accent: string; background: string }) ?? { primary: "#d4a574", accent: "#c4956a", background: "#0f0f0f" };
  const template = (design.template as string) ?? "classic";
  const tagline = (design.tagline as string) ?? "";
  const galleryImages = (design.gallery_images as Array<{ url: string; caption: string; order: number }>) ?? [];
  const operatingHours = (design.operating_hours as Record<string, { open: string; close: string; closed: boolean }>) ?? {};
  const testimonials = (design.testimonials as Array<{ name: string; rating: number; comment: string }>) ?? [];

  const isSectionVisible = (key: string) => sections[key]?.visible ?? true;

  // Theme class based on template
  const themeClass = template === "modern" ? "bg-white" : "bg-dark-950";

  return (
    <div className={`min-h-screen ${themeClass}`}>
      <StickyBar barbershop={barbershop} isOpen={isOpen} />

      <HeroSection barbershop={barbershop} tagline={tagline} colors={colors} isOpen={isOpen} />

      <QueueWidget
        barbershopId={barbershop.id}
        date={validDate}
        isOpen={isOpen}
        totalServed={queue?.total_served ?? 0}
        waiting={waitingCount ?? 0}
      />

      {!isOpen && validDate === today && (
        <section className="px-4 py-4">
          <div className="max-w-md mx-auto">
            <div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-4">
              <label className="block text-dark-400 text-sm mb-2">Pilih Tanggal Antrian</label>
              <QueueDatePicker today={today} maxDate={maxDateStr} value={validDate} />
              {validDate !== today && (
                <p className="text-barber-400 text-xs mt-2">
                  Antrian untuk tanggal {new Date(validDate + "T00:00:00").toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {isSectionVisible("services") && <ServicesSection services={services ?? []} />}
      {isSectionVisible("gallery") && <GallerySection images={galleryImages} />}
      {isSectionVisible("barbers") && <BarbersSection barbers={barbers ?? []} />}
      {isSectionVisible("hours") && operatingHours && Object.keys(operatingHours).length > 0 && <HoursSection hours={operatingHours} />}
      {isSectionVisible("location") && <LocationSection barbershop={barbershop} />}
      {isSectionVisible("testimonials") && <TestimonialsSection testimonials={testimonials} />}

      {isOpen && (
        <section id="join-queue" className="px-4 py-8">
          <div className="max-w-md mx-auto">
            <h2 className="font-display text-2xl font-bold text-white mb-6">Join Queue</h2>
            <JoinQueueForm
              barbershopId={barbershop.id}
              date={validDate}
              slug={slug}
              services={services ?? []}
              barbers={barbers ?? []}
              isOpen={isOpen}
              selectedDate={validDate}
              today={today}
            />
          </div>
        </section>
      )}

      <LandingFooter />
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add app/q/[slug]/page.tsx
git commit -m "feat: refactor public queue page to landing page with sections"
```

---

### Task 16: Map Integration for Location Section

**Files:**
- Modify: `components/landing/LocationSection.tsx`
- Modify: `app/q/[slug]/page.tsx` (client-side map init)

- [ ] **Step 1: Add client-side map initialization**

Create a small client component to initialize maplibre on the LocationSection map container:

```typescript
// components/landing/LocationMap.tsx
"use client";

import { useEffect, useRef } from "react";

export default function LocationMap({ lat, lng }: { lat: number; lng: number }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    let map: unknown;

    import("maplibre-gl").then((maplibregl) => {
      map = new maplibregl.Map({
        container: containerRef.current!,
        style: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
        center: [lng, lat],
        zoom: 15,
        attributionControl: false,
      });

      new maplibregl.Marker().setLngLat([lng, lat]).addTo(map);
    });

    return () => {
      if (map) {
        (map as { remove: () => void }).remove();
      }
    };
  }, [lat, lng]);

  return <div ref={containerRef} className="h-48 w-full" />;
}
```

- [ ] **Step 2: Update LocationSection to use the map component**

In `components/landing/LocationSection.tsx`, replace the map placeholder div with:

```typescript
{hasCoords && <LocationMap lat={barbershop.latitude!} lng={barbershop.longitude!} />}
```

And add the import: `import LocationMap from "@/components/landing/LocationMap";`

- [ ] **Step 3: Commit**

```bash
git add components/landing/LocationMap.tsx components/landing/LocationSection.tsx
git commit -m "feat: add maplibre map to location section"
```

---

### Task 17: Verify and Test

**Files:**
- All modified/created files

- [ ] **Step 1: Run type check**

```bash
npx tsc --noEmit
```

Fix any type errors.

- [ ] **Step 2: Run lint**

```bash
npm run lint
```

Fix any lint errors.

- [ ] **Step 3: Run build**

```bash
npm run build
```

Fix any build errors.

- [ ] **Step 4: Manual test**

1. Start dev server: `npm run dev`
2. Login as barbershop owner
3. Navigate to `/dashboard/design`
4. Test template selection, color changes, section toggles
5. Upload gallery images
6. Set operating hours
7. Add testimonials
8. Visit `/q/{your-slug}` and verify landing page renders correctly
9. Test with different templates and section configurations

- [ ] **Step 5: Commit**

```bash
git add .
git commit -m "fix: address type/lint/build issues"
```
