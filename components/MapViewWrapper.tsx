"use client";

import dynamic from "next/dynamic";

const MapView = dynamic(() => import("@/components/MapView"), { ssr: false });

interface MapViewWrapperProps {
  barbershops: {
    id: string;
    name: string;
    slug: string;
    latitude: number;
    longitude: number;
    address?: string | null;
    logo_url?: string | null;
  }[];
  onMarkerClick?: (slug: string) => void;
}

export default function MapViewWrapper(props: MapViewWrapperProps) {
  return <MapView {...props} />;
}
