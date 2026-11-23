import { useState } from 'react';
import { ExternalLink, LocateFixed, Loader2, MapPin, Navigation } from 'lucide-react';
import {
  CATEGORY_BY_ID,
  LOCATION_BY_ID,
  type CampusLocation,
} from '../data/locations';
import { googleDirectionsUrl, type DirectionsOrigin } from '../lib/maps';
import { Modal } from './Modal';

type StartMode = 'my-location' | 'place' | 'none';

type GeoState =
  | { kind: 'idle' }
  | { kind: 'locating' }
  | { kind: 'ready'; coords: DirectionsOrigin; accuracy: number }
  | { kind: 'error'; message: string };

interface DirectionsDialogProps {
  open: boolean;
  destination: CampusLocation;
  locations: CampusLocation[];
  onClose: () => void;
}

export function DirectionsDialog({
  open,
  destination,
  locations,
  onClose,
}: DirectionsDialogProps) {
  const defaultStart =
    locations.find((location) => location.id === 'main-gate' && location.id !== destination.id) ??
    locations.find((location) => location.id !== destination.id);

  const [mode, setMode] = useState<StartMode>(defaultStart ? 'place' : 'none');
  const [placeId, setPlaceId] = useState(defaultStart?.id ?? '');
  const [geo, setGeo] = useState<GeoState>({ kind: 'idle' });

  const startLocation = LOCATION_BY_ID.get(placeId);
  const destinationMeta = CATEGORY_BY_ID[destination.category];

  const origin: DirectionsOrigin | null =
    mode === 'my-location' && geo.kind === 'ready'
      ? geo.coords
      : mode === 'place' && startLocation
        ? {
            lat: startLocation.coordinates.lat,
            lng: startLocation.coordinates.lng,
            ...(startLocation.googlePlaceId
              ? { placeId: startLocation.googlePlaceId }
              : {}),
          }
        : null;

  const directionsUrl = googleDirectionsUrl(destination, origin);

  const requestLocation = (): void => {
    setMode('my-location');
    if (!('geolocation' in navigator)) {
      setGeo({
        kind: 'error',
        message: 'This browser does not provide location. Choose a campus start point instead.',
      });
      return;
    }
    setGeo({ kind: 'locating' });
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeo({
          kind: 'ready',
          coords: {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          },
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        setGeo({
          kind: 'error',
          message:
            error.code === 1
              ? 'Location permission was denied. Choose the main gate as your start, or let Google Maps ask for your location.'
              : 'Your location could not be read. Choose a campus start point instead.',
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Directions to ${destination.name}`}
      description="Google Maps provides the walking route. Indoor turn-by-turn guidance is not available."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-base"
            style={{ backgroundColor: destinationMeta.softColor }}
          >
            {destinationMeta.emoji}
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold text-navy-900">{destination.name}</p>
            <p className="text-[11px] text-slate-500">
              {destinationMeta.label} · {destination.coordinates.lat.toFixed(5)},{' '}
              {destination.coordinates.lng.toFixed(5)}
            </p>
          </div>
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            Starting point
          </legend>
          <div className="mt-2 space-y-2">
            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                mode === 'my-location'
                  ? 'border-navy-700 bg-navy-900/5'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="start-mode"
                value="my-location"
                checked={mode === 'my-location'}
                onChange={() => setMode('my-location')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">My current location</span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  Used only after you allow it. Your position is not stored.
                </span>
                <button
                  type="button"
                  onClick={requestLocation}
                  className="mt-1.5 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                >
                  {geo.kind === 'locating' ? (
                    <Loader2 aria-hidden="true" className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <LocateFixed aria-hidden="true" className="h-3.5 w-3.5" />
                  )}
                  {geo.kind === 'ready' ? 'Update my location' : 'Allow my location'}
                </button>
                <span aria-live="polite" className="mt-1 block text-[11px] leading-relaxed">
                  {geo.kind === 'ready' ? (
                    <span className="font-semibold text-emerald-700">
                      Location ready (±{Math.round(geo.accuracy)} m).
                    </span>
                  ) : geo.kind === 'error' ? (
                    <span className="text-red-700">{geo.message}</span>
                  ) : null}
                </span>
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                mode === 'place'
                  ? 'border-navy-700 bg-navy-900/5'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="start-mode"
                value="place"
                checked={mode === 'place'}
                onChange={() => setMode('place')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">A campus place</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Useful if you are arriving at the gate.
                </span>
                <select
                  aria-label="Choose a starting campus place"
                  value={placeId}
                  disabled={mode !== 'place'}
                  onChange={(event) => setPlaceId(event.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-2 py-1.5 text-xs font-semibold text-navy-900 disabled:opacity-50"
                >
                  {locations
                    .filter((location) => location.id !== destination.id)
                    .map((location) => (
                      <option key={location.id} value={location.id}>
                        {location.name}
                      </option>
                    ))}
                </select>
              </span>
            </label>

            <label
              className={`flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
                mode === 'none'
                  ? 'border-navy-700 bg-navy-900/5'
                  : 'border-slate-200 hover:bg-slate-50'
              }`}
            >
              <input
                type="radio"
                name="start-mode"
                value="none"
                checked={mode === 'none'}
                onChange={() => setMode('none')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span>
                <span className="block text-sm font-bold text-navy-900">Let Google Maps decide</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  Google Maps may ask for your location when it opens.
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          Verified positions are shown as pins. There is no verified indoor route, so this opens
          Google Maps for the walking route rather than inventing corridor-level steps.
        </p>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-extrabold text-navy-950 shadow-sm transition hover:bg-gold-400"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          Open walking directions in Google Maps
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>

        {mode === 'my-location' && geo.kind !== 'ready' ? (
          <p className="mt-2 text-center text-[11px] text-slate-500">
            Google Maps will ask for your location when it opens.
          </p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-navy-900"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
