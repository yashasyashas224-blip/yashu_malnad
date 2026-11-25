import { useEffect, useMemo, useState } from 'react';
import {
  AlarmClock,
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock,
  MapPin,
  Navigation,
  Pencil,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import { LOCATIONS, LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import {
  formatClock,
  loadEntries,
  minutesFromTime,
  minutesUntil,
  nextEntry,
  saveEntries,
  sortEntries,
  validateDraft,
  type EntryDraft,
  type PlannerEntry,
} from '../lib/planner';
import { STORAGE_EXPLANATION } from '../lib/localStore';
import { Modal } from './Modal';

interface PlannerSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

const EMPTY_DRAFT = (): EntryDraft => ({
  title: '',
  kind: 'class',
  locationId: LOCATIONS[0]?.id ?? '',
  startTime: '09:00',
  endTime: '',
  note: '',
});

const KIND_LABEL: Record<PlannerEntry['kind'], string> = {
  class: 'Class',
  event: 'Event',
};

export function PlannerSheet({
  open,
  onClose,
  onOpenLocation,
  onCampusRoute,
}: PlannerSheetProps) {
  const [entries, setEntries] = useState<PlannerEntry[]>(() => loadEntries());
  const [draft, setDraft] = useState<EntryDraft>(EMPTY_DRAFT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!open) return;
    setEntries(loadEntries());
    setNow(new Date());
    const timer = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(timer);
  }, [open]);

  const sorted = useMemo(() => sortEntries(entries), [entries]);
  const next = useMemo(() => nextEntry(sorted, now), [sorted, now]);
  const nextLocation = next ? LOCATION_BY_ID.get(next.locationId) : undefined;
  const nextIn = next ? minutesUntil(next, now) : 0;

  const resetForm = (): void => {
    setDraft(EMPTY_DRAFT());
    setEditingId(null);
    setErrors([]);
  };

  const submit = (): void => {
    const result = validateDraft(draft, editingId);
    if (!result.ok) {
      setErrors(result.errors);
      setNotice(null);
      return;
    }

    const nextEntries = editingId
      ? sorted.map((entry) => (entry.id === editingId ? result.entry : entry))
      : [...sorted, result.entry];
    const write = saveEntries(nextEntries);

    setEntries(sortEntries(nextEntries));
    setErrors([]);
    setNotice(
      write.ok
        ? editingId
          ? 'Stop updated on this device.'
          : 'Stop added on this device.'
        : write.error,
    );
    resetForm();
  };

  const startEditing = (entry: PlannerEntry): void => {
    setEditingId(entry.id);
    setDraft({
      title: entry.title,
      kind: entry.kind,
      locationId: entry.locationId,
      startTime: entry.startTime,
      endTime: entry.endTime ?? '',
      note: entry.note ?? '',
    });
    setErrors([]);
    setNotice(null);
  };

  const removeEntry = (id: string): void => {
    if (confirmRemoveId !== id) {
      setConfirmRemoveId(id);
      return;
    }
    const nextEntries = sorted.filter((entry) => entry.id !== id);
    const write = saveEntries(nextEntries);
    setEntries(nextEntries);
    setConfirmRemoveId(null);
    setNotice(write.ok ? 'Stop removed from this device.' : write.error);
    if (editingId === id) resetForm();
  };

  const clearAll = (): void => {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    const write = saveEntries([]);
    setEntries([]);
    setConfirmClear(false);
    setNotice(write.ok ? 'Your day is cleared on this device.' : write.error);
    resetForm();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="My Campus Day"
      description="Your classes and events, in order, with the next place to walk to."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          <CalendarClock aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span>{STORAGE_EXPLANATION}</span>
        </p>

        <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
          {editingId ? 'Edit this stop' : 'Add a stop'}
        </h3>

        <form
          className="mt-2 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <label className="block">
            <span className="text-[11px] font-bold text-slate-600">Class or event name</span>
            <input
              type="text"
              value={draft.title}
              maxLength={80}
              onChange={(event) => setDraft({ ...draft, title: event.target.value })}
              placeholder="e.g. Data Structures lab"
              className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-navy-900 placeholder:text-slate-400"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Campus place</span>
              <select
                value={draft.locationId}
                onChange={(event) => setDraft({ ...draft, locationId: event.target.value })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              >
                {LOCATIONS.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Type</span>
              <select
                value={draft.kind}
                onChange={(event) =>
                  setDraft({ ...draft, kind: event.target.value as EntryDraft['kind'] })
                }
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              >
                <option value="class">Class</option>
                <option value="event">Event</option>
              </select>
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Starts</span>
              <input
                type="time"
                value={draft.startTime}
                onChange={(event) => setDraft({ ...draft, startTime: event.target.value })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              />
            </label>

            <label className="block">
              <span className="text-[11px] font-bold text-slate-600">Ends (optional)</span>
              <input
                type="time"
                value={draft.endTime}
                onChange={(event) => setDraft({ ...draft, endTime: event.target.value })}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900"
              />
            </label>
          </div>

          <label className="block">
            <span className="text-[11px] font-bold text-slate-600">Note (optional)</span>
            <input
              type="text"
              value={draft.note}
              maxLength={160}
              onChange={(event) => setDraft({ ...draft, note: event.target.value })}
              placeholder="e.g. bring the record book"
              className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-3 text-xs text-navy-900 placeholder:text-slate-400"
            />
          </label>

          {errors.length > 0 ? (
            <ul role="alert" className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-[11px] leading-relaxed text-red-800">
              {errors.map((error) => (
                <li key={error} className="flex items-start gap-1.5">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-3 w-3 shrink-0" />
                  {error}
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              className="inline-flex min-h-[42px] flex-1 items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white transition hover:bg-navy-800"
            >
              <CalendarPlus aria-hidden="true" className="h-4 w-4" />
              {editingId ? 'Save changes' : 'Add stop'}
            </button>
            {editingId ? (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex min-h-[42px] items-center justify-center rounded-xl border border-slate-300 px-3 text-xs font-bold text-navy-900 hover:bg-slate-50"
              >
                Cancel edit
              </button>
            ) : null}
          </div>
        </form>

        <p role="status" aria-live="polite" className="mt-2 min-h-[1rem] text-[11px] font-semibold text-slate-600">
          {notice ?? ''}
        </p>

        {sorted.length === 0 ? (
          <div className="mt-3 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <Clock aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">No stops yet</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              Add today’s classes or events above. Each stop keeps only the verified campus place
              and your own time, and the day is shown in order with the next walk highlighted.
            </p>
          </div>
        ) : (
          <>
            {next ? (
              <section
                aria-label="Next stop"
                className="mt-4 rounded-2xl border border-gold-500/50 bg-gold-500/10 p-3"
              >
                <p className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-navy-900">
                  <AlarmClock aria-hidden="true" className="h-3.5 w-3.5" />
                  {nextIn > 0
                    ? `Next in ${nextIn} min`
                    : nextIn === 0
                      ? 'Starting now'
                      : 'In progress'}
                </p>
                <p className="mt-1 text-sm font-extrabold text-navy-900">
                  {formatClock(next.startTime)} · {next.title}
                </p>
                <p className="flex items-center gap-1 text-[11px] text-slate-600">
                  <MapPin aria-hidden="true" className="h-3 w-3 shrink-0" />
                  {nextLocation?.name ?? 'Unknown place'}
                </p>
                {nextLocation ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onCampusRoute(nextLocation)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
                    >
                      <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                      Campus route
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenLocation(nextLocation)}
                      className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                    >
                      Open place
                    </button>
                  </div>
                ) : null}
              </section>
            ) : (
              <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                No more stops today. Add tomorrow’s classes whenever you like.
              </p>
            )}

            <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Today’s stops ({sorted.length})
            </h3>
            <ul className="mt-2 space-y-2">
              {sorted.map((entry) => {
                const location = LOCATION_BY_ID.get(entry.locationId);
                const nowMinutes = now.getHours() * 60 + now.getMinutes();
                const visited = entry.endTime ? minutesFromTime(entry.endTime) < nowMinutes : false;
                return (
                  <li
                    key={entry.id}
                    className="rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="flex items-start gap-2">
                      <span
                        aria-hidden="true"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-navy-900 text-white"
                      >
                        {visited ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Clock className="h-4 w-4" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-extrabold text-navy-900">
                          {formatClock(entry.startTime)}
                          {entry.endTime ? ` – ${formatClock(entry.endTime)}` : ''} · {entry.title}
                        </p>
                        <p className="text-[11px] font-semibold text-slate-500">
                          {KIND_LABEL[entry.kind]} · {location?.name ?? 'Unknown place'}
                        </p>
                        {entry.note ? (
                          <p className="mt-0.5 text-[11px] leading-relaxed text-slate-600">
                            {entry.note}
                          </p>
                        ) : null}
                      </div>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      {location ? (
                        <>
                          <button
                            type="button"
                            onClick={() => onCampusRoute(location)}
                            className="inline-flex min-h-[34px] items-center gap-1 rounded-lg bg-gold-500 px-2 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
                          >
                            <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                            Route
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenLocation(location)}
                            className="inline-flex min-h-[34px] items-center rounded-lg border border-slate-300 px-2 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                          >
                            Place
                          </button>
                        </>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => startEditing(entry)}
                        className="inline-flex min-h-[34px] items-center gap-1 rounded-lg border border-slate-300 px-2 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                      >
                        <Pencil aria-hidden="true" className="h-3 w-3" />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEntry(entry.id)}
                        className={`inline-flex min-h-[34px] items-center gap-1 rounded-lg border px-2 text-[11px] font-bold transition ${
                          confirmRemoveId === entry.id
                            ? 'border-red-300 bg-red-50 text-red-800'
                            : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <Trash2 aria-hidden="true" className="h-3 w-3" />
                        {confirmRemoveId === entry.id ? 'Confirm remove' : 'Remove'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={clearAll}
              className={`mt-3 text-[11px] font-bold underline-offset-2 hover:underline ${
                confirmClear ? 'text-red-700' : 'text-slate-500'
              }`}
            >
              {confirmClear ? 'Tap again to clear all stops' : 'Clear my whole day'}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
