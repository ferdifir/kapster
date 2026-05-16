'use client';

import { useEffect, useRef, useState } from 'react';
import type { MapCNMap, MapCNMarker, MapCNPopup } from '@/types/mapcn';

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

interface MapCNLib {
  Map: new (el: HTMLElement, options?: object) => MapCNMap;
  Marker: new (options?: { element?: HTMLElement }) => MapCNMarker;
  Popup: new (options?: object) => MapCNPopup;
}

const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];
const MAPCN_SCRIPT_URL = 'https://api.mapcn.dev/mapcn.js';
const SCRIPT_LOAD_TIMEOUT = 10000;

function loadMapCNScript(): Promise<void> {
  if (window.mapcn) return Promise.resolve();
  if (document.querySelector(`script[src="${MAPCN_SCRIPT_URL}"]`)) {
    return new Promise((resolve, reject) => {
      const start = Date.now();
      const check = () => {
        if (window.mapcn) resolve();
        else if (Date.now() - start > SCRIPT_LOAD_TIMEOUT) reject(new Error('Timeout memuat peta'));
        else setTimeout(check, 50);
      };
      check();
    });
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = MAPCN_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Gagal memuat peta'));
    document.head.appendChild(script);
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function createMarkerElement(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'marker';
  const inner = document.createElement('div');
  inner.style.cssText = 'background: #c4740b; color: #0a0a0a; padding: 6px 12px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(196, 116, 11, 0.4); font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;';
  inner.textContent = name;
  inner.addEventListener('mouseenter', () => {
    inner.style.background = '#e8950f';
    inner.style.transform = 'scale(1.05)';
  });
  inner.addEventListener('mouseleave', () => {
    inner.style.background = '#c4740b';
    inner.style.transform = 'scale(1)';
  });
  el.appendChild(inner);
  return el;
}

export default function MapView({ barbershops, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCNMap | null>(null);
  const markersRef = useRef<MapCNMarker[]>([]);
  const popupsRef = useRef<MapCNPopup[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);
  const isInitializedRef = useRef(false);
  const prevBarbershopIdsRef = useRef<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    const container = mapContainer.current;
    if (!container || typeof window === 'undefined') return;

    let cancelled = false;

    const initMap = async () => {
      try {
        await loadMapCNScript();

        if (cancelled || !window.mapcn) return;

        const center = barbershops.length > 0
          ? [barbershops[0].longitude, barbershops[0].latitude] as [number, number]
          : DEFAULT_CENTER;

        const map = new window.mapcn.Map(container, {
          center,
          zoom: 12,
          mapStyle: 'dark',
          map: 'osm',
        });

        mapRef.current = map;

        addMarkers(barbershops, window.mapcn, map);
        isInitializedRef.current = true;
        prevBarbershopIdsRef.current = barbershops.map((b) => b.id);

        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Terjadi kesalahan');
          setLoading(false);
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      clearMarkers();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Update markers when barbershops prop changes (after map is initialized)
  useEffect(() => {
    if (!isInitializedRef.current || !mapRef.current || !window.mapcn) return;
    const currentIds = barbershops.map((b) => b.id);
    if (JSON.stringify(currentIds) === JSON.stringify(prevBarbershopIdsRef.current)) return;
    prevBarbershopIdsRef.current = currentIds;
    clearMarkers();
    addMarkers(barbershops, window.mapcn, mapRef.current);
  }, [barbershops]);

  function addMarkers(shops: BarbershopMarker[], mapcn: MapCNLib, map: MapCNMap) {
    const validBarbershops = shops.filter(
      (shop) => shop.latitude != null && shop.longitude != null
    );

    validBarbershops.forEach((shop) => {
      const marker = new mapcn.Marker({
        element: createMarkerElement(shop.name),
      });

      marker.setLngLat([shop.longitude, shop.latitude]);
      marker.addTo(map);
      markersRef.current.push(marker);

      const popup = new mapcn.Popup({
        closeButton: true,
        closeOnClick: true,
      });

      popup.setHTML(`
        <div style="padding: 12px; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;">
          <h3 style="font-weight: 600; font-size: 1rem; color: #f1ab2a; margin-bottom: 4px;">${escapeHtml(shop.name)}</h3>
          ${shop.address ? `<p style="font-size: 0.875rem; color: #737373; margin-bottom: 8px;">${escapeHtml(shop.address)}</p>` : ''}
          <a
            href="/q/${escapeHtml(shop.slug)}"
            style="display: inline-block; margin-top: 4px; padding: 8px 16px; background: #c4740b; color: #0a0a0a; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.875rem; font-weight: 600;"
          >
            Lihat Queue
          </a>
        </div>
      `);

      marker.on('click', () => {
        popup.setLngLat([shop.longitude, shop.latitude]);
        popup.addTo(map);
        if (onMarkerClickRef.current) {
          onMarkerClickRef.current(shop.slug);
        }
      });

      popupsRef.current.push(popup);
    });
  }

  function clearMarkers() {
    popupsRef.current.forEach((p) => p.remove());
    popupsRef.current = [];
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];
  }

  return (
    <div className="relative">
      <div
        ref={mapContainer}
        data-testid="map-view-container"
        className="w-full h-full min-h-[500px] rounded-2xl border border-dark-700/30 bg-dark-800/50"
      />
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-dark-800/80">
          <div className="text-barber-400 text-sm">Memuat peta...</div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center rounded-2xl bg-dark-800/80">
          <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            {error}
          </div>
        </div>
      )}
    </div>
  );
}
