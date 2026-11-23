import {
  Accessibility,
  ArrowUpRight,
  ExternalLink,
  Info,
  Navigation,
  X,
} from 'lucide-react';
import {
  CATEGORY_BY_ID,
  type CampusLocation,
} from '../data/locations';
import { formatCoordinates, googlePlaceUrl } from '../lib/maps';

interface LocationCardProps {
  location: CampusLocation;
  onClose: () => void;
  onDirections: (location: CampusLocation) => void;
}

export function LocationCard({ location, onClose, onDirections }: LocationCardProps) {
  const meta = CATEGORY_BY_ID[location.category];
  const placeUrl = location.googlePlaceId
    ? googlePlaceUrl(location.googlePlaceId)
    : location.verification.url;

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
            {meta.label}
          </p>
          <h2 className="truncate text-base font-extrabold tracking-tight text-navy-900">
            {location.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close place details"
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

        {location.accessibility ? (
          <p className="mt-2.5 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
            <Accessibility aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            {location.accessibility}
          </p>
        ) : null}

        <dl className="mt-3 space-y-1.5 border-t border-slate-100 pt-2.5 text-[11px]">
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">Also called</dt>
            <dd className="min-w-0 text-slate-600">{location.aliases.slice(0, 4).join(', ')}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">Position</dt>
            <dd className="text-slate-600">{formatCoordinates(location)}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="w-20 shrink-0 font-bold text-slate-500">Verified</dt>
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
              <dt className="w-20 shrink-0 font-bold text-slate-500">Official</dt>
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
          Directions
        </button>
        <a
          href={placeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl border border-slate-300 px-3 py-2 text-xs font-bold text-navy-900 transition hover:bg-slate-50"
        >
          <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
          Google Maps
        </a>
      </div>
    </section>
  );
}
