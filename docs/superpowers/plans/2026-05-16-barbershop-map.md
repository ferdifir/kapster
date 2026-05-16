# Barbershop Map Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menambahkan fitur map untuk admin input lokasi barbershop dan halaman publik menampilkan semua barbershop dengan marker interaktif.

**Architecture:** Menggunakan MapCN.dev dengan OpenStreetMap. Dua komponen terpisah: (1) MapPicker untuk admin settings dengan click-to-set coordinate, (2) MapView untuk halaman publik dengan semua markers.

**Tech Stack:** Next.js 16 (App Router), MapCN.dev, Supabase (PostgreSQL), TypeScript, Tailwind CSS

---

## File Structure Plan

```
app/
├── dashboard/
│   └── settings/
│       └── page.tsx        (MODIFY - add map picker)
├── map/
│   └── page.tsx           (CREATE - public map page)
lib/
└── components/
    ├── MapPicker.tsx       (CREATE - click-to-set coordinate)
    └── MapView.tsx        (CREATE - display all markers)
```

---

### Task 1: Database Migration - Add Lat/Lng Columns

**Files:**
- Modify: Database migration via Supabase

- [ ] **Step 1: Create migration**

Run:
```bash
supabase migration new add_barbershop_coordinates
```

- [ ] **Step 2: Write migration SQL**

```sql
ALTER TABLE barbershops 
ADD COLUMN IF NOT EXISTS latitude numeric(10, 8),
ADD COLUMN IF NOT EXISTS longitude numeric(11, 8);
```

- [ ] **Step 3: Apply migration**

Run migration via Supabase CLI or dashboard

- [ ] **Step 4: Commit**

```bash
git commit -m "feat: add latitude and longitude columns to barbershops table"
```

---

### Task 2: Create MapPicker Component (Admin Click-to-Set)

**Files:**
- Create: `lib/components/MapPicker.tsx`
- Modify: `lib/supabase/types.ts` (add lat/lng to Barbershop type)

- [ ] **Step 1: Write the test first**

```typescript
// lib/components/MapPicker.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MapPicker from './MapPicker';

describe('MapPicker', () => {
  it('renders map container', () => {
    render(<MapPicker latitude={null} longitude={null} onLocationChange={() => {}} />);
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
  });

  it('shows initial marker when coordinates provided', () => {
    render(
      <MapPicker 
        latitude={-6.2088} 
        longitude={106.8456} 
        onLocationChange={() => {}} 
      />
    );
    expect(screen.getByTestId('marker')).toBeInTheDocument();
  });

  it('calls onLocationChange when map is clicked', () => {
    const onChange = jest.fn();
    render(<MapPicker latitude={null} longitude={null} onLocationChange={onChange} />);
    
    // Simulate map click
    // ... (depends on MapCN implementation)
    
    expect(onChange).toHaveBeenCalledWith({
      latitude: expect.any(Number),
      longitude: expect.any(Number)
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: Test fails - component not found

- [ ] **Step 3: Write MapPicker implementation**

```typescript
// lib/components/MapPicker.tsx
'use client';

import { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
}

declare global {
  interface Window {
    mapcn?: {
      Map: new (el: HTMLElement, options?: object) => {
        on: (event: string, callback: (e: { lnglat: { lat: number; lng: number } }) => void) => void;
        setCenter: (center: [number, number]) => void;
        setZoom: (zoom: number) => void;
        addControl: (control: unknown) => void;
      };
      Marker: new (options?: object) => {
        addTo: (map: unknown) => void;
        setLngLat: (lnglat: [number, number]) => void;
        on: (event: string, callback: () => void) => void;
        remove: () => void;
      };
    };
  }
}

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    const initMap = async () => {
      // Load MapCN script if not present
      if (!window.mapcn) {
        const script = document.createElement('script');
        script.src = 'https://api.mapcn.dev/mapcn.js';
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Initialize map
      const map = new window.mapcn!.Map(mapContainer.current!, {
        center: longitude && latitude ? [longitude, latitude] : [106.8456, -6.2088], // Jakarta default
        zoom: 13,
        mapStyle: 'light',
        map: 'osm' // OpenStreetMap
      });

      mapRef.current = map;

      // Add click handler
      map.on('click', (e: { lnglat: { lat: number; lng: number } }) => {
        const { lat, lng } = e.lnglat;
        onLocationChange({ latitude: lat, longitude: lng });
        
        // Update or create marker
        if (markerRef.current) {
          (markerRef.current as { setLngLat: (lnglat: [number, number]) => void }).setLngLat([lng, lat]);
        } else {
          const marker = new window.mapcn!.Marker({ draggable: true });
          marker.setLngLat([lng, lat]);
          marker.addTo(map);
          markerRef.current = marker;
        }
      });

      // Show existing marker if coordinates provided
      if (latitude && longitude) {
        const marker = new window.mapcn!.Marker({ draggable: true });
        marker.setLngLat([longitude, latitude]);
        marker.addTo(map);
        markerRef.current = marker;
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        // Cleanup if needed
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <div 
        ref={mapContainer} 
        data-testid="map-container"
        className="w-full h-64 rounded-lg border border-gray-300"
      />
      <p className="text-sm text-gray-600">
        Klik pada map untuk menetapkan lokasi. Koordinat akan otomatis terisi.
      </p>
      {latitude && longitude && (
        <p className="text-sm text-green-600">
          Lokasi terpasang: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Update types**

```typescript
// lib/supabase/types.ts - add to barbershops Row type
latitude: number | null
longitude: number | null
```

- [ ] **Step 6: Commit**

```bash
git add lib/components/MapPicker.tsx lib/supabase/types.ts
git commit -m "feat: add MapPicker component for admin location input"
```

---

### Task 3: Create MapView Component (Public Multi-Marker)

**Files:**
- Create: `lib/components/MapView.tsx`

- [ ] **Step 1: Write the test**

```typescript
// lib/components/MapView.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import MapView from './MapView';

interface BarbershopMarker {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  address?: string | null;
}

const mockBarbershops: BarbershopMarker[] = [
  { id: '1', name: 'Barbershop A', slug: 'barbershop-a', latitude: -6.2088, longitude: 106.8456, address: 'Jakarta' },
  { id: '2', name: 'Barbershop B', slug: 'barbershop-b', latitude: -6.1751, longitude: 106.8650, address: 'Jakarta Pusat' },
];

describe('MapView', () => {
  it('renders map container', () => {
    render(<MapView barbershops={[]} />);
    expect(screen.getByTestId('map-view-container')).toBeInTheDocument();
  });

  it('displays all barbershop markers', () => {
    render(<MapView barbershops={mockBarbershops} />);
    // Verify markers are rendered (implementation dependent)
  });

  it('shows popup with barbershop info on marker click', () => {
    const onMarkerClick = jest.fn();
    render(<MapView barbershops={mockBarbershops} onMarkerClick={onMarkerClick} />);
    // Click marker...
    expect(onMarkerClick).toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

- [ ] **Step 3: Write MapView implementation**

```typescript
// lib/components/MapView.tsx
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface BarbershopMarker {
  id: string;
  name: string;
  slug: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  logo_url?: string | null;
}

interface MapViewProps {
  barbershops: BarbershopMarker[];
  onMarkerClick?: (slug: string) => void;
}

declare global {
  interface Window {
    mapcn?: {
      Map: new (el: HTMLElement, options?: object) => {
        on: (event: string, callback: (e: unknown) => void) => void;
        setCenter: (center: [number, number]) => void;
        setZoom: (zoom: number) => void;
        addControl: (control: unknown) => void;
        flyTo: (options: object) => void;
      };
      Marker: new (options?: { element?: HTMLElement }) => {
        addTo: (map: unknown) => void;
        setLngLat: (lnglat: [number, number]) => void;
        on: (event: string, callback: () => void) => void;
        getElement: () => HTMLElement;
        remove: () => void;
      };
      Popup: new (options?: object) => {
        setLngLat: (lnglat: [number, number]) => void;
        setHTML: (html: string) => void;
        addTo: (map: unknown) => void;
        remove: () => void;
        on: (event: string, callback: () => void) => void;
      };
    };
  }
}

export default function MapView({ barbershops, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    const initMap = async () => {
      // Load MapCN script
      if (!window.mapcn) {
        const script = document.createElement('script');
        script.src = 'https://api.mapcn.dev/mapcn.js';
        script.async = true;
        document.head.appendChild(script);
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }

      // Calculate center from all barbershops or default to Indonesia
      const center = barbershops.length > 0
        ? [barbershops[0].longitude, barbershops[0].latitude]
        : [106.8456, -6.2088];

      const map = new window.mapcn!.Map(mapContainer.current!, {
        center: center as [number, number],
        zoom: 12,
        mapStyle: 'light',
        map: 'osm'
      });

      // Add markers for each barbershop
      barbershops.forEach((shop) => {
        if (!shop.latitude || !shop.longitude) return;

        const marker = new window.mapcn!.Marker({
          element: createMarkerElement(shop.name)
        });
        
        marker.setLngLat([shop.longitude, shop.latitude]);
        marker.addTo(map);

        // Create popup
        const popup = new window.mapcn!.Popup({
          closeButton: true,
          closeOnClick: true
        });

        popup.setHTML(`
          <div class="p-2 min-w-48">
            <h3 class="font-semibold text-lg">${shop.name}</h3>
            ${shop.address ? `<p class="text-sm text-gray-600">${shop.address}</p>` : ''}
            <button 
              class="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
              onclick="window.location.href='/q/${shop.slug}'"
            >
              Lihat Queue
            </button>
          </div>
        `);

        marker.on('click', () => {
          popup.setLngLat([shop.longitude, shop.latitude]);
          popup.addTo(map);
        });

        if (onMarkerClick) {
          marker.on('click', () => onMarkerClick(shop.slug));
        }
      });
    };

    initMap();
  }, [barbershops, onMarkerClick]);

  return (
    <div 
      ref={mapContainer} 
      data-testid="map-view-container"
      className="w-full h-full min-h-[500px] rounded-lg"
    />
  );
}

function createMarkerElement(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `
    <div class="bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg text-sm font-medium cursor-pointer hover:bg-blue-700 transition transform hover:scale-105">
      ${name}
    </div>
  `;
  return el;
}
```

- [ ] **Step 4: Run test to verify it passes**

- [ ] **Step 5: Commit**

```bash
git add lib/components/MapView.tsx
git commit -m "feat: add MapView component for public map display"
```

---

### Task 4: Update Dashboard Settings with MapPicker

**Files:**
- Modify: `app/dashboard/settings/page.tsx`
- Modify: `app/dashboard/settings/actions.ts`

- [ ] **Step 1: Check existing settings page structure**

Read: `app/dashboard/settings/page.tsx`

- [ ] **Step 2: Add location fields and MapPicker**

```typescript
// app/dashboard/settings/page.tsx
import MapPicker from '@/lib/components/MapPicker';
// ... existing imports

interface SettingsPageProps {
  // ... existing props
}

// In the form, add:
<div className="space-y-4">
  <h3 className="font-semibold">Lokasi Barbershop</h3>
  <MapPicker
    latitude={barbershop?.latitude ?? null}
    longitude={barbershop?.longitude ?? null}
    onLocationChange={async (coords) => {
      // Update coordinates via action
      await updateBarbershopLocation(coords.latitude, coords.longitude);
    }}
  />
  <input type="hidden" name="latitude" value={barbershop?.latitude ?? ''} />
  <input type="hidden" name="longitude" value={barbershop?.longitude ?? ''} />
</div>
```

- [ ] **Step 3: Add update location action**

```typescript
// app/dashboard/settings/actions.ts
export async function updateBarbershopLocation(
  barbershopId: string,
  latitude: number,
  longitude: number
) {
  const supabase = createClient();
  
  const { error } = await supabase
    .from('barbershops')
    .update({ latitude, longitude })
    .eq('id', barbershopId);
  
  if (error) throw new Error(error.message);
  return { success: true };
}
```

- [ ] **Step 4: Test the integration**

Run dev server, navigate to settings, verify map appears

- [ ] **Step 5: Commit**

```bash
git add app/dashboard/settings/
git commit -m "feat: integrate MapPicker in dashboard settings"
```

---

### Task 5: Create Public Map Page

**Files:**
- Create: `app/map/page.tsx`

- [ ] **Step 1: Create server component to fetch barbershops**

```typescript
// app/map/page.tsx
import { createClient } from '@/lib/supabase/server';
import MapView from '@/lib/components/MapView';

export default async function PublicMapPage() {
  const supabase = createClient();
  
  const { data: barbershops } = await supabase
    .from('barbershops')
    .select('id, name, slug, address, latitude, longitude, logo_url')
    .eq('is_active', true)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  return (
    <main className="min-h-screen p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Peta Barbershop</h1>
        <p className="text-gray-600 mb-4">
          Temukan barbershop terdekat di sekitar Anda
        </p>
        <div className="h-[600px] rounded-lg overflow-hidden border">
          <MapView barbershops={barbershops ?? []} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 2: Test the page**

Navigate to `/map`, verify all barbershops with coordinates show on map

- [ ] **Step 3: Commit**

```bash
git add app/map/
git commit -m "feat: add public map page at /map"
```

---

### Task 6: Add Link to Map from Navigation

**Files:**
- Modify: `app/layout.tsx` or relevant navigation component

- [ ] **Step 1: Find navigation**

Check where main navigation lives

- [ ] **Step 2: Add map link**

```typescript
// Add to nav
<Link href="/map" className="...">
  Peta
</Link>
```

- [ ] **Step 3: Commit**

---

### Task 7: Final Integration Test

- [ ] **Step 1: Test admin flow**
   - Navigate to /dashboard/settings
   - Verify map picker loads
   - Click on map
   - Verify coordinates save

- [ ] **Step 2: Test public flow**
   - Navigate to /map
   - Verify barbershop markers appear
   - Click marker
   - Verify popup shows
   - Click "Lihat Queue" button
   - Verify navigation to /q/[slug]

- [ ] **Step 3: Test with no coordinates**
   - Verify barbershops without lat/lng don't show on map

- [ ] **Step 4: Final commit**

```bash
git commit -m "feat: complete barbershop map feature - admin settings map picker and public map page"
```

---

## Spec Coverage Check

1. ✅ Database migration for lat/lng columns
2. ✅ Dashboard settings map picker - admin click to set location
3. ✅ Public map page at /map - display all barbershops with markers
4. ✅ Click marker → navigate to barbershop queue page
5. ✅ MapCN.dev with OpenStreetMap

## Remaining Considerations

- MapCN.dev API version/compatibility - verify latest API
- Mobile responsiveness for map components
- Error handling for failed map script load
- Loading states while map initializes

---

## Execution Choice

**Plan complete and saved to `docs/superpowers/plans/2026-05-16-barbershop-map.md`. Two execution options:**

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**