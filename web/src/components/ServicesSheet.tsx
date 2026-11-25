import { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  CheckCircle2,
  CircleHelp,
  MapPin,
  Navigation,
  Search,
  SearchX,
} from 'lucide-react';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import {
  SERVICE_CONTACTS,
  SERVICE_LAST_CHECKED,
  SERVICE_NEEDS,
  SERVICE_NEED_BY_ID,
  SERVICES,
  servicesForNeed,
  type CampusService,
  type ServiceNeedId,
} from '../data/services';
import { searchServices } from '../lib/services';
import { Modal } from './Modal';

interface ServicesSheetProps {
  open: boolean;
  onClose: () => void;
  initialQuery?: string;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

function ServiceCard({
  service,
  onOpenLocation,
  onCampusRoute,
}: {
  service: CampusService;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}) {
  const location = LOCATION_BY_ID.get(service.locationId);
  const need = SERVICE_NEED_BY_ID.get(service.needId);
  return (
    <li className="rounded-2xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-2">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-800"
        >
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            {need?.label ?? 'Service'}
          </p>
          <p className="text-sm font-extrabold text-navy-900">{service.title}</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-slate-600">
            <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
            {location?.name ?? 'Unmapped place'}
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">{service.details}</p>
          {!service.verified ? (
            <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
              Reported, not verified
            </span>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {location ? (
          <>
            <button
              type="button"
              onClick={() => onOpenLocation(location)}
              className="inline-flex min-h-[36px] items-center rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
            >
              Open place
            </button>
            <button
              type="button"
              onClick={() => onCampusRoute(location)}
              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
            >
              <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
              Campus route
            </button>
          </>
        ) : null}
        {service.source ? (
          <a
            href={service.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
          >
            {service.source.label}
            <ArrowUpRight aria-hidden="true" className="h-3 w-3" />
          </a>
        ) : null}
      </div>
      {service.checkedOn ? (
        <p className="mt-1 text-[10px] text-slate-400">Checked {service.checkedOn}</p>
      ) : null}
    </li>
  );
}

export function ServicesSheet({
  open,
  onClose,
  initialQuery,
  onOpenLocation,
  onCampusRoute,
}: ServicesSheetProps) {
  const [query, setQuery] = useState(initialQuery ?? '');
  const [need, setNeed] = useState<ServiceNeedId | 'all'>('all');

  useEffect(() => {
    if (!open) return;
    setQuery(initialQuery ?? '');
    setNeed('all');
  }, [open, initialQuery]);

  const trimmed = query.trim();
  const selectedNeed = need === 'all' ? null : (SERVICE_NEED_BY_ID.get(need) ?? null);

  const results = useMemo<CampusService[]>(() => {
    if (trimmed) return searchServices(trimmed).map((hit) => hit.service);
    if (need !== 'all') return servicesForNeed(need);
    return SERVICES;
  }, [trimmed, need]);

  const selectedNeedEmpty =
    selectedNeed !== null && !trimmed && servicesForNeed(selectedNeed.id).length === 0;

  const unverifiedNeeds = SERVICE_NEEDS.filter(
    (item) => servicesForNeed(item.id).length === 0,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Find a campus service"
      description="Start from what you need — printing, water, first aid, food, a study space."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <label className="block">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            What do you need?
          </span>
          <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
            <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="print, water, first aid, certificate…"
              className="min-h-[42px] w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
            />
          </span>
        </label>

        <div className="mt-2 flex flex-wrap gap-1.5">
          <button
            type="button"
            aria-pressed={need === 'all'}
            onClick={() => {
              setNeed('all');
              setQuery('');
            }}
            className={`min-h-[34px] rounded-full border px-3 text-[11px] font-bold transition ${
              need === 'all'
                ? 'border-navy-900 bg-navy-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            All needs
          </button>
          {SERVICE_NEEDS.map((item) => {
            const count = servicesForNeed(item.id).length;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={need === item.id}
                onClick={() => {
                  setNeed(item.id);
                  setQuery('');
                }}
                className={`min-h-[34px] rounded-full border px-3 text-[11px] font-bold transition ${
                  need === item.id
                    ? 'border-navy-900 bg-navy-900 text-white'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                {item.label}
                <span className="ml-1 font-semibold opacity-70">{count}</span>
              </button>
            );
          })}
        </div>

        {selectedNeed ? (
          <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
            <span className="font-bold text-slate-700">{selectedNeed.label}:</span>{' '}
            {selectedNeed.description}
          </p>
        ) : null}

        {selectedNeedEmpty && selectedNeed ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <CircleHelp aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">
              No verified {selectedNeed.label.toLowerCase()} location is published yet
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              MCE has not published a checked position for this need, so the app does not pin a
              guess. Ask the college office directly, or check the official MCE site.
            </p>
          </div>
        ) : results.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">
              Nothing verified matches “{trimmed}”
            </p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Try a need such as “print”, “water”, “food”, “study” or “prayer”. Services without a
              verified place are listed below instead of being guessed.
            </p>
          </div>
        ) : (
          <>
            <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {trimmed || need !== 'all' ? 'Matching services' : 'Verified services'} ({results.length})
            </h3>
            <ul className="mt-2 space-y-2">
              {results.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onOpenLocation={onOpenLocation}
                  onCampusRoute={onCampusRoute}
                />
              ))}
            </ul>
          </>
        )}

        {!trimmed && need === 'all' && unverifiedNeeds.length > 0 ? (
          <section className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Needs without a verified location
            </h3>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
              These are real student needs, but no verified MCE position exists in this project, so
              they are deliberately left off the map instead of being invented.
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {unverifiedNeeds.map((item) => (
                <li
                  key={item.id}
                  className="rounded-full border border-dashed border-slate-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600"
                >
                  {item.label}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="mt-3 rounded-xl border border-slate-200 bg-white px-3 py-2">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
            Who to ask
          </p>
          {SERVICE_CONTACTS.map((contact) => (
            <p key={contact.url} className="mt-1 text-[11px] leading-relaxed text-slate-600">
              <span className="font-bold text-slate-700">{contact.label}.</span> {contact.detail}{' '}
              <a
                href={contact.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-semibold text-blue-700 hover:underline"
              >
                Contact page
              </a>
            </p>
          ))}
        </section>

        <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
          Service positions checked {SERVICE_LAST_CHECKED}. Only services backed by a source in this
          project are listed; everything else shows an honest empty state.
        </p>
      </div>
    </Modal>
  );
}
