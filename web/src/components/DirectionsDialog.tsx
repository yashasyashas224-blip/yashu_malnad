import { useState } from 'react';
import { ExternalLink, Footprints, LocateFixed, Loader2, MapPin, Navigation } from 'lucide-react';
import { CATEGORY_BY_ID, LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import { googleDirectionsUrl, type DirectionsOrigin } from '../lib/maps';
import { useI18n } from '../lib/i18n';
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
  onCampusRoute: (location: CampusLocation) => void;
}

export function DirectionsDialog({
  open,
  destination,
  locations,
  onClose,
  onCampusRoute,
}: DirectionsDialogProps) {
  const { t } = useI18n();
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
      setGeo({ kind: 'error', message: t('dir.noBrowser') });
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
          message: error.code === 1 ? t('dir.denied') : t('dir.unavailable'),
        });
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  };

  const optionClass = (active: boolean): string =>
    `flex cursor-pointer items-start gap-2.5 rounded-xl border p-3 transition ${
      active ? 'border-navy-700 bg-navy-900/5' : 'border-slate-200 hover:bg-slate-50'
    }`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('dir.title', { place: destination.name })}
      description={t('dir.description')}
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
              {destination.coordinates.lat.toFixed(5)},{' '}
              {destination.coordinates.lng.toFixed(5)}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            onClose();
            onCampusRoute(destination);
          }}
          className="mt-3 inline-flex min-h-[42px] w-full items-center justify-center gap-2 rounded-xl border border-navy-900 bg-navy-900 px-3 py-2 text-xs font-extrabold text-white transition hover:bg-navy-800"
        >
          <Footprints aria-hidden="true" className="h-4 w-4" />
          {t('dir.campusRoute')}
        </button>

        <fieldset className="mt-4">
          <legend className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
            {t('dir.start')}
          </legend>
          <div className="mt-2 space-y-2">
            <label className={optionClass(mode === 'my-location')}>
              <input
                type="radio"
                name="start-mode"
                value="my-location"
                checked={mode === 'my-location'}
                onChange={() => setMode('my-location')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">
                  {t('dir.myLocation')}
                </span>
                <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
                  {t('dir.myLocationHelp')}
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
                  {geo.kind === 'ready' ? t('dir.updateLocation') : t('dir.allowLocation')}
                </button>
                <span aria-live="polite" className="mt-1 block text-[11px] leading-relaxed">
                  {geo.kind === 'ready' ? (
                    <span className="font-semibold text-emerald-700">
                      {t('dir.ready', { distance: Math.round(geo.accuracy) })}
                    </span>
                  ) : geo.kind === 'error' ? (
                    <span className="text-red-700">{geo.message}</span>
                  ) : null}
                </span>
              </span>
            </label>

            <label className={optionClass(mode === 'place')}>
              <input
                type="radio"
                name="start-mode"
                value="place"
                checked={mode === 'place'}
                onChange={() => setMode('place')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold text-navy-900">{t('dir.place')}</span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {t('dir.placeHelp')}
                </span>
                <select
                  aria-label={t('dir.choosePlace')}
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

            <label className={optionClass(mode === 'none')}>
              <input
                type="radio"
                name="start-mode"
                value="none"
                checked={mode === 'none'}
                onChange={() => setMode('none')}
                className="mt-0.5 h-4 w-4 accent-navy-900"
              />
              <span>
                <span className="block text-sm font-bold text-navy-900">
                  {t('dir.googleDecides')}
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-500">
                  {t('dir.googleDecidesHelp')}
                </span>
              </span>
            </label>
          </div>
        </fieldset>

        <p className="mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-900">
          <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          {t('dir.note')}
        </p>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 inline-flex min-h-[46px] w-full items-center justify-center gap-2 rounded-xl bg-gold-500 px-4 py-2.5 text-sm font-extrabold text-navy-950 shadow-sm transition hover:bg-gold-400"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          {t('dir.open')}
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
        </a>

        {mode === 'my-location' && geo.kind !== 'ready' ? (
          <p className="mt-2 text-center text-[11px] text-slate-500">{t('dir.askLocation')}</p>
        ) : null}

        <button
          type="button"
          onClick={onClose}
          className="mt-2 w-full rounded-xl px-4 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50 hover:text-navy-900"
        >
          {t('common.close')}
        </button>
      </div>
    </Modal>
  );
}
