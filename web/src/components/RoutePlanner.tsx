import { useEffect, useMemo, useState } from 'react';
import {
  Accessibility,
  ArrowLeftRight,
  ExternalLink,
  Footprints,
  Info,
  LocateFixed,
  Navigation,
  Square,
  Volume2,
} from 'lucide-react';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import {
  findRoute,
  formatDistance,
  ROUTABLE_PLACE_IDS,
  type RouteResult,
  type WalkingRoute,
} from '../lib/routing';
import { googleDirectionsUrl } from '../lib/maps';
import { useI18n } from '../lib/i18n';
import { hasVoiceFor, speak, speechSupported, stopSpeaking } from '../lib/speech';
import { Modal } from './Modal';

type Origin =
  | { kind: 'place'; id: string }
  | { kind: 'geo'; coords: { lat: number; lng: number } };

interface RoutePlannerProps {
  open: boolean;
  initialDestinationId: string | null;
  onClose: () => void;
  onRouteChange: (route: WalkingRoute | null) => void;
  onOpenLocation: (location: CampusLocation) => void;
}

const GEO_ERROR =
  'Location permission was denied or unavailable. Choose a campus start point instead.';

export function RoutePlanner({
  open,
  initialDestinationId,
  onClose,
  onRouteChange,
  onOpenLocation,
}: RoutePlannerProps) {
  const { t, language } = useI18n();
  const places = useMemo(
    () =>
      Array.from(ROUTABLE_PLACE_IDS)
        .map((id) => LOCATION_BY_ID.get(id))
        .filter((place): place is CampusLocation => Boolean(place)),
    [],
  );

  const defaultFrom = places[0]?.id ?? '';
  const [fromId, setFromId] = useState<string>(
    places.find((place) => place.id === 'main-gate')?.id ?? defaultFrom,
  );
  const [toId, setToId] = useState<string>(() => {
    if (initialDestinationId && places.some((place) => place.id === initialDestinationId)) {
      return initialDestinationId;
    }
    return places.find((place) => place.id !== defaultFrom)?.id ?? '';
  });
  const [stepFree, setStepFree] = useState(false);
  const [geo, setGeo] = useState<{ kind: 'idle' } | { kind: 'locating' } | { kind: 'ready'; coords: { lat: number; lng: number } } | { kind: 'error'; message: string }>({ kind: 'idle' });
  const [allowOrdinary, setAllowOrdinary] = useState(false);
  const [speechNotice, setSpeechNotice] = useState<string | null>(null);

  const origin = useMemo<Origin | null>(() => {
    if (fromId === '__my-location__') {
      return geo.kind === 'ready' ? { kind: 'geo', coords: geo.coords } : null;
    }
    return fromId ? { kind: 'place', id: fromId } : null;
  }, [fromId, geo]);

  const effectiveStepFree = stepFree && !allowOrdinary;

  const result: RouteResult | null = useMemo(() => {
    if (!toId || !origin) return null;
    if (origin.kind === 'place') {
      return findRoute(origin.id, toId, { stepFree: effectiveStepFree });
    }
    return findRoute('', toId, { stepFree: effectiveStepFree, origin: origin.coords });
  }, [origin, toId, effectiveStepFree]);

  const route = result && result.ok ? result : null;

  useEffect(() => {
    onRouteChange(route);
  }, [route, onRouteChange]);

  useEffect(() => {
    return () => {
      stopSpeaking();
      onRouteChange(null);
    };
  }, [onRouteChange]);

  const units = { m: t('route.metres'), km: t('route.km') };

  const routeText = (): string => {
    if (!route) return '';
    const lines = [t('route.mapLabel', { from: route.fromLabel, to: route.toLabel })];
    if (route.provisional) lines.push(t('route.provisional'));
    lines.push(
      `${t('route.distance')}: ${formatDistance(route.distanceMetres, units)}`,
      `${t('route.walkingTime')}: ${t('route.minutes', { count: route.durationMinutes })}`,
    );
    for (const step of route.steps) {
      if (step.kind === 'start') {
        lines.push(t('route.start', { place: step.toward }));
      } else if (step.kind === 'arrive') {
        lines.push(t('route.arrive', { place: step.toward }));
      } else if (step.compass) {
        lines.push(
          t('route.walk', {
            distance: formatDistance(step.distanceMetres, units),
            direction: t(`compass.${step.compass}`),
            place: step.toward,
          }),
        );
      }
    }
    return lines.join('. ');
  };

  const handleSpeak = (): void => {
    if (!route) return;
    let text = routeText();
    let targetLanguage = language;
    if (language === 'kn' && !hasVoiceFor('kn')) {
      setSpeechNotice(t('route.noVoice'));
      // Fall back to English only when an English voice exists, otherwise keep
      // the written steps and explain.
      if (!hasVoiceFor('en')) {
        setSpeechNotice(t('route.speechUnsupported'));
        return;
      }
      targetLanguage = 'en';
      text = `${route.fromLabel} to ${route.toLabel}. Distance ${formatDistance(route.distanceMetres, { m: 'metres', km: 'kilometres' })}. About ${route.durationMinutes} minutes walking.`;
    }
    const outcome = speak(text, targetLanguage);
    if (outcome === 'unsupported') setSpeechNotice(t('route.speechUnsupported'));
    else if (outcome === 'no-voice') setSpeechNotice(t('route.noVoice'));
    else setSpeechNotice(null);
  };

  const destination = toId ? LOCATION_BY_ID.get(toId) : undefined;
  const stepsHeadingId = 'route-steps-heading';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('route.title')}
      description={t('route.description')}
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <div className="grid gap-2 sm:grid-cols-[1fr_auto_1fr] sm:items-end">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('route.from')}
            </span>
            <select
              value={fromId}
              onChange={(event) => {
                setFromId(event.target.value);
                setAllowOrdinary(false);
              }}
              className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-semibold text-navy-900"
            >
              <option value="__my-location__">{t('route.myLocation')}</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>

          <button
            type="button"
            onClick={() => {
              if (fromId === '__my-location__' || !toId) return;
              const next = fromId;
              setFromId(toId);
              setToId(next);
              setAllowOrdinary(false);
            }}
            aria-label={t('route.swap')}
            title={t('route.swap')}
            className="grid h-10 w-10 place-items-center self-center rounded-xl border border-slate-300 text-navy-900 transition hover:bg-slate-50"
          >
            <ArrowLeftRight aria-hidden="true" className="h-4 w-4" />
          </button>

          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('route.to')}
            </span>
            <select
              value={toId}
              onChange={(event) => {
                setToId(event.target.value);
                setAllowOrdinary(false);
              }}
              className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-2.5 text-sm font-semibold text-navy-900"
            >
              <option value="">—</option>
              {places.map((place) => (
                <option key={place.id} value={place.id}>
                  {place.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {fromId === '__my-location__' ? (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => {
                if (!('geolocation' in navigator)) {
                  setGeo({ kind: 'error', message: GEO_ERROR });
                  return;
                }
                setGeo({ kind: 'locating' });
                navigator.geolocation.getCurrentPosition(
                  (position) =>
                    setGeo({
                      kind: 'ready',
                      coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                      },
                    }),
                  () => setGeo({ kind: 'error', message: GEO_ERROR }),
                  { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
                );
              }}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
            >
              <LocateFixed aria-hidden="true" className="h-3.5 w-3.5" />
              {geo.kind === 'ready' ? t('route.myLocation') : t('common.retry')}
            </button>
            <p aria-live="polite" className="mt-1 text-[11px] leading-relaxed">
              {geo.kind === 'locating' ? (
                <span className="text-slate-500">{t('common.loading')}</span>
              ) : geo.kind === 'error' ? (
                <span className="text-red-700">{geo.message}</span>
              ) : geo.kind === 'ready' && route ? (
                <span className="text-emerald-700">
                  {t('route.snapped', {
                    distance: formatDistance(route.snappedFromMetres, units),
                  })}
                </span>
              ) : geo.kind === 'ready' ? (
                <span className="text-emerald-700">
                  {t('route.myLocation')}
                </span>
              ) : null}
            </p>
          </div>
        ) : null}

        <label className="mt-3 flex cursor-pointer items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 p-3">
          <input
            type="checkbox"
            checked={stepFree}
            onChange={(event) => {
              setStepFree(event.target.checked);
              setAllowOrdinary(false);
            }}
            className="mt-0.5 h-4 w-4 accent-navy-900"
          />
          <span>
            <span className="flex items-center gap-1.5 text-sm font-bold text-navy-900">
              <Accessibility aria-hidden="true" className="h-4 w-4" />
              {t('route.stepFree')}
            </span>
            <span className="mt-0.5 block text-[11px] leading-relaxed text-slate-500">
              {t('route.stepFreeHelp')}
            </span>
          </span>
        </label>

        <div aria-live="polite" className="mt-3">
          {!origin && fromId === '__my-location__' ? (
            <p className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-xs text-slate-500">
              {t('route.from')}: {t('route.myLocation')} — {t('common.loading')}
            </p>
          ) : result && !result.ok ? (
            <div
              role="alert"
              className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[12px] leading-relaxed text-amber-900"
            >
              <p>
                {result.reason === 'no-step-free-route'
                  ? t('route.noStepFree')
                  : result.reason === 'same-place'
                    ? t('route.samePlace')
                    : t('route.noPath')}
              </p>
              {result.reason === 'no-step-free-route' ? (
                <button
                  type="button"
                  onClick={() => setAllowOrdinary(true)}
                  className="mt-2 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-amber-300 bg-white px-2.5 py-1.5 text-[11px] font-bold text-amber-900 hover:bg-amber-100"
                >
                  <Footprints aria-hidden="true" className="h-3.5 w-3.5" />
                  {t('route.showOrdinary')}
                </button>
              ) : null}
            </div>
          ) : route ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
                <p className="text-2xl font-extrabold tracking-tight text-navy-900">
                  {formatDistance(route.distanceMetres, units)}
                </p>
                <p className="text-sm font-bold text-slate-600">
                  {t('route.minutes', { count: route.durationMinutes })}
                </p>
                {route.stepFree ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-emerald-800">
                    <Accessibility aria-hidden="true" className="h-3 w-3" />
                    {t('route.stepFreeShort')}
                  </span>
                ) : null}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${
                    route.provisional
                      ? 'bg-amber-100 text-amber-900'
                      : 'bg-emerald-50 text-emerald-800'
                  }`}
                >
                  {route.provisional ? t('route.provisional') : t('route.surveyedNote')}
                </span>
              </div>

              {route.provisional ? (
                <p className="mt-2 flex items-start gap-1.5 rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] leading-relaxed text-amber-900">
                  <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {t('route.provisionalNote')}
                </p>
              ) : null}

              <h3
                id={stepsHeadingId}
                className="mt-3 text-[11px] font-extrabold uppercase tracking-wider text-slate-500"
              >
                {t('route.stepsTitle')}
              </h3>
              <ol aria-labelledby={stepsHeadingId} className="mt-1.5 space-y-1">
                {route.steps.map((step, index) => (
                  <li
                    key={`${step.kind}-${index}-${step.toward}`}
                    className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-700"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-slate-100 text-[10px] font-extrabold text-navy-900"
                    >
                      {index + 1}
                    </span>
                    <span>
                      {step.kind === 'start'
                        ? t('route.start', { place: step.toward })
                        : step.kind === 'arrive'
                          ? t('route.arrive', { place: step.toward })
                          : step.compass
                            ? t('route.walk', {
                                distance: formatDistance(step.distanceMetres, units),
                                direction: t(`compass.${step.compass}`),
                                place: step.toward,
                              })
                            : null}
                    </span>
                  </li>
                ))}
              </ol>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleSpeak}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-navy-900 transition hover:bg-slate-50"
                >
                  <Volume2 aria-hidden="true" className="h-3.5 w-3.5" />
                  {t('route.speak')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    stopSpeaking();
                    setSpeechNotice(null);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition hover:bg-slate-50"
                >
                  <Square aria-hidden="true" className="h-3 w-3" />
                  {t('route.stop')}
                </button>
                {destination ? (
                  <a
                    href={googleDirectionsUrl(destination)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-xl border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-navy-900 transition hover:bg-slate-50"
                  >
                    <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
                    {t('route.openGoogle')}
                  </a>
                ) : null}
              </div>

              {speechNotice ? (
                <p aria-live="polite" className="mt-2 text-[11px] leading-relaxed text-slate-600">
                  {speechNotice}
                </p>
              ) : !speechSupported() ? (
                <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                  {t('route.speechUnsupported')}
                </p>
              ) : null}

              {destination ? (
                <button
                  type="button"
                  onClick={() => onOpenLocation(destination)}
                  className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                >
                  <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                  {destination.name}
                </button>
              ) : null}
            </div>
          ) : (
            <p className="text-xs text-slate-500">{t('route.description')}</p>
          )}
        </div>
      </div>
    </Modal>
  );
}
