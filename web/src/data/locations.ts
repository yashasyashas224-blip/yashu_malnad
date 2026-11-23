/**
 * Verified campus locations for the public MCE navigator.
 *
 * Rules for adding a place:
 *  1. The name must exist on a Google Maps place listing or an official MCE page.
 *  2. The position must come from that Google Maps listing, or from an
 *     OpenStreetMap feature that is named on an official MCE page.
 *  3. If you cannot verify a position, leave the place out of this file.
 *     The interface never invents a pin for an unverified place.
 *
 * `verification.checkedOn` records the date the listing was last checked.
 */

export type CategoryId =
  | 'entrance'
  | 'academic'
  | 'library'
  | 'food'
  | 'hostel'
  | 'sports'
  | 'landmark';

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  plural: string;
  emoji: string;
  /** Extra words that should match a search for this category. */
  keywords: string[];
  color: string;
  softColor: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: 'entrance',
    label: 'Entrance',
    plural: 'Entrances',
    emoji: '🚪',
    keywords: ['gate', 'entrance', 'entry', 'exit', 'main gate', 'front gate', 'salagame road'],
    color: '#0b1f3a',
    softColor: '#dbe4f0',
  },
  {
    id: 'academic',
    label: 'Academic',
    plural: 'Academic blocks',
    emoji: '🏛️',
    keywords: ['academic', 'department', 'class', 'classroom', 'lab', 'laboratory', 'block', 'seminar'],
    color: '#1d4ed8',
    softColor: '#dbeafe',
  },
  {
    id: 'library',
    label: 'Library',
    plural: 'Library',
    emoji: '📚',
    keywords: ['library', 'study', 'reading', 'reference', 'books', 'journal', 'digital library'],
    color: '#6d28d9',
    softColor: '#ede9fe',
  },
  {
    id: 'food',
    label: 'Food',
    plural: 'Food & drink',
    emoji: '☕',
    keywords: ['food', 'eat', 'canteen', 'cafeteria', 'coffee', 'snack', 'lunch', 'mess', 'drink'],
    color: '#c2410c',
    softColor: '#ffedd5',
  },
  {
    id: 'hostel',
    label: 'Hostel',
    plural: 'Hostels',
    emoji: '🏠',
    keywords: ['hostel', 'dorm', 'dormitory', 'accommodation', 'stay', 'rooms', 'warden'],
    color: '#047857',
    softColor: '#d1fae5',
  },
  {
    id: 'sports',
    label: 'Sports',
    plural: 'Sports',
    emoji: '⚽',
    keywords: ['sports', 'playground', 'ground', 'field', 'cricket', 'football', 'gym', 'games'],
    color: '#15803d',
    softColor: '#dcfce7',
  },
  {
    id: 'landmark',
    label: 'Landmark',
    plural: 'Landmarks',
    emoji: '🕉️',
    keywords: ['landmark', 'temple', 'spiritual', 'yoga', 'meditation', 'prayer', 'divya chaitanya'],
    color: '#a16207',
    softColor: '#fef3c7',
  },
];

export const CATEGORY_BY_ID = Object.fromEntries(
  CATEGORIES.map((category) => [category.id, category]),
) as Record<CategoryId, CategoryMeta>;

export type VerificationKind = 'google_maps' | 'google_maps_and_official' | 'osm_and_official';

export interface CampusLocation {
  id: string;
  name: string;
  shortName: string;
  category: CategoryId;
  coordinates: { lat: number; lng: number };
  description: string;
  aliases: string[];
  googlePlaceId: string | null;
  /** Only filled when the source actually states it. */
  accessibility: string | null;
  /** A verified caveat worth showing before someone travels. */
  caution: string | null;
  verification: {
    kind: VerificationKind;
    label: string;
    checkedOn: string;
    url: string;
  };
  officialUrl: string | null;
}

export interface LatLng {
  lat: number;
  lng: number;
}

const googlePlaceUrl = (placeId: string): string =>
  `https://www.google.com/maps/place/?q=place_id:${placeId}`;

const CHECKED_ON = '2026-11-23';

export const LOCATIONS: CampusLocation[] = [
  {
    id: 'main-gate',
    name: 'Main Gate',
    shortName: 'Main gate',
    category: 'entrance',
    coordinates: { lat: 13.0239511, lng: 76.1014527 },
    description:
      'The campus entrance on Salagame Road, listed on Google Maps as “Malnad Engineering College main Gate”. Start here if you are arriving by bus, auto or car.',
    aliases: [
      'gate',
      'main gate',
      'main entrance',
      'front gate',
      'college gate',
      'salagame road entrance',
      'entrance',
    ],
    googlePlaceId: 'ChIJzU6BPv9JpTsRfsK1N-iq14U',
    accessibility: null,
    caution: null,
    verification: {
      kind: 'google_maps_and_official',
      label: 'Google Maps listing + official MCE address',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJzU6BPv9JpTsRfsK1N-iq14U'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/contactss',
  },
  {
    id: 'main-block',
    name: 'Main Academic Block',
    shortName: 'Main block',
    category: 'academic',
    coordinates: { lat: 13.023961, lng: 76.102551 },
    description:
      'The main academic block. Google Maps lists the Mechanical Seminar Hall at this point, with the address “MCE Main Block”. Other departments in the block are not published as separate pins.',
    aliases: [
      'main block',
      'main building',
      'mechanical block',
      'mech block',
      'mechanical department',
      'mechanical seminar hall',
      'seminar hall',
      'mech',
    ],
    googlePlaceId: 'ChIJL5cbVgBJpTsRKrDVoo96H0Y',
    accessibility: null,
    caution: null,
    verification: {
      kind: 'google_maps',
      label: 'Google Maps listing',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJL5cbVgBJpTsRKrDVoo96H0Y'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Program',
  },
  {
    id: 'cse-department',
    name: 'CS&E Department',
    shortName: 'CS&E',
    category: 'academic',
    coordinates: { lat: 13.0229405, lng: 76.1026439 },
    description:
      'The Computer Science & Engineering department building, listed on Google Maps as “MCE CS&E Department”. This pin is for the department itself, not each laboratory inside it.',
    aliases: [
      'cse',
      'cs',
      'cs&e',
      'computer science',
      'computer science and engineering',
      'computer science engineering',
      'cse department',
      'cs department',
      'cse block',
    ],
    googlePlaceId: 'ChIJ_T-qhjNIpTsRT0Cvgdt5RsY',
    accessibility: null,
    caution: null,
    verification: {
      kind: 'google_maps_and_official',
      label: 'Google Maps listing + official MCE programmes',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJ_T-qhjNIpTsRT0Cvgdt5RsY'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Program',
  },
  {
    id: 'central-library',
    name: 'Central Library',
    shortName: 'Library',
    category: 'library',
    coordinates: { lat: 13.0253022, lng: 76.1024183 },
    description:
      'The MCE central library, with reading rooms and the reference collection. The college page and Google Maps list different opening hours, so hours are deliberately not shown here — check before travelling.',
    aliases: [
      'library',
      'mce library',
      'central library',
      'study room',
      'reading room',
      'reference section',
      'lib',
    ],
    googlePlaceId: 'ChIJk0DyWjNIpTsRxivuqmfpO7k',
    accessibility: null,
    caution: 'Opening hours differ between the official page and Google Maps; confirm them before you go.',
    verification: {
      kind: 'google_maps_and_official',
      label: 'Google Maps listing + official MCE library page',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJk0DyWjNIpTsRxivuqmfpO7k'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Library',
  },
  {
    id: 'canteen',
    name: 'Canteen',
    shortName: 'Canteen',
    category: 'food',
    coordinates: { lat: 13.0227563, lng: 76.101794 },
    description:
      'The campus canteen inside the main gate. Google Maps marked this listing “temporarily closed” when it was checked in October 2026, so confirm it is open before relying on it.',
    aliases: [
      'canteen',
      'cafeteria',
      'food',
      'food court',
      'mess',
      'snacks',
      'lunch',
      'coffee',
      'mce canteen',
    ],
    googlePlaceId: 'ChIJ4d9_mTNIpTsRrTQNJl-tSHo',
    accessibility: null,
    caution: 'Google Maps listed the canteen as temporarily closed in October 2026.',
    verification: {
      kind: 'google_maps',
      label: 'Google Maps listing',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJ4d9_mTNIpTsRrTQNJl-tSHo'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/',
  },
  {
    id: 'boys-hostel',
    name: 'Boys Hostel',
    shortName: 'Boys hostel',
    category: 'hostel',
    coordinates: { lat: 13.0252767, lng: 76.1031367 },
    description:
      'The MCE boys hostel, made up of the Hoysala, Hemavathi and Hasanamba blocks described on the official hostel page. The girls hostel is outside the main campus and has no verified pin yet.',
    aliases: [
      'hostel',
      'boys hostel',
      'mce hostel',
      'hoysala',
      'hemavathi',
      'hasanamba',
      'accommodation',
      'dormitory',
      'warden',
    ],
    googlePlaceId: 'ChIJBSyuawBJpTsR5ZQFZ2NQg-U',
    accessibility: null,
    caution: null,
    verification: {
      kind: 'google_maps_and_official',
      label: 'Google Maps listing + official MCE hostel page',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJBSyuawBJpTsR5ZQFZ2NQg-U'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Hostel',
  },
  {
    id: 'play-ground',
    name: 'Play Ground',
    shortName: 'Play ground',
    category: 'sports',
    coordinates: { lat: 13.0236866, lng: 76.1045366 },
    description:
      'The campus play ground, used for cricket and football according to its Google Maps listing. Indoor sports facilities and the gym do not have verified positions yet, so they are not pinned.',
    aliases: [
      'playground',
      'play ground',
      'ground',
      'sports ground',
      'cricket',
      'football',
      'field',
      'sports',
      'mce ground',
    ],
    googlePlaceId: 'ChIJ1609HxVJpTsRmdtfBmVaauI',
    accessibility: null,
    caution: null,
    verification: {
      kind: 'google_maps',
      label: 'Google Maps listing',
      checkedOn: CHECKED_ON,
      url: googlePlaceUrl('ChIJ1609HxVJpTsRmdtfBmVaauI'),
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Sports',
  },
  {
    id: 'divya-chaitanya',
    name: 'Divya Chaitanya',
    shortName: 'Divya Chaitanya',
    category: 'landmark',
    coordinates: { lat: 13.0225152, lng: 76.105524 },
    description:
      'A yoga and meditation centre with temples, described on the official MCE Spiritual Enclave page. The position comes from the named OpenStreetMap feature inside the campus boundary.',
    aliases: [
      'divya chaitanya',
      'spiritual enclave',
      'temple',
      'temples',
      'yoga',
      'meditation',
      'prayer',
    ],
    googlePlaceId: null,
    accessibility: null,
    caution: null,
    verification: {
      kind: 'osm_and_official',
      label: 'OpenStreetMap feature + official MCE Spiritual Enclave page',
      checkedOn: CHECKED_ON,
      url: 'https://www.openstreetmap.org/way/395086499',
    },
    officialUrl: 'https://www.mcehassan.ac.in/home/Spiritual-Enclave',
  },
];

export const LOCATION_BY_ID = new Map(LOCATIONS.map((location) => [location.id, location]));

export const CAMPUS = {
  name: 'Malnad College of Engineering',
  shortName: 'MCE',
  address: 'No. 21, Salagame Road, Rangoli Halla, Hassan, Karnataka 573202',
  center: { lat: 13.02395, lng: 76.1032 },
  zoom: 16.6,
  googleMapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJ_T-qhjNIpTsRphwqrf-I_R8',
  googleMapsQueryUrl:
    'https://www.google.com/maps/search/?api=1&query=Malnad+College+of+Engineering,+Salagame+Road,+Hassan',
  officialUrl: 'https://www.mcehassan.ac.in/',
  contactUrl: 'https://www.mcehassan.ac.in/home/contactss',
  /** Campus outline from OpenStreetMap way 288781302 (ODbL). */
  boundary: [
    { lat: 13.0244035, lng: 76.1014898 },
    { lat: 13.0229007, lng: 76.1009162 },
    { lat: 13.0223479, lng: 76.1027326 },
    { lat: 13.0222184, lng: 76.1033087 },
    { lat: 13.0216334, lng: 76.1053837 },
    { lat: 13.0234401, lng: 76.1061661 },
    { lat: 13.0241884, lng: 76.1061543 },
    { lat: 13.0242254, lng: 76.1058293 },
    { lat: 13.0244088, lng: 76.1057992 },
    { lat: 13.0246326, lng: 76.1057852 },
    { lat: 13.0249167, lng: 76.1056988 },
    { lat: 13.0250977, lng: 76.1056437 },
    { lat: 13.0256661, lng: 76.1042647 },
    { lat: 13.025517, lng: 76.1035913 },
    { lat: 13.0255159, lng: 76.1031508 },
    { lat: 13.0255886, lng: 76.1018071 },
    { lat: 13.0250175, lng: 76.1017157 },
    { lat: 13.0244035, lng: 76.1014898 },
  ],
  boundarySource: 'https://www.openstreetmap.org/way/288781302',
} as const;

export const EMERGENCY_CONTACTS = [
  { label: 'Dean – Student Affairs', phone: '9449689093' },
  { label: 'Principal', phone: '9141305844' },
  { label: 'Warden – Boys Hostel', phone: '9141305847' },
  { label: 'Warden – Girls Hostel', phone: '9480885317' },
] as const;

export const PLACES_CHECKED_ON = '23 November 2026';
