import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Building2,
  Compass,
  Footprints,
  Info,
  MapPin,
  Navigation,
  Search,
} from 'lucide-react';
import {
  INDOOR_BUILDINGS,
  INDOOR_LAST_CHECKED,
  INDOOR_PENDING_BUILDING_IDS,
  INDOOR_QR_HINT,
} from '../data/indoor';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import {
  OUTDOOR_FALLBACK_NOTE,
  approximateOutdoorMetres,
  buildingForTarget,
  describeLeg,
  entryNode,
  findIndoorRoute,
  nodeById,
  parseIndoorCode,
  type IndoorCodeTarget,
} from '../lib/indoor';
import { Modal } from './Modal';

interface IndoorSheetProps {
  open: boolean;
  onClose: () => void;
  /** A code scanned or opened from a link, such as mce-indoor:main-block:mb-entrance. */
  target: IndoorCodeTarget | null;
  onOpenLocation: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

export function IndoorSheet({
  open,
  onClose,
  target,
  onOpenLocation,
  onCampusRoute,
}: IndoorSheetProps) {
  const [manualTarget, setManualTarget] = useState<IndoorCodeTarget | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setManualTarget(null);
    setCode('');
    setMessage(null);
  }, [open]);

  const effective = target ?? manualTarget;
  const building = effective ? buildingForTarget(effective) : null;
  const place = effective ? LOCATION_BY_ID.get(effective.buildingId) : undefined;
  const entry = building ? entryNode(building) : null;
  const destination =
    building && effective?.nodeId ? nodeById(building, effective.nodeId) : null;
  const guidance =
    building && entry && destination && entry.id !== destination.id
      ? findIndoorRoute(building.buildingId, entry.id, destination.id)
      : null;

  const fallbackMetres =
    effective && place ? approximateOutdoorMetres('main-gate', place.id) : null;

  const checkCode = (): void => {
    const parsed = parseIndoorCode(code);
    if (!parsed) {
      setManualTarget(null);
      setMessage(
        'That is not an indoor code. An indoor code starts with “mce-indoor:” and names a building, for example mce-indoor:main-block.',
      );
      return;
    }
    setManualTarget(parsed);
    setMessage(null);
  };

  const pendingPlaces = INDOOR_PENDING_BUILDING_IDS.map((id) => LOCATION_BY_ID.get(id)).filter(
    (location): location is CampusLocation => Boolean(location),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Indoor guidance"
      description="The last few metres, inside the building — only where a walk has actually been surveyed."
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <p className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-[11px] leading-relaxed text-slate-600">
          <Info aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-500" />
          <span>
            Indoor waypoints are surveyed once per building and stored in{' '}
            <code className="rounded bg-slate-200 px-1">web/src/data/indoor.ts</code>.{' '}
            {INDOOR_BUILDINGS.length === 0
              ? 'No building has a survey yet, so indoor step-by-step guidance is not available and the app will only guide you to the building.'
              : `${INDOOR_BUILDINGS.length} building${INDOOR_BUILDINGS.length === 1 ? ' is' : 's are'} surveyed.`}{' '}
            Last check: {INDOOR_LAST_CHECKED}.
          </span>
        </p>

        {effective ? (
          <section className="mt-3 rounded-2xl border border-slate-200 bg-white p-3">
            <h3 className="flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-500">
              <Building2 aria-hidden="true" className="h-3.5 w-3.5" />
              Scanned or pasted code
            </h3>
            <p className="mt-1 text-sm font-extrabold text-navy-900">
              {place?.name ?? effective.buildingId}
              {destination ? ` · ${destination.label}` : ''}
            </p>
            <p className="mt-0.5 text-[10px] text-slate-500">{effective.raw}</p>

            {guidance && guidance.ok ? (
              <>
                <p className="mt-2 text-[11px] font-bold text-slate-600">
                  About {Math.round(guidance.metres)} m indoors
                  {guidance.floorsChanged ? ' · changes floor' : ''}
                  {guidance.provisional ? ' · provisional survey' : ' · surveyed'}
                </p>
                <ol className="mt-1.5 space-y-1">
                  {guidance.legs.map((leg, index) => (
                    <li
                      key={`${leg.from.id}-${leg.to.id}-${index}`}
                      className="flex items-start gap-2 rounded-lg bg-slate-50 px-2 py-1.5 text-[11px] text-slate-700"
                    >
                      <span
                        aria-hidden="true"
                        className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-navy-900 text-[9px] font-extrabold text-white"
                      >
                        {index + 1}
                      </span>
                      <span>
                        {describeLeg(leg)}
                        {leg.edge.note ? ` — ${leg.edge.note}` : ''}
                      </span>
                    </li>
                  ))}
                </ol>
              </>
            ) : (
              <div className="mt-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2">
                <p className="flex items-start gap-2 text-[11px] font-medium leading-relaxed text-amber-900">
                  <AlertTriangle aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <span>
                    {OUTDOOR_FALLBACK_NOTE}
                    {effective.nodeId && building
                      ? ` The code names “${effective.nodeId}”, which is not a surveyed waypoint in this building.`
                      : ''}
                  </span>
                </p>
                {fallbackMetres !== null ? (
                  <p className="mt-1 text-[10px] text-amber-900">
                    The {place?.name ?? 'building'} is about{' '}
                    {Math.max(10, Math.round(fallbackMetres / 10) * 10)} m in a straight line from
                    the main gate — not a walking route.
                  </p>
                ) : null}
              </div>
            )}

            {place ? (
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCampusRoute(place);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
                >
                  <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                  Outdoor route to {place.shortName}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLocation(place);
                  }}
                  className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                >
                  <MapPin aria-hidden="true" className="h-3.5 w-3.5" />
                  Open place
                </button>
              </div>
            ) : (
              <p className="mt-2 text-[11px] leading-relaxed text-slate-600">
                This code names a building that is not in the verified campus dataset, so no route
                can be offered. Ask at the college office or search for the place.
              </p>
            )}
          </section>
        ) : null}

        <form
          className="mt-3"
          onSubmit={(event) => {
            event.preventDefault();
            checkCode();
          }}
        >
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Paste an indoor code
            </span>
            <span className="mt-1 flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3">
              <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
              <input
                type="text"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="mce-indoor:main-block:mb-entrance"
                className="min-h-[42px] w-full bg-transparent text-sm text-navy-900 outline-none placeholder:text-slate-400"
              />
            </span>
          </label>
          <button
            type="submit"
            className="mt-2 inline-flex min-h-[38px] items-center justify-center gap-1.5 rounded-lg border border-slate-300 px-3 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
          >
            <Compass aria-hidden="true" className="h-3.5 w-3.5" />
            Check this code
          </button>
          <p role="status" aria-live="polite" className="mt-1 min-h-[1rem] text-[11px] font-semibold text-amber-800">
            {message ?? ''}
          </p>
        </form>

        {INDOOR_BUILDINGS.length > 0 ? (
          <section className="mt-3">
            <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              Surveyed buildings
            </h3>
            <ul className="mt-2 space-y-1.5">
              {INDOOR_BUILDINGS.map((item) => {
                const location = LOCATION_BY_ID.get(item.buildingId);
                return (
                  <li
                    key={item.buildingId}
                    className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-2.5 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-xs font-bold text-navy-900">{item.name}</p>
                      <p className="truncate text-[10px] text-slate-500">
                        {item.nodes.length} waypoints · {item.survey}
                        {location ? ` · ${location.name}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const entrance = entryNode(item);
                        if (!entrance) return;
                        setManualTarget({
                          buildingId: item.buildingId,
                          nodeId: entrance.id,
                          raw: `mce-indoor:${item.buildingId}:${entrance.id}`,
                        });
                      }}
                      className="inline-flex min-h-[32px] shrink-0 items-center rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-navy-900 hover:bg-slate-50"
                    >
                      Show
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        ) : null}

        <section className="mt-3">
          <h3 className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Buildings waiting for an indoor survey ({pendingPlaces.length})
          </h3>
          <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
            These places exist on the outdoor map, but no floor plan or waypoint list has been
            verified for them, so the app guides you only to the building.
          </p>
          <ul className="mt-2 space-y-1.5">
            {pendingPlaces.map((location) => (
              <li
                key={location.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-slate-300 bg-white px-2.5 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold text-navy-900">{location.name}</p>
                  <p className="truncate text-[10px] text-slate-500">
                    Indoor waypoints: not surveyed
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onCampusRoute(location);
                  }}
                  className="inline-flex min-h-[32px] shrink-0 items-center gap-1 rounded-lg border border-slate-300 px-2 text-[10px] font-bold text-navy-900 hover:bg-slate-50"
                >
                  <Footprints aria-hidden="true" className="h-3 w-3" />
                  Outdoor route
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="mt-3 rounded-xl bg-slate-50 px-3 py-2 text-[10px] leading-relaxed text-slate-500">
          {INDOOR_QR_HINT}
        </p>
      </div>
    </Modal>
  );
}
