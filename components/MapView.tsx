'use client';

import { useEffect, useRef } from 'react';
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

const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];
const MAPCN_SCRIPT_URL = 'https://api.mapcn.dev/mapcn.js';

function loadMapCNScript(): Promise<void> {
  if (window.mapcn) return Promise.resolve();
  if (document.querySelector(`script[src="${MAPCN_SCRIPT_URL}"]`)) {
    return new Promise((resolve) => {
      const check = () => {
        if (window.mapcn) resolve();
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

function createMarkerElement(name: string): HTMLElement {
  const el = document.createElement('div');
  el.className = 'marker';
  el.innerHTML = `
    <div style="background: #c4740b; color: #0a0a0a; padding: 6px 12px; border-radius: 9999px; box-shadow: 0 4px 12px rgba(196, 116, 11, 0.4); font-size: 0.875rem; font-weight: 600; cursor: pointer; white-space: nowrap; transition: all 0.2s ease;" onmouseover="this.style.background='#e8950f';this.style.transform='scale(1.05)'" onmouseout="this.style.background='#c4740b';this.style.transform='scale(1)'">
      ${name}
    </div>
  `;
  return el;
}

export default function MapView({ barbershops, onMarkerClick }: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCNMap | null>(null);
  const markersRef = useRef<MapCNMarker[]>([]);
  const onMarkerClickRef = useRef(onMarkerClick);

  onMarkerClickRef.current = onMarkerClick;

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    let cancelled = false;
    const popups: MapCNPopup[] = [];

    const initMap = async () => {
      try {
        await loadMapCNScript();

        if (cancelled || !window.mapcn) return;

        const center = barbershops.length > 0
          ? [barbershops[0].longitude, barbershops[0].latitude] as [number, number]
          : DEFAULT_CENTER;

        const map = new window.mapcn.Map(mapContainer.current!, {
          center,
          zoom: 12,
          mapStyle: 'dark',
          map: 'osm',
        });

        mapRef.current = map;

        const validBarbershops = barbershops.filter(
          (shop) => shop.latitude != null && shop.longitude != null
        );

        validBarbershops.forEach((shop) => {
          const marker = new window.mapcn!.Marker({
            element: createMarkerElement(shop.name),
          });

          marker.setLngLat([shop.longitude, shop.latitude]);
          marker.addTo(map);
          markersRef.current.push(marker);

          const popup = new window.mapcn!.Popup({
            closeButton: true,
            closeOnClick: true,
          });

          popup.setHTML(`
            <div style="padding: 12px; background: #1a1a1a; border: 1px solid #2a2a2a; border-radius: 8px;">
              <h3 style="font-weight: 600; font-size: 1rem; color: #f1ab2a; margin-bottom: 4px;">${shop.name}</h3>
              ${shop.address ? `<p style="font-size: 0.875rem; color: #737373; margin-bottom: 8px;">${shop.address}</p>` : ''}
              <a
                href="/q/${shop.slug}"
                style="display: inline-block; margin-top: 4px; padding: 8px 16px; background: #c4740b; color: #0a0a0a; border: none; border-radius: 6px; cursor: pointer; text-decoration: none; font-size: 0.875rem; font-weight: 600;"
              >
                Lihat Queue
              </a>
            </div>
          `);

          marker.on('click', () => {
            popup.setLngLat([shop.longitude, shop.latitude]);
            popup.addTo(map);
          });

          if (onMarkerClickRef.current) {
            marker.on('click', () => onMarkerClickRef.current!(shop.slug));
          }

          popups.push(popup);
        });
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load map:', err);
        }
      }
    };

    initMap();

    return () => {
      cancelled = true;
      popups.forEach((p) => p.remove());
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [barbershops]);

  return (
    <div
      ref={mapContainer}
      className="w-full h-full min-h-[500px] rounded-2xl border border-dark-700/30 bg-dark-800/50"
    />
  );
}
