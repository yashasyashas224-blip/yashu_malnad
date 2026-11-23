import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  Crosshair,
  Layers,
  Loader2,
  Minus,
  Plus,
  RotateCcw,
  X,
} from 'lucide-react';
import {
  CAMPUS,
  CATEGORY_BY_ID,
  LOCATION_BY_ID,
  type CampusLocation,
} from '../data/locations';

type GeoState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'granted'; message: string }
  | { kind: 'error'; message: string };

interface MapPanelProps {
  locations: CampusLocation[];
  visibleIds: Set<string>;
  selectedId: string | null;
  focusToken: number;
  onSelect: (id: string) => void;
}

const GEO_ERRORS: Record<number, string> = {
  1: 'Location permission was denied. You can still use Directions, or start from the Main Gate.',
  2: 'Your location is unavailable right now. Start from the Main Gate, or use Directions.',
  3: 'Finding your location took too long. Try again, or start from the Main Gate.',
};

/** Keyless tiles: OpenStreetMap for streets, Esri World Imagery for satellite. */
const STREET_TILES = {
  url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors · <a href="' +
    CAMPUS.boundarySource +
    '" target="_blank" rel="noopener noreferrer">campus boundary</a> (ODbL)',
};

const SATELLITE_TILES = {
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  attribution:
    'Imagery &copy; Esri, Maxar, Earthstar Geographics · boundary &copy; OpenStreetMap contributors',
};

const CAMPUS_BOUNDS = L.latLngBounds(
  CAMPUS.boundary.map((point) => [point.lat, point.lng] as L.LatLngTuple),
);

export function MapPanel({
  locations,
  visibleIds,
  selectedId,
  focusToken,
  onSelect,
}: MapPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const markersRef = useRef<Map<string, { marker: L.Marker; element: HTMLElement | null }>>(
    new Map(),
  );
  const userLayerRef = useRef<{ dot: L.CircleMarker; circle: L.Circle } | null>(null);
  const onSelectRef = useRef(onSelect);
  const [mapType, setMapType] = useState<'street' | 'satellite'>('street');
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      center: [CAMPUS.center.lat, CAMPUS.center.lng],
      zoom: 16,
      minZoom: 13,
      maxZoom: 19,
      zoomControl: false,
      scrollWheelZoom: true,
      keyboard: true,
      attributionControl: true,
    });
    mapRef.current = map;

    tileLayerRef.current = L.tileLayer(STREET_TILES.url, {
      attribution: STREET_TILES.attribution,
      maxZoom: 19,
    }).addTo(map);

    L.polygon(CAMPUS.boundary.map((point) => [point.lat, point.lng] as L.LatLngTuple), {
      color: '#0b1f3a',
      weight: 1.5,
      opacity: 0.55,
      fillColor: '#f2b705',
      fillOpacity: 0.07,
      interactive: false,
    }).addTo(map);

    for (const location of locations) {
      const meta = CATEGORY_BY_ID[location.category];
      const marker = L.marker([location.coordinates.lat, location.coordinates.lng], {
        icon: L.divIcon({
          className: `campus-pin campus-pin--${location.category}`,
          html: `<span aria-hidden="true">${meta.emoji}</span>`,
          iconSize: [38, 38],
          iconAnchor: [19, 19],
          tooltipAnchor: [0, -22],
        }),
        title: `${location.name} — ${meta.label}`,
        alt: `${location.name}, ${meta.label}`,
        keyboard: true,
        riseOnHover: true,
        autoPanOnFocus: true,
      }).addTo(map);

      marker.bindTooltip(location.shortName, {
        permanent: true,
        direction: 'top',
        offset: [0, -20],
        className: 'pin-label',
        opacity: 1,
        interactive: false,
      });

      marker.on('click', () => onSelectRef.current(location.id));
      markersRef.current.set(location.id, { marker, element: marker.getElement() ?? null });
    }

    map.fitBounds(CAMPUS_BOUNDS, { padding: [28, 28] });

    // Doorstep the map after layout settles (mobile sheets, resizes, orientation).
    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      observer.disconnect();
      for (const entry of markersRef.current.values()) entry.marker.remove();
      markersRef.current.clear();
      userLayerRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [locations]);

  useEffect(() => {
    for (const [id, entry] of markersRef.current) {
      const element = entry.element ?? entry.marker.getElement();
      element?.classList.toggle('is-muted', !visibleIds.has(id));
    }
  }, [visibleIds]);

  useEffect(() => {
    for (const [id, entry] of markersRef.current) {
      const element = entry.element ?? entry.marker.getElement();
      element?.classList.toggle('is-selected', id === selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedId) return;
    const location = LOCATION_BY_ID.get(selectedId);
    if (!location) return;
    map.panTo([location.coordinates.lat, location.coordinates.lng]);
    if (map.getZoom() < 17) map.setZoom(17.5);
  }, [selectedId, focusToken]);

  const handleZoom = (delta: number): void => {
    const map = mapRef.current;
    if (!map) return;
    map.setZoom(map.getZoom() + delta);
  };

  const handleRecenter = (): void => {
    const map = mapRef.current;
    if (!map) return;
    map.fitBounds(CAMPUS_BOUNDS, { padding: [28, 28] });
  };

  const handleLayer = (): void => {
    const map = mapRef.current;
    if (!map) return;
    const next = mapType === 'street' ? 'satellite' : 'street';
    const config = next === 'street' ? STREET_TILES : SATELLITE_TILES;
    if (tileLayerRef.current) tileLayerRef.current.remove();
    tileLayerRef.current = L.tileLayer(config.url, {
      attribution: config.attribution,
      maxZoom: 19,
    }).addTo(map);
    setMapType(next);
  };

  const handleLocate = (): void => {
    if (!('geolocation' in navigator)) {
      setGeo({
        kind: 'error',
        message: 'This browser does not provide location. Start from the Main Gate instead.',
      });
      return;
    }

    setGeo({ kind: 'locating' });

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const latlng: L.LatLngTuple = [
          position.coords.latitude,
          position.coords.longitude,
        ];
        const map = mapRef.current;

        if (map) {
          if (!userLayerRef.current) {
            const dot = L.circleMarker(latlng, {
              radius: 8,
              color: '#ffffff',
              weight: 3,
              fillColor: '#2563eb',
              fillOpacity: 1,
            }).addTo(map);
            const circle = L.circle(latlng, {
              radius: Math.max(position.coords.accuracy, 10),
              color: '#2563eb',
              weight: 1,
              opacity: 0.35,
              fillColor: '#2563eb',
              fillOpacity: 0.12,
              interactive: false,
            }).addTo(map);
            userLayerRef.current = { dot, circle };
          } else {
            userLayerRef.current.dot.setLatLng(latlng);
            userLayerRef.current.circle
              .setLatLng(latlng)
              .setRadius(Math.max(position.coords.accuracy, 10));
          }
          map.setView(latlng, 18);
        }

        setGeo({
          kind: 'granted',
          message: `Your location is shown (accuracy about ${Math.round(
            position.coords.accuracy,
          )} m). It stays in this page and is not stored.`,
        });
      },
      (error) => {
        setGeo({
          kind: 'error',
          message:
            GEO_ERRORS[error.code] ?? 'Your location could not be read. Start from the Main Gate.',
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <div className="relative h-full w-full overflow-hidden bg-slate-200">
      <div
        ref={containerRef}
        className="map-canvas"
        role="region"
        aria-label={`Interactive campus map of ${CAMPUS.name}, Hassan. ${locations.length} labelled landmarks.`}
      />

      <div className="absolute right-3 top-3 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => handleZoom(1)}
          aria-label="Zoom in"
          title="Zoom in"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-md transition hover:bg-slate-50"
        >
          <Plus aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => handleZoom(-1)}
          aria-label="Zoom out"
          title="Zoom out"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-md transition hover:bg-slate-50"
        >
          <Minus aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleRecenter}
          aria-label="Show the whole campus and all landmarks"
          title="Show all landmarks"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-md transition hover:bg-slate-50"
        >
          <RotateCcw aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLayer}
          aria-label={mapType === 'street' ? 'Switch to satellite view' : 'Switch to street map'}
          aria-pressed={mapType === 'satellite'}
          title={mapType === 'street' ? 'Satellite view' : 'Street map'}
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-navy-900 shadow-md transition hover:bg-slate-50"
        >
          <Layers aria-hidden="true" className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleLocate}
          aria-label="Show my location (asks for permission)"
          title="Show my location"
          className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 bg-white text-blue-700 shadow-md transition hover:bg-blue-50"
        >
          {geo.kind === 'locating' ? (
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          ) : (
            <Crosshair aria-hidden="true" className="h-4 w-4" />
          )}
        </button>
      </div>

      {geo.kind !== 'idle' ? (
        <div
          role="status"
          aria-live="polite"
          className="absolute bottom-16 left-3 right-3 z-20 sm:bottom-9 sm:left-4 sm:right-auto sm:max-w-sm"
        >
          <div className="surface flex items-start gap-2 rounded-xl border border-slate-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur">
            <p className="flex-1 text-[11px] font-medium leading-relaxed text-slate-700">
              {geo.kind === 'locating' ? 'Waiting for location permission…' : geo.message}
            </p>
            <button
              type="button"
              onClick={() => setGeo({ kind: 'idle' })}
              aria-label="Dismiss location message"
              className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-slate-400 hover:bg-slate-100"
            >
              <X aria-hidden="true" className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
