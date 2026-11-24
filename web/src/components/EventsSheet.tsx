import { useMemo, useState, type ReactNode } from 'react';
import { CalendarClock, CalendarX2, ExternalLink, MapPin, Navigation } from 'lucide-react';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import { eventDateLabel, isExpired, pastEvents, upcomingEvents, type CampusEvent } from '../data/events';
import { useI18n } from '../lib/i18n';
import { Modal } from './Modal';

interface EventsSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

export function EventsSheet({ open, onClose, onOpenLocation, onCampusRoute }: EventsSheetProps) {
  const { t, language } = useI18n();
  const [showPast, setShowPast] = useState(false);

  const now = useMemo(() => new Date(), []);
  const upcoming = useMemo(() => upcomingEvents(now), [now]);
  const past = useMemo(() => pastEvents(now), [now]);
  const locale = language === 'kn' ? 'kn-IN' : 'en-IN';

  const renderEvent = (event: CampusEvent): ReactNode => {
    const venue = event.venueId ? LOCATION_BY_ID.get(event.venueId) : undefined;
    const expired = isExpired(event, now);
    return (
      <li
        key={event.id}
        className={`rounded-2xl border p-3 ${
          expired ? 'border-slate-200 bg-slate-50 opacity-90' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex items-start gap-2">
          <span
            aria-hidden="true"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
              expired ? 'bg-slate-100 text-slate-500' : 'bg-gold-500/20 text-navy-900'
            }`}
          >
            {expired ? (
              <CalendarX2 className="h-4 w-4" />
            ) : (
              <CalendarClock className="h-4 w-4" />
            )}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold text-navy-900">{event.title}</p>
            <p className="text-[11px] font-semibold text-slate-600">
              {eventDateLabel(event, locale)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-500">
              <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
              {t('events.venue')}: {event.venueName}
            </p>
            {expired ? (
              <span className="mt-1 inline-block rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-slate-700">
                {t('events.expired')}
              </span>
            ) : null}
            {event.description ? (
              <p className="mt-1 text-xs leading-relaxed text-slate-600">{event.description}</p>
            ) : null}
            {!event.verified ? (
              <span className="mt-1 inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                {t('classroom.unverified')}
              </span>
            ) : null}
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          {venue ? (
            <>
              <button
                type="button"
                onClick={() => onOpenLocation(venue)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
              >
                <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                {t('events.openVenue')}
              </button>
              <button
                type="button"
                onClick={() => onCampusRoute(venue)}
                className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 py-1.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
              >
                <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                {t('events.directions')}
              </button>
            </>
          ) : null}
          {event.source ? (
            <a
              href={event.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:underline"
            >
              {event.source.label}
              <ExternalLink aria-hidden="true" className="h-3 w-3" />
            </a>
          ) : null}
        </div>
      </li>
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('events.title')}
      description={t('events.description')}
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        {upcoming.length === 0 && past.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <CalendarClock aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">{t('events.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              {t('events.emptyBody')}
            </p>
            <p className="mx-auto mt-2 max-w-md rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
              {t('events.emptyAddHint')}
            </p>
          </div>
        ) : (
          <>
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('events.upcoming')}
            </h3>
            {upcoming.length === 0 ? (
              <p className="mt-1 text-xs text-slate-500">{t('events.noUpcoming')}</p>
            ) : (
              <ul className="mt-2 space-y-2">{upcoming.map(renderEvent)}</ul>
            )}

            {past.length > 0 ? (
              <div className="mt-4">
                <button
                  type="button"
                  aria-expanded={showPast}
                  onClick={() => setShowPast((value) => !value)}
                  className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 hover:text-navy-900"
                >
                  {t('events.past')} ({past.length})
                </button>
                {showPast ? <ul className="mt-2 space-y-2">{past.map(renderEvent)}</ul> : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </Modal>
  );
}
