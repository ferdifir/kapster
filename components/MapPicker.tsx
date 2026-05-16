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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    let cancelled = false;

    const initMap = async () => {
      try {
        if (!window.mapcn) {
          const script = document.createElement('script');
          script.src = 'https://api.mapcn.dev/mapcn.js';
          script.async = true;
          document.head.appendChild(script);
          await new Promise<void>((resolve, reject) => {
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Gagal memuat peta'));
          });
        }

        if (cancelled || !window.mapcn) return;

        const center: [number, number] =
          longitude != null && latitude != null ? [longitude, latitude] : [106.8456, -6.2088];

        const map = new window.mapcn.Map(mapContainer.current!, {
          center,
          zoom: 13,
          mapStyle: 'dark',
          map: 'osm',
        });

        mapRef.current = map;

        map.on('click', (e: { lnglat: { lat: number; lng: number } }) => {
          const { lat, lng } = e.lnglat;
          onLocationChange({ latitude: lat, longitude: lng });

          if (markerRef.current) {
            (markerRef.current as { setLngLat: (lnglat: [number, number]) => void }).setLngLat([lng, lat]);
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
    };
  }, []);

  // Sync marker position when props change
  useEffect(() => {
    if (!mapRef.current || !markerRef.current) return;
    if (latitude != null && longitude != null) {
      (markerRef.current as { setLngLat: (lnglat: [number, number]) => void }).setLngLat([longitude, latitude]);
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
