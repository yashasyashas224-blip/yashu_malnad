import { useEffect, useState } from 'react';
import {
  ArrowRight,
  Check,
  Footprints,
  GraduationCap,
  MapPin,
  Navigation,
  RotateCcw,
} from 'lucide-react';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import { TOUR_STOPS, TOUR_SUMMARY, TOUR_TITLE } from '../data/tour';
import {
  currentStop,
  exitTour,
  jumpToStop,
  loadProgress,
  markStopVisited,
  restartTour,
  startTour,
  tourPercent,
  type TourProgress,
} from '../lib/tour';
import { STORAGE_EXPLANATION } from '../lib/localStore';
import { Modal } from './Modal';

interface TourSheetProps {
  open: boolean;
  onClose: () => void;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

export function TourSheet({ open, onClose, onOpenLocation, onCampusRoute }: TourSheetProps) {
  const [progress, setProgress] = useState<TourProgress>(() => loadProgress());

  useEffect(() => {
    if (open) setProgress(loadProgress());
  }, [open]);

  const stop = currentStop(progress);
  const stopLocation = stop ? LOCATION_BY_ID.get(stop.locationId) : undefined;
  const percent = tourPercent(progress);
  const started = progress.startedAt !== null;
  const visitedCount = progress.visited.length;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TOUR_TITLE}
      description="A short walk through the verified places a new student needs first."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          <Footprints aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span>{STORAGE_EXPLANATION}</span>
        </p>

        {!started ? (
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gold-500/20 text-navy-900">
              <GraduationCap aria-hidden="true" className="h-6 w-6" />
            </span>
            <p className="mt-2 text-sm font-extrabold text-navy-900">{TOUR_TITLE}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-600">
              {TOUR_SUMMARY}
            </p>
            <button
              type="button"
              onClick={() => setProgress(startTour())}
              className="mt-3 inline-flex min-h-[42px] items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-4 text-sm font-bold text-white hover:bg-navy-800"
            >
              <Footprints aria-hidden="true" className="h-4 w-4" />
              Start the tour
            </button>
          </div>
        ) : (
          <>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                <span>
                  {progress.finished
                    ? 'Tour complete'
                    : `Stop ${Math.min(progress.index + 1, TOUR_STOPS.length)} of ${TOUR_STOPS.length}`}
                </span>
                <span>{percent}%</span>
              </div>
              <div
                role="progressbar"
                aria-label="Tour progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="mt-1 h-2 overflow-hidden rounded-full bg-slate-200"
              >
                <div
                  className="h-full rounded-full bg-gold-500 transition-[width]"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <p className="mt-1 text-[10px] text-slate-500">
                {visitedCount} of {TOUR_STOPS.length} stops marked as reached.
              </p>
            </div>

            {progress.finished || !stop ? (
              <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-center">
                <Check aria-hidden="true" className="mx-auto h-6 w-6 text-emerald-700" />
                <p className="mt-2 text-sm font-extrabold text-emerald-900">
                  That is the whole tour
                </p>
                <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-emerald-900">
                  You have seen the main gate, the academic block, CS&amp;E, the library, the
                  canteen and the play ground. Restart it whenever you want, or walk it again with
                  a friend.
                </p>
                <button
                  type="button"
                  onClick={() => setProgress(restartTour())}
                  className="mt-3 inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-xl bg-navy-900 px-3 text-xs font-bold text-white hover:bg-navy-800"
                >
                  <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                  Walk it again
                </button>
              </div>
            ) : (
              <section
                aria-label="Current tour stop"
                className="mt-4 rounded-2xl border border-gold-500/50 bg-gold-500/10 p-3"
              >
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-navy-900">
                  {stop.title}
                </p>
                <p className="mt-1 flex items-center gap-1 text-sm font-extrabold text-navy-900">
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />
                  {stopLocation?.name ?? 'Verified campus place'}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-slate-700">{stop.explanation}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setProgress(markStopVisited(progress, stop.id))}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-navy-900 px-2.5 text-[11px] font-bold text-white hover:bg-navy-800"
                  >
                    <Check aria-hidden="true" className="h-3.5 w-3.5" />
                    I’m here — next stop
                  </button>
                  {stopLocation ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onCampusRoute(stopLocation)}
                        className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
                      >
                        <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                        Campus route
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenLocation(stopLocation)}
                        className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 bg-white px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                      >
                        Open place
                      </button>
                    </>
                  ) : null}
                </div>
              </section>
            )}

            <h3 className="mt-4 text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              All stops
            </h3>
            <ol className="mt-2 space-y-1.5">
              {TOUR_STOPS.map((item, index) => {
                const location = LOCATION_BY_ID.get(item.locationId);
                const visited = progress.visited.includes(item.id);
                const isCurrent = !progress.finished && index === progress.index;
                return (
                  <li key={item.id}>
                    <div
                      className={`flex items-center gap-2 rounded-xl border px-2.5 py-2 ${
                        isCurrent
                          ? 'border-gold-500 bg-gold-500/10'
                          : 'border-slate-200 bg-white'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-[10px] font-extrabold ${
                          visited
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {visited ? <Check className="h-3 w-3" /> : index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-bold text-navy-900">{item.title}</p>
                        <p className="truncate text-[10px] text-slate-500">
                          {location?.name ?? 'Unmapped place'}
                          {visited ? ' · visited' : ''}
                        </p>
                      </div>
                      {!visited ? (
                        <button
                          type="button"
                          onClick={() => setProgress(jumpToStop(progress, index))}
                          className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-navy-900 hover:bg-slate-50"
                        >
                          Go
                          <ArrowRight aria-hidden="true" className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ol>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setProgress(restartTour())}
                className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
              >
                <RotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
                Restart
              </button>
              <button
                type="button"
                onClick={() => setProgress(exitTour())}
                className="inline-flex min-h-[38px] items-center rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50"
              >
                Leave the tour and clear progress
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
