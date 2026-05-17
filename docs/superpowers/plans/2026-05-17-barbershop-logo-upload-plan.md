# Barbershop Logo Upload Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add logo upload in admin dashboard settings and display the logo on public-facing pages (Display Queue and Booking Customer).

**Architecture:** Client-side upload to Supabase Storage bucket `logos`, Server Action to persist the URL in `barbershops.logo_url`, public pages query and render the logo with SVG fallback.

**Tech Stack:** Next.js 16 App Router, Supabase Storage, React Client Components, Server Actions, Tailwind CSS

---

### Task 1: Create Supabase Storage Migration

**Files:**
- Create: `supabase/migrations/add_logo_storage.sql`

- [ ] **Step 1: Write the migration SQL**

Create `supabase/migrations/add_logo_storage.sql`:

```sql
-- Create storage bucket for barbershop logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow public read access to logo files
CREATE POLICY "Logos are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'logos');

-- Policy: Allow authenticated users to upload logos
-- The file path is logos/{barbershop_id}/logo.{ext}
-- We verify the user owns the barbershop by checking the barbershops table
CREATE POLICY "Authenticated users can upload logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to update (overwrite) their logos
CREATE POLICY "Authenticated users can update their logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);

-- Policy: Allow authenticated users to delete their old logos
CREATE POLICY "Authenticated users can delete their logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'logos'
  AND auth.role() = 'authenticated'
  AND (
    SELECT owner_id FROM public.barbershops
    WHERE id = (storage.foldername(name))[1]::uuid
  ) = auth.uid()
);
```

- [ ] **Step 2: Apply the migration**

Run:
```bash
npx supabase db push --db-url "$DATABASE_URL"
```

Or apply via Supabase dashboard SQL editor if CLI is not configured.

- [ ] **Step 3: Verify bucket exists**

Check via Supabase dashboard → Storage → `logos` bucket should be visible and public.

---

### Task 2: Create LogoUploader Client Component

**Files:**
- Create: `components/dashboard/LogoUploader.tsx`

- [ ] **Step 1: Write the LogoUploader component**

Create `components/dashboard/LogoUploader.tsx`:

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { updateBarbershopLogo } from "@/app/dashboard/settings/actions";
import Logo from "@/components/Logo";

interface LogoUploaderProps {
  barbershopId: string;
  currentLogoUrl: string | null;
}

export default function LogoUploader({ barbershopId, currentLogoUrl }: LogoUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(currentLogoUrl);

  const MAX_SIZE = 2 * 1024 * 1024; // 2MB
  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");
    setSuccess(false);

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("File harus berupa gambar (PNG, JPG, WebP, atau GIF)");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("Ukuran file maksimal 2MB");
      return;
    }

    setUploading(true);

    try {
      const ext = file.type.split("/")[1];
      const fileName = `logo.${ext}`;
      const filePath = `${barbershopId}/${fileName}`;

      const supabase = createClient();

      const { data, error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      setPreviewUrl(publicUrl);

      const result = await updateBarbershopLogo(barbershopId, publicUrl);
      if (result.error) throw new Error(result.error);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Gagal mengupload logo";
      setError(message);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
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
          Logo berhasil diperbarui
        </div>
      )}

      <div className="flex items-center gap-6">
        <label className="relative cursor-pointer group">
          <div className="w-28 h-28 rounded-2xl overflow-hidden bg-dark-700/50 border-2 border-dark-600/30 flex items-center justify-center group-hover:border-barber-400/50 transition-colors">
            {previewUrl ? (
              <>
                <img
                  src={previewUrl}
                  alt="Logo barbershop"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-dark-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xs font-medium">Ganti</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 text-dark-500">
                <Logo className="w-10 h-10" />
                <span className="text-xs">No logo</span>
              </div>
            )}
          </div>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        <div>
          <p className="text-white font-medium text-sm">Logo Barbershop</p>
          <p className="text-dark-500 text-xs mt-1">
            PNG, JPG, WebP, atau GIF. Maks 2MB.
          </p>
          <button
            type="button"
            onClick={() => {
              const input = document.querySelector(
                'input[type="file"]'
              ) as HTMLInputElement;
              input?.click();
            }}
            disabled={uploading}
            className="mt-3 px-4 py-2 rounded-xl gold-gradient text-dark-900 font-bold text-xs disabled:opacity-50"
          >
            {uploading ? "Mengupload..." : previewUrl ? "Ganti Logo" : "Upload Logo"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

Expected: No errors related to LogoUploader.

---

### Task 3: Add Server Action for Logo Update

**Files:**
- Modify: `app/dashboard/settings/actions.ts`

- [ ] **Step 1: Add `updateBarbershopLogo` server action**

Append to `app/dashboard/settings/actions.ts`:

```typescript
export async function updateBarbershopLogo(
  barbershopId: string,
  logoUrl: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Unauthorized" };

  const { data: barbershop } = await supabase
    .from("barbershops")
    .select("id, logo_url, owner_id")
    .eq("id", barbershopId)
    .eq("owner_id", user.id)
    .single();

  if (!barbershop) return { error: "Unauthorized" };

  // Delete old logo from storage if it exists and is different
  if (barbershop.logo_url && barbershop.logo_url !== logoUrl) {
    try {
      const oldUrl = new URL(barbershop.logo_url);
      const pathParts = oldUrl.pathname.split("/storage/v1/object/public/logos/");
      if (pathParts.length === 2) {
        const oldPath = decodeURIComponent(pathParts[1]);
        const admin = createAdminClient();
        await admin.storage.from("logos").remove([oldPath]);
      }
    } catch {
      // Silently ignore cleanup errors — old logo will remain orphaned
    }
  }

  const { error } = await supabase
    .from("barbershops")
    .update({ logo_url: logoUrl })
    .eq("id", barbershopId);

  if (error) return { error: error.message };

  revalidatePath("/dashboard/settings");
  revalidatePath("/display/[slug]");
  revalidatePath("/q/[slug]");

  return {};
}
```

Add import at the top of the file:
```typescript
import { createAdminClient } from "@/lib/supabase/admin";
```

- [ ] **Step 2: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

---

### Task 4: Integrate LogoUploader into Settings Page

**Files:**
- Modify: `app/dashboard/settings/page.tsx`
- Modify: `components/dashboard/SettingsForm.tsx`

- [ ] **Step 1: Update Settings page query to include logo_url**

Modify `app/dashboard/settings/page.tsx`, change the query from:
```typescript
.select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json")
```
to:
```typescript
.select("id, name, slug, address, city, phone, wa_number, latitude, longitude, settings_json, logo_url")
```

- [ ] **Step 2: Update SettingsForm to include LogoUploader**

Modify `components/dashboard/SettingsForm.tsx`:

Add import at top:
```tsx
import LogoUploader from "@/components/dashboard/LogoUploader";
```

Update the `Barbershop` type to include `logo_url`:
```tsx
type Barbershop = {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  wa_number: string | null;
  latitude: number | null;
  longitude: number | null;
  settings_json: Json;
  logo_url: string | null;
};
```

Add the Branding section as the first section inside the form (right after the error/success divs, before the "Informasi Barbershop" section):

```tsx
<div className="bg-dark-800/50 border border-dark-700/30 rounded-2xl p-6 space-y-4">
  <h2 className="font-semibold text-white">Branding</h2>
  <LogoUploader
    barbershopId={barbershop.id}
    currentLogoUrl={barbershop.logo_url}
  />
</div>
```

- [ ] **Step 3: Verify TypeScript compiles**

Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 4: Test the build**

Run:
```bash
npm run build
```

Expected: Build succeeds.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/add_logo_storage.sql components/dashboard/LogoUploader.tsx app/dashboard/settings/actions.ts app/dashboard/settings/page.tsx components/dashboard/SettingsForm.tsx
git commit -m "feat: add logo upload to admin dashboard settings"
```

---

### Task 5: Display Logo on Display Queue Page

**Files:**
- Modify: `app/display/[slug]/page.tsx`

- [ ] **Step 1: Update barbershop query to include logo_url**

In `app/display/[slug]/page.tsx`, change line 43-44 from:
```typescript
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name")
  .eq("slug", slug)
  .eq("is_active", true)
  .single();
```
to:
```typescript
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name, logo_url")
  .eq("slug", slug)
  .eq("is_active", true)
  .single();
```

- [ ] **Step 2: Update the Queue type to include logo_url**

Change the `Queue` type's barbershops field:
```typescript
type Queue = {
  id: string;
  is_open: boolean;
  total_served: number;
  barbershops: { name: string; logo_url: string | null } | null;
};
```

- [ ] **Step 3: Update the queueWithName construction**

Change line 61-63 from:
```typescript
const queueWithName = q
  ? { ...q, barbershops: { name: barbershop.name } }
  : null;
```
to:
```typescript
const queueWithName = q
  ? { ...q, barbershops: { name: barbershop.name, logo_url: barbershop.logo_url } }
  : null;
```

- [ ] **Step 4: Update header to display logo**

In the header section (around line 108-118), replace:
```tsx
<div className="bg-dark-900 border-b border-dark-800/50 px-8 py-4 flex items-center justify-between">
  <span className="font-display text-xl font-bold text-white">
    Kapster
  </span>
  <div className="text-right">
    <p className="text-white font-semibold">{barbershopName}</p>
    <p className="text-dark-400 text-sm">
      {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
</div>
```

with:
```tsx
<div className="bg-dark-900 border-b border-dark-800/50 px-8 py-4 flex items-center justify-between">
  <div className="flex items-center gap-3">
    {queue?.barbershops?.logo_url ? (
      <img
        src={queue.barbershops.logo_url}
        alt="Logo"
        className="w-10 h-10 rounded-lg object-cover"
      />
    ) : (
      <div className="w-10 h-10 rounded-lg gold-gradient flex items-center justify-center">
        <span className="font-display text-sm font-bold text-dark-900">
          {barbershopName[0]}
        </span>
      </div>
    )}
    <span className="font-display text-xl font-bold text-white">
      {barbershopName}
    </span>
  </div>
  <div className="text-right">
    <p className="text-white font-semibold">{barbershopName}</p>
    <p className="text-dark-400 text-sm">
      {now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
    </p>
  </div>
</div>
```

- [ ] **Step 5: Verify TypeScript compiles and build**

Run:
```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 6: Commit**

```bash
git add app/display/\[slug\]/page.tsx
git commit -m "feat: display barbershop logo on display queue page"
```

---

### Task 6: Display Logo on Booking Customer Page

**Files:**
- Modify: `app/q/[slug]/page.tsx`

- [ ] **Step 1: Update barbershop query to include logo_url**

In `app/q/[slug]/page.tsx`, change line 17-19 from:
```typescript
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name, city, address, settings_json")
  .eq("slug", slug)
  .eq("is_active", true)
  .single();
```
to:
```typescript
const { data: barbershop } = await supabase
  .from("barbershops")
  .select("id, name, city, address, settings_json, logo_url")
  .eq("slug", slug)
  .eq("is_active", true)
  .single();
```

- [ ] **Step 2: Replace avatar inisial dengan logo**

In the return JSX (around line 79-91), replace:
```tsx
<div className="text-center">
  <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4">
    <span className="font-display text-xl font-bold text-dark-900">
      {barbershop.name[0]}
    </span>
  </div>
  <h1 className="font-display text-2xl font-bold text-white">
    {barbershop.name}
  </h1>
  {barbershop.city && (
    <p className="text-dark-400 text-sm mt-1">{barbershop.city}</p>
  )}
</div>
```

with:
```tsx
<div className="text-center">
  {barbershop.logo_url ? (
    <img
      src={barbershop.logo_url}
      alt={`Logo ${barbershop.name}`}
      className="w-20 h-20 rounded-2xl object-cover mx-auto mb-4"
    />
  ) : (
    <div className="w-16 h-16 rounded-2xl gold-gradient flex items-center justify-center mx-auto mb-4">
      <span className="font-display text-xl font-bold text-dark-900">
        {barbershop.name[0]}
      </span>
    </div>
  )}
  <h1 className="font-display text-2xl font-bold text-white">
    {barbershop.name}
  </h1>
  {barbershop.city && (
    <p className="text-dark-400 text-sm mt-1">{barbershop.city}</p>
  )}
</div>
```

- [ ] **Step 3: Verify TypeScript compiles and build**

Run:
```bash
npx tsc --noEmit && npm run build
```

- [ ] **Step 4: Commit**

```bash
git add app/q/\[slug\]/page.tsx
git commit -m "feat: display barbershop logo on booking customer page"
```

---

### Task 7: Regenerate TypeScript Types

**Files:**
- Modify: `lib/supabase/types.ts`

- [ ] **Step 1: Regenerate Supabase types**

Run:
```bash
npx supabase gen types typescript --project-id arlpgnxtdbtvuxqvcytg --schema public > lib/supabase/types.ts
```

Or manually update the `barbershops` table types to confirm `logo_url: string | null` is present in Row, Insert, and Update types (it should already be there from prior generation).

- [ ] **Step 2: Verify types compile**

Run:
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add lib/supabase/types.ts
git commit -m "chore: regenerate supabase types"
```
