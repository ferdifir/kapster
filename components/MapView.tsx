'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

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
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const popupsRef = useRef<maplibregl.Popup[]>([]);
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

    const initMap = () => {
      try {
        const center = barbershops.length > 0
          ? [barbershops[0].longitude, barbershops[0].latitude] as [number, number]
          : DEFAULT_CENTER;

        const map = new maplibregl.Map({
          container,
          style: {
            version: 8,
            name: 'Dark',
            sources: {
              osm: {
                type: 'raster',
                tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
                tileSize: 256,
                attribution: '© OpenStreetMap contributors',
              },
            },
            layers: [
              {
                id: 'osm-tiles',
                type: 'raster',
                source: 'osm',
              },
            ],
          },
          center,
          zoom: 12,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) return;
          addMarkers(barbershops, map);
          isInitializedRef.current = true;
          prevBarbershopIdsRef.current = barbershops.map((b) => b.id);
          setLoading(false);
        });

        map.on('error', () => {
          if (cancelled) return;
          setError('Gagal memuat peta');
          setLoading(false);
        });

        mapRef.current = map;
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

  useEffect(() => {
    if (!isInitializedRef.current || !mapRef.current) return;
    const currentIds = barbershops.map((b) => b.id);
    if (JSON.stringify(currentIds) === JSON.stringify(prevBarbershopIdsRef.current)) return;
    prevBarbershopIdsRef.current = currentIds;
    clearMarkers();
    addMarkers(barbershops, mapRef.current);
  }, [barbershops]);

  function addMarkers(shops: BarbershopMarker[], map: maplibregl.Map) {
    const validBarbershops = shops.filter(
      (shop) => shop.latitude != null && shop.longitude != null
    );

    validBarbershops.forEach((shop) => {
      const marker = new maplibregl.Marker({
        element: createMarkerElement(shop.name),
      });

      marker.setLngLat([shop.longitude, shop.latitude]);
      marker.addTo(map);
      markersRef.current.push(marker);

      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '300px',
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

      marker.getElement().addEventListener('click', () => {
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
        className="w-full h-full min-h-[500px] rounded-2xl border border-dark-700/30 overflow-hidden"
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
