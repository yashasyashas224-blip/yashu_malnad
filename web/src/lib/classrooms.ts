import { type Classroom } from '../data/classrooms';
import { LOCATION_BY_ID } from '../data/locations';

export interface ClassroomFilters {
  query?: string;
  department?: string;
  course?: string;
  buildingId?: string;
}

const normalize = (value: string): string => value.toLowerCase().replace(/\s+/g, ' ').trim();

/**
 * Deterministic search over the classroom dataset. It only returns rooms that
 * a maintainer has entered, so it can never invent a room or a timetable.
 */
export function searchClassrooms(
  rooms: Classroom[],
  filters: ClassroomFilters,
): Classroom[] {
  const query = normalize(filters.query ?? '');
  const department = filters.department ?? '';
  const course = filters.course ?? '';
  const buildingId = filters.buildingId ?? '';

  return rooms.filter((room) => {
    if (department && room.department !== department) return false;
    if (buildingId && room.buildingId !== buildingId) return false;
    if (course && !room.courses.some((item) => item.code === course)) return false;
    if (!query) return true;

    const building = LOCATION_BY_ID.get(room.buildingId);
    const haystack = normalize(
      [
        room.room,
        room.label,
        room.department,
        room.floor ?? '',
        building?.name ?? '',
        building?.shortName ?? '',
        ...room.courses.map((item) => `${item.code} ${item.title}`),
      ].join(' '),
    );
    return query.split(' ').every((token) => haystack.includes(token));
  });
}

export const classroomBuildingName = (buildingId: string): string =>
  LOCATION_BY_ID.get(buildingId)?.name ?? 'Building not on the verified map';
