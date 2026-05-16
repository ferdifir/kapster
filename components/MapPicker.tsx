'use client';

import { useEffect, useRef, useState } from 'react';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
}

interface MapCNMap {
  on: (event: string, callback: (e: { lnglat: { lat: number; lng: number } }) => void) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  addControl: (control: unknown) => void;
  remove: () => void;
}

interface MapCNMarker {
  addTo: (map: unknown) => void;
  setLngLat: (lnglat: [number, number]) => void;
  on: (event: string, callback: () => void) => void;
  remove: () => void;
}

declare global {
  interface Window {
    mapcn?: {
      Map: new (el: HTMLElement, options?: object) => MapCNMap;
      Marker: new (options?: object) => MapCNMarker;
    };
  }
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

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapCNMap | null>(null);
  const markerRef = useRef<MapCNMarker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    let cancelled = false;

    const initMap = async () => {
      try {
        await loadMapCNScript();

        if (cancelled || !window.mapcn) return;

        const center: [number, number] =
          longitude != null && latitude != null ? [longitude, latitude] : DEFAULT_CENTER;

        const map = new window.mapcn.Map(mapContainer.current!, {
          center,
          zoom: 13,
          mapStyle: 'dark',
          map: 'osm',
        });

        mapRef.current = map;

        map.on('click', (e: { lnglat: { lat: number; lng: number } }) => {
          const { lat, lng } = e.lnglat;
          onLocationChangeRef.current({ latitude: lat, longitude: lng });

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
          } else {
            const marker = new window.mapcn!.Marker({ draggable: true });
            marker.setLngLat([lng, lat]);
            marker.addTo(map);
            markerRef.current = marker;
          }
        });

        if (latitude != null && longitude != null) {
          const marker = new window.mapcn.Marker({ draggable: true });
          marker.setLngLat([longitude, latitude]);
          marker.addTo(map);
          markerRef.current = marker;
        }

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
      if (markerRef.current) {
        markerRef.current.remove();
        markerRef.current = null;
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!markerRef.current) return;
    if (latitude != null && longitude != null) {
      markerRef.current.setLngLat([longitude, latitude]);
    }
  }, [latitude, longitude]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={mapContainer}
          data-testid="map-container"
          className="w-full h-64 rounded-2xl border border-dark-700/30 bg-dark-800/50"
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
      <p className="text-sm text-dark-400">
        Klik pada peta untuk menetapkan lokasi. Koordinat akan otomatis terisi.
      </p>
      {latitude != null && longitude != null && (
        <p className="text-sm text-green-400">
          Lokasi terpasang: {latitude.toFixed(6)}, {longitude.toFixed(6)}
        </p>
      )}
    </div>
  );
}
