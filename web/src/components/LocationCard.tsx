import {
  Accessibility,
  ArrowUpRight,
  Clock,
  ExternalLink,
  Footprints,
  Info,
  Navigation,
  X,
} from 'lucide-react';
import { CATEGORY_BY_ID, type CampusLocation } from '../data/locations';
import {
  FACILITY_BY_LOCATION_ID,
  FACILITY_STALE_AFTER_DAYS,
  facilityIsStale,
  formatCheckedDate,
  type FacilityStatus,
} from '../data/facilities';
import {
  ACCESSIBILITY_FEATURES,
  ACCESSIBILITY_KIND_BY_ID,
  featuresForLocation,
} from '../data/accessibility';
import { formatCoordinates, googlePlaceUrl } from '../lib/maps';
import { useI18n, type TranslationKey } from '../lib/i18n';

interface LocationCardProps {
  location: CampusLocation;
  onClose: () => void;
  onDirections: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
  onAccessibility: () => void;
}

const STATUS_CLASS: Record<FacilityStatus, string> = {
  open: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  'temporarily-closed': 'bg-red-50 text-red-800 border-red-200',
  unconfirmed: 'bg-slate-100 text-slate-700 border-slate-200',
};

export function LocationCard({
  location,
  onClose,
  onDirections,
  onCampusRoute,
  onAccessibility,
}: LocationCardProps) {
  const { t } = useI18n();
  const meta = CATEGORY_BY_ID[location.category];
  const placeUrl = location.googlePlaceId
    ? googlePlaceUrl(location.googlePlaceId)
    : location.verification.url;
  const facility = FACILITY_BY_LOCATION_ID.get(location.id);
  const accessibilityFeatures = featuresForLocation(location.id);

  return (
    <section
      aria-label={`${location.name} details`}
      className="surface absolute bottom-2 left-2 right-2 z-30 max-h-[48dvh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl lg:bottom-4 lg:left-4 lg:right-auto lg:max-h-[calc(100%-2rem)] lg:w-[380px]"
    >
      <div className="flex items-start gap-3 border-b border-slate-100 bg-slate-50/80 px-4 pb-3 pt-2.5">
        <span
          aria-hidden="true"
          className="mt-1 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
          style={{ backgroundColor: meta.softColor }}
        >
          {meta.emoji}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {t(`cat.${location.category}` as TranslationKey)}
          </p>
          <h2 className="truncate text-base font-extrabold tracking-tight text-navy-900">
            {location.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t('location.close')}
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-200 hover:text-navy-900"
        >
          <X aria-hidden="true" className="h-4 w-4" />
        </button>
      </div>

      <div className="nice-scroll max-h-[calc(48dvh-8rem)] overflow-y-auto px-4 py-3 lg:max-h-[calc(100dvh-14rem)]">
        <p className="text-[13px] leading-relaxed text-slate-700">{location.description}</p>

        {location.caution ? (
          <p className="mt-2.5 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-2.5 py-2 text-[11px] font-medium leading-relaxed text-amber-900">
            <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {location.caution}
          </p>
        ) : null}

        {facility ? (
          <section
            aria-label={t('location.facilityTitle')}
            className="mt-2.5 rounded-xl border border-slate-200 bg-white px-2.5 py-2"
          >
            <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <Clock aria-hidden="true" className="h-3 w-3" />
              {t('location.facilityTitle')}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <span
                className={`rounded-full border px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${STATUS_CLASS[facility.status]}`}
              >
                {t(`location.status.${facility.status}` as TranslationKey)}
              </span>
              <span className="text-[10px] font-semibold text-slate-500">
                {t('location.facilityUpdated', {
                  date: formatCheckedDate(facility.lastUpdated),
                })}
              </span>
            </div>
            {facility.hours && facility.hours.length > 0 ? (
              <ul className="mt-1 space-y-0.5 text-[11px] text-slate-600">
                {facility.hours.map((slot) => (
                  <li key={`${slot.days}-${slot.opens}`}>
                    {slot.days}: {slot.opens}–{slot.closes}
                    {slot.note ? ` (${slot.note})` : ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-[11px] text-slate-600">
                {t('location.hoursNotPublished')}
              </p>
            )}
            {facility.note ? (
              <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{facility.note}</p>
            ) : null}
            {facilityIsStale(facility) ? (
              <p className="mt-1 text-[11px] font-semibold leading-relaxed text-amber-800">
                {t('location.facilityStale', { days: FACILITY_STALE_AFTER_DAYS })}
              </p>
            ) : null}
            <p className="mt-1 text-[10px] leading-relaxed text-slate-500">
              {t('location.facilityNotLive')}{' '}
              {facility.source ? (
                <a
                  href={facility.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-blue-700 hover:underline"
                >
                  {facility.source.label}
                </a>
              ) : null}
            </p>
          </section>
        ) : null}

        <section
          aria-label={t('location.accessibilityTitle')}
          className="mt-2.5 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2"
        >
          <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            <Accessibility aria-hidden="true" className="h-3 w-3" />
            {t('location.accessibilityTitle')}
          </p>
          {accessibilityFeatures.length > 0 ? (
            <ul className="mt-1 space-y-0.5 text-[11px] text-slate-700">
              {accessibilityFeatures.map((feature) => (
                <li key={feature.id}>
                  <span aria-hidden="true">
                    {ACCESSIBILITY_KIND_BY_ID[feature.kind].emoji}
                  </span>{' '}
                  {feature.label}
                  {feature.note ? ` — ${feature.note}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              {ACCESSIBILITY_FEATURES.length === 0
                ? t('location.accessibilityUnsurveyed')
                : t('location.accessibilityNone')}
            </p>
          )}
          {location.accessibility ? (
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              {location.accessibility}
            </p>
          ) : null}
          <button
            type="button"
            onClick={onAccessibility}
            className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
          >
            {t('location.accessibilityViewAll')}
          </button>
        </section>

        <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-[11px]">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">
              {t('location.alsoCalled')}
            </dt>
            <dd className="min-w-0 text-slate-600">{location.aliases.slice(0, 4).join(', ')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">
              {t('location.position')}
            </dt>
            <dd className="text-slate-600">{formatCoordinates(location)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">
              {t('location.verified')}
            </dt>
            <dd className="text-slate-600">
              <a
                href={location.verification.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 hover:underline"
              >
                {location.verification.label}
              </a>{' '}
              · checked {location.verification.checkedOn}
            </dd>
          </div>
          {location.officialUrl ? (
            <div className="flex gap-2">
              <dt className="w-20 shrink-0 font-bold text-slate-500">
                {t('location.official')}
              </dt>
              <dd>
                <a
                  href={location.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 font-semibold text-blue-700 hover:underline"
                >
                  MCE page
                  <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
                </a>
              </dd>
            </div>
          ) : null}
        </dl>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-slate-100 bg-white px-3 py-2.5">
        <button
          type="button"
          onClick={() => onDirections(location)}
          className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-gold-500 px-3 py-2 text-xs font-extrabold text-navy-950 shadow-sm transition hover:bg-gold-400"
        >
          <Navigation aria-hidden="true" className="h-4 w-4" />
          {t('location.directions')}
        </button>
        <button
          type="button"
          onClick={() => onCampusRoute(location)}
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-navy-900 transition hover:bg-slate-50"
        >
          <Footprints aria-hidden="true" className="h-3.5 w-3.5" />
          {t('location.campusRoute')}
        </button>
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-navy-900 transition hover:bg-slate-50"
        >
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          {t('location.googleMaps')}
        </a>
      </div>
    </section>
  );
}
