import { useMemo, useState } from 'react';
import { BookOpenCheck, DoorOpen, Navigation, SearchX } from 'lucide-react';
import {
  CLASSROOM_BUILDING_IDS,
  CLASSROOM_COURSES,
  CLASSROOM_DEPARTMENTS,
  CLASSROOMS,
  type Classroom,
} from '../data/classrooms';
import { LOCATION_BY_ID, type CampusLocation } from '../data/locations';
import { classroomBuildingName, searchClassrooms } from '../lib/classrooms';
import { useI18n } from '../lib/i18n';
import { Modal } from './Modal';

interface ClassroomFinderProps {
  open: boolean;
  onClose: () => void;
  onDirections: (location: CampusLocation) => void;
  onCampusRoute: (location: CampusLocation) => void;
}

const buildingName = classroomBuildingName;

export function ClassroomFinder({
  open,
  onClose,
  onDirections,
  onCampusRoute,
}: ClassroomFinderProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [course, setCourse] = useState('');
  const [buildingId, setBuildingId] = useState('');

  const results = useMemo(
    () => searchClassrooms(CLASSROOMS, { query, department, course, buildingId }),
    [query, department, course, buildingId],
  );

  const hasData = CLASSROOMS.length > 0;
  const selectedBuilding = buildingId ? LOCATION_BY_ID.get(buildingId) : undefined;

  const openRoom = (room: Classroom): void => {
    const location = LOCATION_BY_ID.get(room.buildingId);
    if (location) onCampusRoute(location);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('classroom.title')}
      description={t('classroom.description')}
      variant="center"
    >
      <div className="nice-scroll overflow-y-auto px-5 py-4">
        <div className="space-y-2">
          <label className="block">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
              {t('classroom.queryLabel')}
            </span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('classroom.queryPlaceholder')}
              disabled={!hasData}
              className="mt-1 min-h-[42px] w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-navy-900 placeholder:text-slate-400 disabled:bg-slate-50"
            />
          </label>

          <div className="grid gap-2 sm:grid-cols-3">
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('classroom.department')}
              </span>
              <select
                value={department}
                onChange={(event) => setDepartment(event.target.value)}
                disabled={!hasData}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900 disabled:bg-slate-50"
              >
                <option value="">{t('classroom.all')}</option>
                {CLASSROOM_DEPARTMENTS.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('classroom.course')}
              </span>
              <select
                value={course}
                onChange={(event) => setCourse(event.target.value)}
                disabled={!hasData || CLASSROOM_COURSES.length === 0}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900 disabled:bg-slate-50"
              >
                <option value="">{t('classroom.all')}</option>
                {CLASSROOM_COURSES.map((item) => (
                  <option key={item.code} value={item.code}>
                    {item.code} · {item.title}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
                {t('classroom.building')}
              </span>
              <select
                value={buildingId}
                onChange={(event) => setBuildingId(event.target.value)}
                disabled={!hasData}
                className="mt-1 min-h-[40px] w-full rounded-xl border border-slate-300 bg-white px-2 text-xs font-semibold text-navy-900 disabled:bg-slate-50"
              >
                <option value="">{t('classroom.all')}</option>
                {CLASSROOM_BUILDING_IDS.map((id) => (
                  <option key={id} value={id}>
                    {buildingName(id)}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {!hasData ? (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <BookOpenCheck aria-hidden="true" className="mx-auto h-7 w-7 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">{t('classroom.emptyTitle')}</p>
            <p className="mx-auto mt-1 max-w-md text-xs leading-relaxed text-slate-500">
              {t('classroom.emptyBody')}
            </p>
            <p className="mx-auto mt-2 max-w-md rounded-lg bg-slate-50 px-2.5 py-2 text-[11px] leading-relaxed text-slate-600">
              {t('classroom.emptyAddHint')}
            </p>
          </div>
        ) : (
          <div className="mt-4">
            <p className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-500">
              <span>{t('classroom.results', { count: results.length })}</span>
              {selectedBuilding ? <span>{selectedBuilding.name}</span> : null}
            </p>

            {results.length === 0 ? (
              <div className="mt-2 rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
                <SearchX aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
                <p className="mt-2 text-sm font-bold text-navy-900">
                  {t('classroom.noMatchTitle')}
                </p>
                <p className="mt-1 text-xs text-slate-500">{t('classroom.noMatchBody')}</p>
              </div>
            ) : (
              <ul className="mt-2 space-y-2">
                {results.map((room) => {
                  const location = LOCATION_BY_ID.get(room.buildingId);
                  return (
                    <li
                      key={room.id}
                      className="rounded-2xl border border-slate-200 bg-white p-3"
                    >
                      <div className="flex items-start gap-2">
                        <span
                          aria-hidden="true"
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-800"
                        >
                          <DoorOpen className="h-4 w-4" />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-extrabold text-navy-900">
                            {room.room} · {room.label}
                          </p>
                          <p className="text-[11px] font-semibold text-slate-500">
                            {buildingName(room.buildingId)}
                            {room.floor ? ` · ${room.floor}` : ''}
                            {room.capacity ? ` · ${t('classroom.capacity')} ${room.capacity}` : ''}
                          </p>
                        </div>
                        {!room.verified ? (
                          <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-900">
                            {t('classroom.unverified')}
                          </span>
                        ) : null}
                      </div>

                      {room.courses.length > 0 ? (
                        <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
                          <span className="font-bold text-slate-500">
                            {t('classroom.courses')}:
                          </span>{' '}
                          {room.courses
                            .map((item) => `${item.code} ${item.title}`)
                            .join(' · ')}
                        </p>
                      ) : null}

                      {room.accessibility ? (
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-600">
                          {room.accessibility}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {location ? (
                          <>
                            <button
                              type="button"
                              onClick={() => openRoom(room)}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg bg-gold-500 px-2.5 py-1.5 text-[11px] font-extrabold text-navy-950 hover:bg-gold-400"
                            >
                              <Navigation aria-hidden="true" className="h-3.5 w-3.5" />
                              {t('location.campusRoute')}
                            </button>
                            <button
                              type="button"
                              onClick={() => onDirections(location)}
                              className="inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-slate-300 px-2.5 py-1.5 text-[11px] font-bold text-navy-900 hover:bg-slate-50"
                            >
                              {t('location.directions')}
                            </button>
                          </>
                        ) : (
                          <span className="text-[11px] text-slate-500">
                            {t('location.accessibilityNone')}
                          </span>
                        )}
                        {room.source ? (
                          <a
                            href={room.source.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-[11px] font-semibold text-blue-700 hover:underline"
                          >
                            {room.source.label}
                          </a>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
