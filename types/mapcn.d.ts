interface MapCNMap {
  on: (event: string, callback: (e: unknown) => void) => void;
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  addControl: (control: unknown) => void;
  flyTo?: (options: object) => void;
  remove: () => void;
}

interface MapCNMarker {
  addTo: (map: unknown) => void;
  setLngLat: (lnglat: [number, number]) => void;
  on: (event: string, callback: () => void) => void;
  getElement?: () => HTMLElement;
  remove: () => void;
}

interface MapCNPopup {
  setLngLat: (lnglat: [number, number]) => void;
  setHTML: (html: string) => void;
  addTo: (map: unknown) => void;
  remove: () => void;
  on: (event: string, callback: () => void) => void;
}

interface MapCN {
  Map: new (el: HTMLElement, options?: object) => MapCNMap;
  Marker: new (options?: { element?: HTMLElement; draggable?: boolean }) => MapCNMarker;
  Popup: new (options?: { closeButton?: boolean; closeOnClick?: boolean }) => MapCNPopup;
}

declare global {
  interface Window {
    mapcn?: MapCN;
  }
}

export type { MapCNMap, MapCNMarker, MapCNPopup, MapCN };
