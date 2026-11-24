import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  CloudOff,
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
  type CategoryId,
} from '../data/locations';
import { ACCESSIBILITY_FEATURES, ACCESSIBILITY_KIND_BY_ID } from '../data/accessibility';
import type { WalkingRoute } from '../lib/routing';
import { useOnlineStatus } from '../lib/offline';
import { useI18n } from '../lib/i18n';

/** White glyphs drawn inside each teardrop pin (24×24 icon space). */
const PIN_GLYPHS: Record<CategoryId, string> = {
  entrance:
    'M13 4h3a2 2 0 0 1 2 2v14M2 20h3M13 20h9M10 12v.01M13 4.56v16.16a1 1 0 0 1-1.24.97L5 20V5.56a2 2 0 0 1 1.52-1.94l4-1A2 2 0 0 1 13 4.56Z',
  academic:
    'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18ZM6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2M10 6h4M10 10h4M10 14h4M10 18h4',
  library: 'M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H19a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1H6.5a1 1 0 0 1 0-5H20',
  food: 'M10 2v2M14 2v2M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1',
  hostel: 'm3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zM9 22V12h6v10',
  sports:
    'M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22M18 2H6v7a6 6 0 0 0 12 0V2Z',
  landmark: 'M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 20 7H4z',
};

/** Teardrop marker: coloured body, white glyph, tip on the exact coordinate. */
const pinHtml = (category: CategoryId): string =>
  `<svg viewBox="0 0 36 46" width="36" height="46" aria-hidden="true" focusable="false">` +
  `<path class="campus-pin__body" d="M18 1.6C9.2 1.6 2.2 8.5 2.2 17c0 6.4 3.5 12.4 8.7 19.1 2 2.6 4.4 5.4 7.1 8.6 2.7-3.2 5.1-6 7.1-8.6C30.3 29.4 33.8 23.4 33.8 17 33.8 8.5 26.8 1.6 18 1.6Z"/>` +
  `<g transform="translate(10 9) scale(0.667)" fill="none" stroke="#ffffff" stroke-width="2.1" stroke-linecap="round" stroke-linejoin="round">` +
  `<path d="${PIN_GLYPHS[category]}"/>` +
  `</g></svg>`;

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
  route: WalkingRoute | null;
  showAccessibility: boolean;
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
  route,
  showAccessibility,
  onSelect,
}: MapPanelProps) {
  const { t } = useI18n();
  const online = useOnlineStatus();
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);
  const accessibilityLayerRef = useRef<L.LayerGroup | null>(null);
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
          html: pinHtml(location.category),
          iconSize: [36, 46],
          iconAnchor: [18, 46],
          tooltipAnchor: [0, -50],
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
        offset: [0, 0],
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
      routeLayerRef.current = null;
      accessibilityLayerRef.current = null;
      userLayerRef.current = null;
      tileLayerRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [locations]);

  // The planned walking route, drawn on top of the pins and labels.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    routeLayerRef.current?.remove();
    routeLayerRef.current = null;
    if (!route) return;

    const layer = L.layerGroup().addTo(map);
    const latlngs = route.path.map((point) => [point.lat, point.lng] as L.LatLngTuple);

    if (latlngs.length > 1) {
      L.polyline(latlngs, {
        color: route.stepFree ? '#047857' : '#0b1f3a',
        weight: 5,
        opacity: 0.92,
        dashArray: route.provisional ? '9 7' : undefined,
        lineCap: 'round',
        interactive: false,
      }).addTo(layer);
    }

    const first = latlngs[0];
    const last = latlngs[latlngs.length - 1];
    if (first) {
      L.circleMarker(first, {
        radius: 7,
        color: '#ffffff',
        weight: 3,
        fillColor: '#0b1f3a',
        fillOpacity: 1,
        interactive: false,
      }).addTo(layer);
    }
    if (last) {
      L.circleMarker(last, {
        radius: 7,
        color: '#ffffff',
        weight: 3,
        fillColor: '#f2b705',
        fillOpacity: 1,
        interactive: false,
      }).addTo(layer);
    }

    routeLayerRef.current = layer;
    if (latlngs.length > 0) {
      map.fitBounds(L.latLngBounds(latlngs), { padding: [44, 44] });
    }
  }, [route]);

  // Surveyed accessibility features, shown only when the visitor asks for them.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    accessibilityLayerRef.current?.remove();
    accessibilityLayerRef.current = null;
    if (!showAccessibility || ACCESSIBILITY_FEATURES.length === 0) return;

    const layer = L.layerGroup().addTo(map);
    for (const feature of ACCESSIBILITY_FEATURES) {
      const place = feature.locationId ? LOCATION_BY_ID.get(feature.locationId) : undefined;
      const point = feature.coordinates ?? place?.coordinates ?? null;
      if (!point) continue;
      L.circleMarker([point.lat, point.lng], {
        radius: 7,
        color: '#ffffff',
        weight: 2.5,
        fillColor: '#047857',
        fillOpacity: 1,
      })
        .bindTooltip(`${ACCESSIBILITY_KIND_BY_ID[feature.kind].label}: ${feature.label}`, {
          direction: 'top',
          className: 'pin-label',
        })
        .addTo(layer);
    }
    accessibilityLayerRef.current = layer;
  }, [showAccessibility]);

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

      {!online ? (
        <div
          role="status"
          className="pointer-events-none absolute bottom-3 left-3 right-16 z-20 rounded-xl border border-amber-300 bg-amber-50/95 px-3 py-2 shadow-lg sm:max-w-sm"
        >
          <p className="flex items-start gap-1.5 text-[11px] font-semibold leading-relaxed text-amber-900">
            <CloudOff aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span>
              <span className="block font-extrabold">{t('offline.tilesUnavailable')}</span>
              {t('offline.mapNote')}
            </span>
          </p>
        </div>
      ) : null}

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
