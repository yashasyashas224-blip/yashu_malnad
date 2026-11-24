/**
 * Campus classrooms.
 *
 * THERE IS NO VERIFIED CLASSROOM DATA IN THIS PROJECT YET, so this array is
 * empty and the Classroom finder says so. Rooms, floors and course-to-room
 * assignments change every term and are not published by the college in a
 * machine-readable form, so they must never be guessed.
 *
 * HOW A MAINTAINER ADDS DATA
 * --------------------------
 * Collect the list from the department office / timetable PDF, then add one
 * object per room. Keep `verified` false until the department confirms it, and
 * always keep the source link so a student can check it:
 *
 *   {
 *     id: 'cse-cs204',
 *     room: 'CS-204',
 *     label: 'Computer Networks Laboratory',
 *     buildingId: 'cse-department',   // must exist in data/locations.ts
 *     floor: 'Second floor',
 *     department: 'Computer Science & Engineering',
 *     courses: [{ code: '21CS52', title: 'Computer Networks' }],
 *     capacity: 60,
 *     accessibility: null,
 *     source: { label: 'CSE department timetable 2026-27', url: 'https://…' },
 *     verified: true,
 *     checkedOn: '2026-11-24',
 *   }
 *
 * `courses` only takes the timetable assignments you can cite. If a room is
 * used by many courses, list them all — the finder searches both.
 */

export interface ClassroomCourse {
  code: string;
  title: string;
}

export interface ClassroomSource {
  label: string;
  url: string;
}

export interface Classroom {
  id: string;
  /** Room number as it appears on the door, e.g. "CS-204". */
  room: string;
  label: string;
  /** Must be a place id from locations.ts, so directions work. */
  buildingId: string;
  floor: string | null;
  department: string;
  courses: ClassroomCourse[];
  capacity: number | null;
  /** Only fill when the department has confirmed it. */
  accessibility: string | null;
  source: ClassroomSource | null;
  verified: boolean;
  checkedOn: string | null;
}

export const CLASSROOMS: Classroom[] = [];

export const CLASSROOMS_LAST_CHECKED = 'Not published yet';

export const CLASSROOM_DEPARTMENTS: string[] = Array.from(
  new Set(CLASSROOMS.map((room) => room.department)),
).sort((a, b) => a.localeCompare(b));

export const CLASSROOM_COURSES: ClassroomCourse[] = Array.from(
  new Map(
    CLASSROOMS.flatMap((room) => room.courses).map((course) => [course.code, course]),
  ).values(),
).sort((a, b) => a.code.localeCompare(b.code));

export const CLASSROOM_BUILDING_IDS: string[] = Array.from(
  new Set(CLASSROOMS.map((room) => room.buildingId)),
);
