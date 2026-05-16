'use client';

import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

interface MapPickerProps {
  latitude: number | null;
  longitude: number | null;
  onLocationChange: (coords: { latitude: number; longitude: number }) => void;
}

const DEFAULT_CENTER: [number, number] = [106.8456, -6.2088];

export default function MapPicker({ latitude, longitude, onLocationChange }: MapPickerProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markerRef = useRef<maplibregl.Marker | null>(null);
  const onLocationChangeRef = useRef(onLocationChange);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  onLocationChangeRef.current = onLocationChange;

  useEffect(() => {
    if (!mapContainer.current || typeof window === 'undefined') return;

    let cancelled = false;

    const initMap = () => {
      try {
        const center: [number, number] =
          longitude != null && latitude != null ? [longitude, latitude] : DEFAULT_CENTER;

        const map = new maplibregl.Map({
          container: mapContainer.current!,
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
          zoom: 13,
        });

        map.addControl(new maplibregl.NavigationControl(), 'top-right');

        map.on('load', () => {
          if (cancelled) return;
          setLoading(false);
        });

        map.on('error', () => {
          if (cancelled) return;
          setError('Gagal memuat peta');
          setLoading(false);
        });

        mapRef.current = map;

        map.on('click', (e) => {
          const { lat, lng } = e.lngLat;
          onLocationChangeRef.current({ latitude: lat, longitude: lng });

          if (markerRef.current) {
            markerRef.current.setLngLat([lng, lat]);
          } else {
            const marker = new maplibregl.Marker({ draggable: true });
            marker.setLngLat([lng, lat]);
            marker.addTo(map);
            markerRef.current = marker;
          }
        });

        if (latitude != null && longitude != null) {
          const marker = new maplibregl.Marker({ draggable: true });
          marker.setLngLat([longitude, latitude]);
          marker.addTo(map);
          markerRef.current = marker;
        }
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
          className="w-full h-64 rounded-2xl border border-dark-700/30 overflow-hidden"
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
