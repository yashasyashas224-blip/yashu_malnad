import {
  CATEGORY_BY_ID,
  EMERGENCY_CONTACTS,
  type CampusLocation,
} from '../data/locations';
import { searchLocations } from './search';

export interface AssistantAnswer {
  text: string;
  locations: CampusLocation[];
  source?: { label: string; url: string };
  suggestions?: string[];
}

const isDirections =
  /\b(directions?|route|navigate|navigation|way to|how (do|can) i (get|go|reach|walk)|take me|walk to|reach)\b/i;
const isHours = /\b(hours?|opening|open|close|closing|timing|timings|time)\b/i;
const isAccessibility =
  /\b(wheelchair|accessib\w*|ramp|lift|elevator|disabled|differently abled|barrier)\b/i;
const isEmergency =
  /\b(emergency|sos|ambulance|hospital|doctor|medical|health|sick|injur\w*|first aid)\b/i;
const isTransport = /\b(bus|transport|parking|park|vehicle|auto|rickshaw|shuttle)\b/i;
const isGreeting = /^(hi|hello|hey|namaskara|namaste|good (morning|afternoon|evening))\b/i;
const isAbout = /\b(who are you|what can you do|how do you work|are you (an )?ai|help)\b/i;
const isUnknownPolicy = /\b(fee|fees|admission|hostel fee|results?|exam timetable|syllabus|placement record)\b/i;

const OFFICIAL_DIRECTORY = {
  label: 'Official MCE website',
  url: 'https://www.mcehassan.ac.in/',
};

function joinedNames(locations: CampusLocation[]): string {
  if (locations.length === 0) return '';
  if (locations.length === 1) return locations[0]!.name;
  if (locations.length === 2) return `${locations[0]!.name} and ${locations[1]!.name}`;
  return `${locations
    .slice(0, -1)
    .map((location) => location.name)
    .join(', ')} and ${locations[locations.length - 1]!.name}`;
}

function categoryAnswer(
  locations: CampusLocation[],
  category: 'food' | 'hostel' | 'sports' | 'library',
): AssistantAnswer {
  const meta = CATEGORY_BY_ID[category];
  const matches = locations.filter((location) => location.category === category);
  if (matches.length === 0) {
    return {
      text: `I do not have a verified ${meta.label.toLowerCase()} location in the campus dataset yet. I will not guess a pin. The official MCE website may list it.`,
      locations: [],
      source: OFFICIAL_DIRECTORY,
      suggestions: ['Library', 'Main gate', 'Canteen'],
    };
  }

  const first = matches[0]!;
  return {
    text: `I have ${matches.length === 1 ? 'one verified place' : `${matches.length} verified places`} for ${meta.label.toLowerCase()}: ${joinedNames(
      matches,
    )}. I can show ${matches.length === 1 ? 'it' : 'them'} on the map and open walking directions in Google Maps.`,
    locations: matches,
    source: first.officialUrl
      ? { label: 'Official MCE information', url: first.officialUrl }
      : { label: 'Verified map listing', url: first.verification.url },
    suggestions: ['Show it on the map', 'Directions'],
  };
}

/**
 * Rule-based, retrieval-grounded answers. When the dataset does not contain an
 * answer, the assistant says so and points to an official source rather than
 * inventing directions, hours or facilities.
 */
export function answerCampusQuestion(
  question: string,
  locations: CampusLocation[],
): AssistantAnswer {
  const query = question.trim();
  if (!query) {
    return {
      text: 'Ask me where a verified campus place is, for example “Where is the library?” or “How do I get to the CS&E department?”',
      locations: [],
      suggestions: ['Where is the library?', 'How do I get to the main gate?', 'Where can I eat?'],
    };
  }

  if (isGreeting.test(query) && query.split(/\s+/).length <= 4) {
    return {
      text: 'Namaskara! I can help you find a verified place on the MCE campus. Ask about the library, main gate, canteen, CS&E department, boys hostel, play ground or Divya Chaitanya.',
      locations: [],
      suggestions: ['Where is the library?', 'How do I get to the CS&E department?', 'Where is the canteen?'],
    };
  }

  if (isAbout.test(query)) {
    return {
      text: 'I am the campus guide for MCE Hassan. My answers come from a small, verified dataset of campus places, each with a Google Maps or OpenStreetMap position and a source link. I do not generate new buildings, timings or policies, and I do not store this conversation.',
      locations: [],
      source: OFFICIAL_DIRECTORY,
      suggestions: ['Where is the main gate?', 'Where is the library?', 'Is there a canteen?'],
    };
  }

  if (isEmergency.test(query)) {
    const numbers = EMERGENCY_CONTACTS.map(
      (contact) => `${contact.label}: ${contact.phone}`,
    ).join(' · ');
    return {
      text: `For a medical or campus emergency, call the college directly. ${numbers}. I do not have a verified position for the health centre, so I will not pin one. For life-threatening emergencies in India, call 112.`,
      locations: [],
      source: {
        label: 'Official MCE contact page',
        url: 'https://www.mcehassan.ac.in/home/contactss',
      },
      suggestions: ['Where is the main gate?', 'Where is the library?'],
    };
  }

  if (isTransport.test(query)) {
    return {
      text: 'I do not have a verified pin for the campus bus stop, parking areas or the transport office yet, so I will not guess one. The main gate is the verified arrival point; the official Transport page has the college transport information.',
      locations: locations.filter((location) => location.id === 'main-gate'),
      source: {
        label: 'Official MCE Transport page',
        url: 'https://www.mcehassan.ac.in/home/Transport',
      },
      suggestions: ['Where is the main gate?', 'Where is the canteen?'],
    };
  }

  if (isUnknownPolicy.test(query)) {
    return {
      text: 'I only handle campus navigation and verified place information, so I cannot answer admission, fee, exam or results questions. Please use the official MCE website for those.',
      locations: [],
      source: OFFICIAL_DIRECTORY,
      suggestions: ['Where is the library?', 'Where is the main gate?'],
    };
  }

  const hits = searchLocations(locations, query, { limit: 3 });
  const match = hits[0]?.location ?? null;

  if (isHours.test(query)) {
    if (match) {
      return {
        text: `I cannot confirm opening hours for ${match.name}. The official MCE page and Google Maps do not always agree, so I will not state a time. Show the place on the map and check the linked source before you travel.`,
        locations: [match],
        source: { label: 'Official MCE information', url: match.officialUrl ?? match.verification.url },
      };
    }
    return {
      text: 'I do not have verified opening hours for campus places. Check the official MCE website or the Google Maps listing before travelling; I will not guess a time.',
      locations: [],
      source: OFFICIAL_DIRECTORY,
    };
  }

  if (isAccessibility.test(query)) {
    return {
      text: 'I do not have verified accessibility details for individual campus buildings, so I will not promise a ramp, lift or step-free route. The college’s Google Maps listing records a wheelchair-accessible entrance and car park at campus level. For a specific building, please confirm with the college office before travelling.',
      locations: match ? [match] : [],
      source: {
        label: 'Official MCE contact page',
        url: 'https://www.mcehassan.ac.in/home/contactss',
      },
    };
  }

  if (isDirections.test(query) && match) {
    return {
      text: `${match.name} is marked on the campus map. I can open walking directions in Google Maps from your location or from the main gate. I do not have a verified indoor route, so I will not invent step-by-step directions inside a building.`,
      locations: [match],
      source: { label: 'Verified source', url: match.verification.url },
      suggestions: ['Show it on the map', 'Open directions'],
    };
  }

  if (match) {
    return {
      text: `${match.name}: ${match.description}`,
      locations: [match],
      source: { label: match.verification.label, url: match.verification.url },
      suggestions: ['Show it on the map', 'Open directions'],
    };
  }

  if (/\b(food|eat|canteen|cafeteria|coffee|snack|lunch|mess)\b/i.test(query)) {
    return categoryAnswer(locations, 'food');
  }
  if (/\b(hostel|dorm|accommodation|warden)\b/i.test(query)) {
    return categoryAnswer(locations, 'hostel');
  }
  if (/\b(sports|playground|ground|cricket|football|field)\b/i.test(query)) {
    return categoryAnswer(locations, 'sports');
  }
  if (/\b(library|books|study|reading)\b/i.test(query)) {
    return categoryAnswer(locations, 'library');
  }

  return {
    text: 'I could not match that to a verified campus place, so I will not guess. I currently know these mapped places: main gate, main academic block, CS&E department, central library, canteen, boys hostel, play ground and Divya Chaitanya. Try one of those, or use campus search.',
    locations: [],
    source: OFFICIAL_DIRECTORY,
    suggestions: ['Where is the library?', 'Where is the main gate?', 'Where is the CS&E department?'],
  };
}
