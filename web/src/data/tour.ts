/**
 * New-student campus tour.
 *
 * Every stop is a place that already exists in `locations.ts`, so the tour can
 * never send a student somewhere the map does not verify. Explanations restate
 * only what the verified place record or its linked official page says.
 *
 * HOW A MAINTAINER EDITS THE TOUR
 * -------------------------------
 * Add or reorder stops; `locationId` must exist in `locations.ts`. Keep the
 * explanation short (one or two sentences) and factual. When a stop describes
 * something that can change (opening hours, closures), point the student at the
 * place card instead of repeating a number that will go stale.
 */

export interface TourStop {
  id: string;
  /** Place id from locations.ts. */
  locationId: string;
  title: string;
  explanation: string;
}

export const TOUR_STOPS: TourStop[] = [
  {
    id: 'tour-main-gate',
    locationId: 'main-gate',
    title: 'Start at the main gate',
    explanation:
      'The campus entrance is on Salagame Road. Buses and autos drop students here, and every route in this app can start from this point.',
  },
  {
    id: 'tour-main-block',
    locationId: 'main-block',
    title: 'Main Academic Block',
    explanation:
      'The main academic block is the large teaching building. Map listings place the Mechanical Seminar Hall at this point; other departments inside the block are not mapped as separate pins.',
  },
  {
    id: 'tour-cse',
    locationId: 'cse-department',
    title: 'Computer Science & Engineering',
    explanation:
      'The CS&E department building is pinned as the department itself, not as individual laboratories. If you need a specific room, ask the department office — no room list is published here.',
  },
  {
    id: 'tour-library',
    locationId: 'central-library',
    title: 'Central Library',
    explanation:
      'The central library holds the reading rooms and the reference collection. Opening hours are not shown because the published sources disagree, so check the library notice board before travelling.',
  },
  {
    id: 'tour-canteen',
    locationId: 'canteen',
    title: 'Canteen',
    explanation:
      'The canteen is inside the main gate. Its map listing was marked temporarily closed when it was last checked, so confirm it is serving before you rely on it for a meal.',
  },
  {
    id: 'tour-ground',
    locationId: 'play-ground',
    title: 'Play ground',
    explanation:
      'The outdoor ground is used for cricket and football. Indoor sports facilities and the gym have no verified position yet, so they are not on the map.',
  },
];

export const TOUR_TITLE = 'First day on campus';

export const TOUR_SUMMARY =
  'Six verified stops, about 20 minutes of walking. You can leave at any point — progress is saved on this device and you can restart later.';
