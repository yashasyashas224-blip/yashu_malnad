/**
 * Campus services — “what do I need?” answers, not just building names.
 *
 * A service record ties a NEED (printing, drinking water, first aid, student
 * services, food, study space…) to a VERIFIED campus place. The rule is the
 * same as for `locations.ts`: a need with no verified home gets no location, and
 * the interface says so instead of guessing a room.
 *
 * HOW A MAINTAINER ADDS A SERVICE
 * -------------------------------
 * 1. Confirm the service exists and note exactly where it is (place id from
 *    `locations.ts`, plus a room if the indoor dataset has one).
 * 2. Keep `source` (official page, notice board photo URL, department email
 *    reference) and `checkedOn` — students use them to check you.
 * 3. Leave `verified: false` while it is only reported, never when you have
 *    seen it at that place.
 *
 * Needs with zero verified locations are intentional: printing, drinking water,
 * first aid and student services are not published for MCE Hassan, so the app
 * lists the need and explains that no verified location exists yet.
 */

export type ServiceNeedId =
  | 'printing'
  | 'drinking-water'
  | 'first-aid'
  | 'student-services'
  | 'food'
  | 'study-space'
  | 'sports'
  | 'prayer';

export interface ServiceNeed {
  id: ServiceNeedId;
  label: string;
  /** Words a student might type instead of the label. */
  keywords: string[];
  /** What this need covers, so the empty state can be specific. */
  description: string;
}

export interface ServiceSource {
  label: string;
  url: string;
}

export interface CampusService {
  id: string;
  needId: ServiceNeedId;
  title: string;
  /** Must be a place id from locations.ts so routes and maps work. */
  locationId: string;
  /** Only when the indoor dataset has a verified room/waypoint for it. */
  indoorNodeId: string | null;
  details: string;
  /** False when the service is reported but not seen at that place. */
  verified: boolean;
  source: ServiceSource | null;
  checkedOn: string | null;
}

export const SERVICE_NEEDS: ServiceNeed[] = [
  {
    id: 'printing',
    label: 'Printing & photocopying',
    keywords: ['print', 'printing', 'photocopy', 'xerox', 'scanner', 'stationery'],
    description: 'Printing a document, photocopies or a printout of an assignment.',
  },
  {
    id: 'drinking-water',
    label: 'Drinking water',
    keywords: ['water', 'drinking water', 'ro', 'filter', 'water cooler', 'bottle'],
    description: 'A drinking-water point or refill.',
  },
  {
    id: 'first-aid',
    label: 'First aid & health',
    keywords: ['first aid', 'medical', 'health', 'nurse', 'sick', 'injury', 'ambulance'],
    description: 'First-aid help, a health room or a medical contact on campus.',
  },
  {
    id: 'student-services',
    label: 'Student services',
    keywords: [
      'office',
      'admin',
      'administration',
      'certificate',
      'bonafide',
      'scholarship',
      'fees',
      'examination',
      'placement',
      'help',
    ],
    description: 'Certificates, fees, scholarships, examinations or placement help.',
  },
  {
    id: 'food',
    label: 'Food & drink',
    keywords: ['food', 'canteen', 'lunch', 'snack', 'coffee', 'tea', 'eat'],
    description: 'A meal or snack on campus.',
  },
  {
    id: 'study-space',
    label: 'Study space',
    keywords: ['study', 'reading', 'library', 'quiet', 'books', 'reference', 'exam prep'],
    description: 'A place to read, study or borrow reference material.',
  },
  {
    id: 'sports',
    label: 'Sports & games',
    keywords: ['sports', 'ground', 'cricket', 'football', 'games', 'play'],
    description: 'Outdoor games and physical education space.',
  },
  {
    id: 'prayer',
    label: 'Prayer & quiet space',
    keywords: ['prayer', 'temple', 'meditation', 'yoga', 'spiritual', 'quiet'],
    description: 'A prayer, meditation or quiet space.',
  },
];

/**
 * Only services that a source in this project already verifies. Each one points
 * at a place whose name and position were checked, and the wording matches the
 * verified place description — nothing here claims a counter, room or opening
 * time that has not been published.
 */
export const SERVICES: CampusService[] = [
  {
    id: 'library-study-space',
    needId: 'study-space',
    title: 'Reading rooms and reference collection',
    locationId: 'central-library',
    indoorNodeId: null,
    details:
      'The central library holds the reading rooms and the reference collection. Opening hours are not published here because the official page and the map listing disagree — check before travelling.',
    verified: true,
    source: {
      label: 'Official MCE library page',
      url: 'https://www.mcehassan.ac.in/home/Library',
    },
    checkedOn: '2026-11-23',
  },
  {
    id: 'canteen-food',
    needId: 'food',
    title: 'Campus canteen',
    locationId: 'canteen',
    indoorNodeId: null,
    details:
      'The canteen inside the main gate. Its map listing was marked “temporarily closed” when it was checked in October 2026, so confirm it is serving before you rely on it.',
    verified: true,
    source: {
      label: 'Google Maps listing',
      url: 'https://www.google.com/maps/place/?q=place_id:ChIJ4d9_mTNIpTsRrTQNJl-tSHo',
    },
    checkedOn: '2026-11-23',
  },
  {
    id: 'play-ground-sports',
    needId: 'sports',
    title: 'Play ground',
    locationId: 'play-ground',
    indoorNodeId: null,
    details:
      'The outdoor ground used for cricket and football. Indoor sports facilities and the gym have no verified position, so they are not listed.',
    verified: true,
    source: {
      label: 'Official MCE sports page',
      url: 'https://www.mcehassan.ac.in/home/Sports',
    },
    checkedOn: '2026-11-23',
  },
  {
    id: 'divya-chaitanya-prayer',
    needId: 'prayer',
    title: 'Divya Chaitanya spiritual enclave',
    locationId: 'divya-chaitanya',
    indoorNodeId: null,
    details:
      'A yoga and meditation centre with temples, described on the official MCE Spiritual Enclave page. The position comes from the named OpenStreetMap feature.',
    verified: true,
    source: {
      label: 'Official MCE Spiritual Enclave page',
      url: 'https://www.mcehassan.ac.in/home/Spiritual-Enclave',
    },
    checkedOn: '2026-11-23',
  },
];

export const SERVICE_NEED_BY_ID = new Map(
  SERVICE_NEEDS.map((need) => [need.id, need] as const),
);

export const servicesForNeed = (needId: ServiceNeedId): CampusService[] =>
  SERVICES.filter((service) => service.needId === needId);

export const SERVICE_LAST_CHECKED = '23 November 2026';

/** Repair / account help that is not a mapped place, only a real contact. */
export const SERVICE_CONTACTS = [
  {
    label: 'College office (certificates, fees, general help)',
    detail:
      'The college office is inside the Main Academic Block, but no verified counter or room is published, so it is not pinned as a service location.',
    url: 'https://www.mcehassan.ac.in/home/contactss',
  },
] as const;
