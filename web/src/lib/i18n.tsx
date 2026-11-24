import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

/**
 * English / Kannada interface strings.
 *
 * Only the interface is translated here. Verified campus data (place names,
 * descriptions, sources) stays in the language it was checked in, so nothing
 * gets silently re-worded by translation.
 */

export type Language = 'en' | 'kn';

export const LANGUAGES: Array<{ id: Language; label: string; short: string }> = [
  { id: 'en', label: 'English', short: 'EN' },
  { id: 'kn', label: 'ಕನ್ನಡ', short: 'ಕ' },
];

const en = {
  'common.close': 'Close',
  'common.cancel': 'Cancel',
  'common.retry': 'Try again',
  'common.loading': 'Loading…',
  'common.show': 'Show',
  'common.hide': 'Hide',

  'nav.label': 'Campus navigator sections',
  'nav.explore': 'Explore',
  'nav.assistant': 'Assistant',
  'nav.scan': 'Scan QR',
  'nav.sos': 'SOS',
  'nav.more': 'More',

  'header.home': 'MCE Smart Campus Navigator home',
  'header.title': 'Malnad College of Engineering',
  'header.subtitle': 'Campus Navigator · Hassan',
  'header.assistant': 'Campus guide',
  'header.scan': 'Scan QR',
  'header.contrast': 'Toggle high contrast mode',
  'header.language': 'Change language',

  'search.label': 'Search campus places',
  'search.placeholder': 'Search library, CSE, food, main gate…',
  'search.mobilePlaceholder': 'Search a campus place…',
  'search.clear': 'Clear search',
  'search.searching': 'Searching…',
  'search.resultOne': '1 matching place',
  'search.resultMany': '{count} matching places',
  'search.noMatchTitle': 'No verified place matches “{query}”.',
  'search.noMatchBody':
    'Only places with a verified name and position are listed. Unmapped facilities are not guessed.',
  'search.openGoogle': 'Open MCE area in Google Maps',
  'search.suggestion': 'Try “library”, “canteen” or “main gate”.',

  'cat.all': 'All places',
  'cat.entrance': 'Entrance',
  'cat.academic': 'Academic',
  'cat.library': 'Library',
  'cat.food': 'Food',
  'cat.hostel': 'Hostel',
  'cat.sports': 'Sports',
  'cat.landmark': 'Landmark',
  'cat.filterLabel': 'Filter campus places by category',

  'results.searchTitle': 'Search results',
  'results.exploreTitle': 'Explore campus',
  'results.count': '{shown} of {total}',
  'results.emptyTitle': 'No verified place matches {query}.',
  'results.emptyBody':
    'Unmapped facilities are not guessed. Try another name, or check Google Maps for the wider area.',
  'results.footerChecked': 'Positions checked {date}. Unverified facilities are left off the map.',
  'results.official': 'Official MCE site',
  'results.boundary': 'Boundary © OpenStreetMap',
  'results.mapCaption': 'Map data checked {date}',

  'location.alsoCalled': 'Also called',
  'location.position': 'Position',
  'location.verified': 'Verified',
  'location.official': 'Official',
  'location.directions': 'Directions',
  'location.campusRoute': 'Campus route',
  'location.googleMaps': 'Google Maps',
  'location.close': 'Close place details',
  'location.facilityTitle': 'Facility status',
  'location.facilityUpdated': 'Last updated {date}',
  'location.facilityNotLive':
    'Saved snapshot, not live data. Confirm before travelling.',
  'location.facilityStale':
    'This snapshot is over {days} days old and may be out of date.',
  'location.hoursNotPublished': 'Opening hours are not published.',
  'location.status.open': 'Open',
  'location.status.temporarily-closed': 'Temporarily closed',
  'location.status.unconfirmed': 'Status unconfirmed',
  'location.accessibilityTitle': 'Accessibility',
  'location.accessibilityNone': 'No accessibility features have been recorded for this place yet.',
  'location.accessibilityUnsurveyed':
    'The campus accessibility survey has not been published, so no step-free claim is made.',
  'location.accessibilityViewAll': 'Open accessibility details',

  'route.title': 'Walking routes',
  'route.description': 'Choose a start and destination inside campus.',
  'route.from': 'Starting point',
  'route.to': 'Destination',
  'route.stepFree': 'Step-free route',
  'route.stepFreeHelp': 'Avoids stairs, and only uses paths whose step-free access is confirmed.',
  'route.calculate': 'Show route',
  'route.distance': 'Distance',
  'route.walkingTime': 'Walking time',
  'route.minutes': '{count} min',
  'route.metres': 'm',
  'route.km': 'km',
  'route.provisional': 'Indicative — not surveyed',
  'route.provisionalNote':
    'This distance is measured along the recorded network, which has not been surveyed. Paths may follow roads or go around buildings.',
  'route.surveyedNote': 'Every segment of this route has been surveyed.',
  'route.stepsTitle': 'Route steps',
  'route.start': 'Start at {place}',
  'route.arrive': 'Arrive at {place}',
  'route.walk': 'Walk {distance} {direction} toward {place}',
  'route.noPath':
    'No walking route is recorded between these two places. Ask the college office for a route, or open Google Maps.',
  'route.noStepFree':
    'A step-free route cannot be confirmed: no path between these places is recorded as step-free. Take the ordinary estimate, or ask the office which entrance to use.',
  'route.showOrdinary': 'Show ordinary estimate',
  'route.samePlace': 'Choose two different places.',
  'route.speak': 'Read route aloud',
  'route.stop': 'Stop reading',
  'route.speechUnsupported': 'This browser does not support speech. The written steps stay available.',
  'route.noVoice': 'No Kannada voice is installed on this device, so the route was read in English.',
  'route.myLocation': 'My location',
  'route.snapped': 'Your location was snapped to the nearest recorded path, {distance} away.',
  'route.openGoogle': 'Open in Google Maps',
  'route.swap': 'Swap start and destination',
  'route.stepFreeShort': 'Step-free',
  'route.mapLabel': 'Walking route from {from} to {to}',

  'classroom.title': 'Classroom finder',
  'classroom.description': 'Search by department, course, building or room number.',
  'classroom.queryLabel': 'Search rooms and courses',
  'classroom.queryPlaceholder': 'Room, course code or name…',
  'classroom.department': 'Department',
  'classroom.course': 'Course',
  'classroom.building': 'Building',
  'classroom.all': 'All',
  'classroom.emptyTitle': 'No classroom data has been published yet.',
  'classroom.emptyBody':
    'Room numbers and course-to-room timetables are confirmed by each department. Until that list is supplied, this finder stays empty instead of guessing.',
  'classroom.emptyAddHint':
    'Maintainers: add rooms to src/data/classrooms.ts with a source link for each.',
  'classroom.results': '{count} rooms',
  'classroom.floor': 'Floor',
  'classroom.courses': 'Courses',
  'classroom.capacity': 'Capacity',
  'classroom.unverified': 'Unverified entry',
  'classroom.directions': 'Directions',
  'classroom.noMatchTitle': 'No room matches these filters.',
  'classroom.noMatchBody': 'Clear a filter or search for a room number instead.',
  'classroom.checked': 'Last checked {date}',

  'events.title': 'Campus events',
  'events.description': 'Upcoming events and their venues.',
  'events.upcoming': 'Upcoming',
  'events.past': 'Past events',
  'events.emptyTitle': 'No events are published yet.',
  'events.emptyBody':
    'Events appear here once an official MCE notice or department circular is added to the event list.',
  'events.emptyAddHint':
    'Maintainers: add events to src/data/events.ts with the notice link.',
  'events.expired': 'Finished',
  'events.venue': 'Venue',
  'events.directions': 'Get directions',
  'events.openVenue': 'Show venue on map',
  'events.verified': 'Source',
  'events.noUpcoming': 'Nothing is scheduled at the moment.',

  'a11y.title': 'Accessibility',
  'a11y.description':
    'Entrances, ramps, lifts and washrooms recorded on campus. Used by the step-free route option.',
  'a11y.filterLabel': 'Filter accessibility features',
  'a11y.all': 'All features',
  'a11y.showOnMap': 'Show features on map',
  'a11y.hideFromMap': 'Hide features from map',
  'a11y.emptyTitle': 'No accessibility features have been surveyed yet.',
  'a11y.emptyBody':
    'An accessibility survey has not been supplied, so the map does not show ramps, lifts or accessible washrooms, and step-free routes cannot be confirmed.',
  'a11y.emptyAddHint':
    'Maintainers: add surveyed features to src/data/accessibility.ts, then mark matching route segments as step-free confirmed.',
  'a11y.notSurveyed': 'Not surveyed',
  'a11y.openPlace': 'Show place',
  'a11y.surveyedOn': 'Surveyed {date}',
  'a11y.noneInFilter': 'No recorded feature in this category.',

  'more.title': 'Campus tools',
  'more.description': 'Routes, classrooms, events and accessibility.',
  'more.routes': 'Walking routes',
  'more.classrooms': 'Classroom finder',
  'more.events': 'Events',
  'more.accessibility': 'Accessibility',
  'more.language': 'Language',
  'more.languageHint': 'Interface language',
  'more.contrast': 'High contrast',

  'offline.banner': 'You are offline. Campus places and saved details still work.',
  'offline.reconnected': 'Back online.',
  'offline.mapNote':
    'Map tiles need a connection, so the map is unavailable offline. Campus information, routes and saved details still work.',
  'offline.tilesUnavailable': 'Map tiles unavailable offline',
  'offline.installHint': 'Install this app for offline campus information.',

  'compass.n': 'north',
  'compass.ne': 'north-east',
  'compass.e': 'east',
  'compass.se': 'south-east',
  'compass.s': 'south',
  'compass.sw': 'south-west',
  'compass.w': 'west',
  'compass.nw': 'north-west',

  'dir.title': 'Directions to {place}',
  'dir.description':
    'Google Maps provides the walking route. Indoor turn-by-turn guidance is not available.',
  'dir.start': 'Starting point',
  'dir.myLocation': 'My current location',
  'dir.myLocationHelp': 'Used only after you allow it. Your position is not stored.',
  'dir.allowLocation': 'Allow my location',
  'dir.updateLocation': 'Update my location',
  'dir.ready': 'Location ready (±{distance}).',
  'dir.place': 'A campus place',
  'dir.placeHelp': 'Useful if you are arriving at the gate.',
  'dir.choosePlace': 'Choose a starting campus place',
  'dir.googleDecides': 'Let Google Maps decide',
  'dir.googleDecidesHelp': 'Google Maps may ask for your location when it opens.',
  'dir.note':
    'Verified positions are shown as pins. There is no verified indoor route, so this opens Google Maps rather than inventing corridor-level steps.',
  'dir.open': 'Open walking directions in Google Maps',
  'dir.campusRoute': 'Use the campus walking route',
  'dir.askLocation': 'Google Maps will ask for your location when it opens.',
  'dir.denied':
    'Location permission was denied. Choose the main gate as your start, or let Google Maps ask for your location.',
  'dir.unavailable': 'Your location could not be read. Choose a campus start point instead.',
  'dir.noBrowser':
    'This browser does not provide location. Choose a campus start point instead.',
} as const;

export type TranslationKey = keyof typeof en;

const kn: Record<TranslationKey, string> = {
  'common.close': 'ಮುಚ್ಚಿ',
  'common.cancel': 'ರದ್ದುಮಾಡಿ',
  'common.retry': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ',
  'common.loading': 'ಲೋಡ್ ಆಗುತ್ತಿದೆ…',
  'common.show': 'ತೋರಿಸಿ',
  'common.hide': 'ಮರೆಮಾಡಿ',

  'nav.label': 'ಕ್ಯಾಂಪಸ್ ನ್ಯಾವಿಗೇಟರ್ ವಿಭಾಗಗಳು',
  'nav.explore': 'ಅನ್ವೇಷಿಸಿ',
  'nav.assistant': 'ಸಹಾಯಕ',
  'nav.scan': 'QR ಸ್ಕ್ಯಾನ್',
  'nav.sos': 'SOS',
  'nav.more': 'ಇನ್ನಷ್ಟು',

  'header.home': 'MCE ಸ್ಮಾರ್ಟ್ ಕ್ಯಾಂಪಸ್ ನ್ಯಾವಿಗೇಟರ್ ಮುಖಪುಟ',
  'header.title': 'ಮಲ್ನಾಡ್ ಎಂಜಿನಿಯರಿಂಗ್ ಕಾಲೇಜು',
  'header.subtitle': 'ಕ್ಯಾಂಪಸ್ ನ್ಯಾವಿಗೇಟರ್ · ಹಾಸನ',
  'header.assistant': 'ಕ್ಯಾಂಪಸ್ ಮಾರ್ಗದರ್ಶಿ',
  'header.scan': 'QR ಸ್ಕ್ಯಾನ್',
  'header.contrast': 'ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್ ಬದಲಿಸಿ',
  'header.language': 'ಭಾಷೆ ಬದಲಿಸಿ',

  'search.label': 'ಕ್ಯಾಂಪಸ್ ಸ್ಥಳಗಳನ್ನು ಹುಡುಕಿ',
  'search.placeholder': 'ಗ್ರಂಥಾಲಯ, CSE, ಊಟ, ಮುಖ್ಯ ದ್ವಾರ ಹುಡುಕಿ…',
  'search.mobilePlaceholder': 'ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ ಹುಡುಕಿ…',
  'search.clear': 'ಹುಡುಕಾಟ ತೆರವುಗೊಳಿಸಿ',
  'search.searching': 'ಹುಡುಕುತ್ತಿದೆ…',
  'search.resultOne': '1 ಸ್ಥಳ ಸಿಕ್ಕಿದೆ',
  'search.resultMany': '{count} ಸ್ಥಳಗಳು ಸಿಕ್ಕಿವೆ',
  'search.noMatchTitle': '“{query}” ಗೆ ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳ ಯಾವುದೂ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
  'search.noMatchBody':
    'ಹೆಸರು ಮತ್ತು ಸ್ಥಾನ ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳಗಳನ್ನು ಮಾತ್ರ ಪಟ್ಟಿ ಮಾಡಲಾಗಿದೆ. ನಕ್ಷೆಯಲ್ಲಿಲ್ಲದ ಸೌಲಭ್ಯಗಳನ್ನು ಊಹಿಸುವುದಿಲ್ಲ.',
  'search.openGoogle': 'Google Maps ನಲ್ಲಿ MCE ಪ್ರದೇಶ ತೆರೆಯಿರಿ',
  'search.suggestion': '“ಗ್ರಂಥಾಲಯ”, “ಕ್ಯಾಂಟೀನ್” ಅಥವಾ “ಮುಖ್ಯ ದ್ವಾರ” ಪ್ರಯತ್ನಿಸಿ.',

  'cat.all': 'ಎಲ್ಲಾ ಸ್ಥಳಗಳು',
  'cat.entrance': 'ಪ್ರವೇಶದ್ವಾರ',
  'cat.academic': 'ಶೈಕ್ಷಣಿಕ',
  'cat.library': 'ಗ್ರಂಥಾಲಯ',
  'cat.food': 'ಆಹಾರ',
  'cat.hostel': 'ವಸತಿ ನಿಲಯ',
  'cat.sports': 'ಕ್ರೀಡೆ',
  'cat.landmark': 'ಹೆಗ್ಗುರುತು',
  'cat.filterLabel': 'ವರ್ಗದ ಪ್ರಕಾರ ಸ್ಥಳಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ',

  'results.searchTitle': 'ಹುಡುಕಾಟ ಫಲಿತಾಂಶಗಳು',
  'results.exploreTitle': 'ಕ್ಯಾಂಪಸ್ ಅನ್ವೇಷಿಸಿ',
  'results.count': '{total} ರಲ್ಲಿ {shown}',
  'results.emptyTitle': '{query} ಗೆ ಪರಿಶೀಲಿಸಿದ ಸ್ಥಳ ಯಾವುದೂ ಇಲ್ಲ.',
  'results.emptyBody':
    'ನಕ್ಷೆಯಲ್ಲಿಲ್ಲದ ಸೌಲಭ್ಯಗಳನ್ನು ಊಹಿಸುವುದಿಲ್ಲ. ಬೇರೆ ಹೆಸರು ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ Google Maps ನಲ್ಲಿ ನೋಡಿ.',
  'results.footerChecked': 'ಸ್ಥಾನಗಳನ್ನು {date} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ಪರಿಶೀಲಿಸದ ಸೌಲಭ್ಯಗಳನ್ನು ನಕ್ಷೆಯಿಂದ ಹೊರಗಿಡಲಾಗಿದೆ.',
  'results.official': 'ಅಧಿಕೃತ MCE ತಾಣ',
  'results.boundary': 'ಗಡಿ © OpenStreetMap',
  'results.mapCaption': 'ನಕ್ಷೆ ಮಾಹಿತಿ {date} ರಂದು ಪರಿಶೀಲಿಸಲಾಗಿದೆ',

  'location.alsoCalled': 'ಬೇರೆ ಹೆಸರು',
  'location.position': 'ಸ್ಥಾನ',
  'location.verified': 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
  'location.official': 'ಅಧಿಕೃತ',
  'location.directions': 'ದಾರಿ ಸೂಚನೆ',
  'location.campusRoute': 'ಕ್ಯಾಂಪಸ್ ಮಾರ್ಗ',
  'location.googleMaps': 'Google Maps',
  'location.close': 'ಸ್ಥಳ ವಿವರಗಳನ್ನು ಮುಚ್ಚಿ',
  'location.facilityTitle': 'ಸೌಲಭ್ಯದ ಸ್ಥಿತಿ',
  'location.facilityUpdated': 'ಕೊನೆಯ ನವೀಕರಣ {date}',
  'location.facilityNotLive': 'ಉಳಿಸಿದ ಮಾಹಿತಿ, ನೇರ ಮಾಹಿತಿ ಅಲ್ಲ. ಹೊರಡುವ ಮೊದಲು ಖಚಿತಪಡಿಸಿ.',
  'location.facilityStale': 'ಈ ಮಾಹಿತಿಯು {days} ದಿನಗಳಿಗಿಂತ ಹಳೆಯದು, ಬದಲಾಗಿರಬಹುದು.',
  'location.hoursNotPublished': 'ತೆರೆಯುವ ಸಮಯ ಪ್ರಕಟವಾಗಿಲ್ಲ.',
  'location.status.open': 'ತೆರೆದಿದೆ',
  'location.status.temporarily-closed': 'ತಾತ್ಕಾಲಿಕವಾಗಿ ಮುಚ್ಚಲಾಗಿದೆ',
  'location.status.unconfirmed': 'ಸ್ಥಿತಿ ಖಚಿತವಲ್ಲ',
  'location.accessibilityTitle': 'ಪ್ರವೇಶಿಸುವಿಕೆ',
  'location.accessibilityNone': 'ಈ ಸ್ಥಳಕ್ಕೆ ಇನ್ನೂ ಪ್ರವೇಶಿಸುವಿಕೆ ವಿವರ ದಾಖಲಾಗಿಲ್ಲ.',
  'location.accessibilityUnsurveyed':
    'ಕ್ಯಾಂಪಸ್ ಪ್ರವೇಶಿಸುವಿಕೆ ಸಮೀಕ್ಷೆ ಪ್ರಕಟವಾಗಿಲ್ಲ, ಆದ್ದರಿಂದ ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದ ಮಾರ್ಗದ ಬಗ್ಗೆ ಯಾವುದೇ ಹೇಳಿಕೆ ನೀಡಲಾಗಿಲ್ಲ.',
  'location.accessibilityViewAll': 'ಪ್ರವೇಶಿಸುವಿಕೆ ವಿವರ ತೆರೆಯಿರಿ',

  'route.title': 'ನಡಿಗೆ ಮಾರ್ಗಗಳು',
  'route.description': 'ಕ್ಯಾಂಪಸ್ ಒಳಗೆ ಪ್ರಾರಂಭ ಮತ್ತು ಗಮ್ಯಸ್ಥಾನ ಆಯ್ಕೆಮಾಡಿ.',
  'route.from': 'ಪ್ರಾರಂಭದ ಸ್ಥಳ',
  'route.to': 'ಗಮ್ಯಸ್ಥಾನ',
  'route.stepFree': 'ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದ ಮಾರ್ಗ',
  'route.stepFreeHelp': 'ಮೆಟ್ಟಿಲುಗಳನ್ನು ತಪ್ಪಿಸುತ್ತದೆ ಮತ್ತು ಖಚಿತಪಡಿಸಿದ ಮಾರ್ಗಗಳನ್ನು ಮಾತ್ರ ಬಳಸುತ್ತದೆ.',
  'route.calculate': 'ಮಾರ್ಗ ತೋರಿಸಿ',
  'route.distance': 'ದೂರ',
  'route.walkingTime': 'ನಡಿಗೆ ಸಮಯ',
  'route.minutes': '{count} ನಿಮಿಷ',
  'route.metres': 'ಮೀ',
  'route.km': 'ಕಿ.ಮೀ',
  'route.provisional': 'ಸೂಚಕ ಅಂದಾಜು — ಸಮೀಕ್ಷೆ ಆಗಿಲ್ಲ',
  'route.provisionalNote':
    'ಈ ದೂರವು ದಾಖಲಾದ ಜಾಲದ ಉದ್ದಕ್ಕೂ ಅಳೆಯಲಾಗಿದೆ; ಆ ಜಾಲದ ಸಮೀಕ್ಷೆ ಆಗಿಲ್ಲ. ಮಾರ್ಗಗಳು ರಸ್ತೆಗಳ ಮೂಲಕ ಅಥವಾ ಕಟ್ಟಡಗಳ ಸುತ್ತ ಹೋಗಬಹುದು.',
  'route.surveyedNote': 'ಈ ಮಾರ್ಗದ ಪ್ರತಿಯೊಂದು ಭಾಗವೂ ಸಮೀಕ್ಷೆ ಆಗಿದೆ.',
  'route.stepsTitle': 'ಮಾರ್ಗದ ಹಂತಗಳು',
  'route.start': '{place} ನಲ್ಲಿ ಪ್ರಾರಂಭಿಸಿ',
  'route.arrive': '{place} ತಲುಪಿ',
  'route.walk': '{place} ಕಡೆಗೆ {direction} ದಿಕ್ಕಿನಲ್ಲಿ {distance} ನಡೆಯಿರಿ',
  'route.noPath':
    'ಈ ಎರಡು ಸ್ಥಳಗಳ ನಡುವೆ ನಡಿಗೆ ಮಾರ್ಗ ದಾಖಲಾಗಿಲ್ಲ. ಕಾಲೇಜು ಕಚೇರಿಯನ್ನು ಕೇಳಿ ಅಥವಾ Google Maps ತೆರೆಯಿರಿ.',
  'route.noStepFree':
    'ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದ ಮಾರ್ಗವನ್ನು ಖಚಿತಪಡಿಸಲಾಗುವುದಿಲ್ಲ: ಈ ಸ್ಥಳಗಳ ನಡುವೆ ಯಾವುದೇ ಮಾರ್ಗವೂ ಮೆಟ್ಟಿಲುಗಳಿಲ್ಲದ್ದು ಎಂದು ದಾಖಲಾಗಿಲ್ಲ. ಸಾಮಾನ್ಯ ಅಂದಾಜು ನೋಡಿ ಅಥವಾ ಯಾವ ಪ್ರವೇಶದ್ವಾರ ಬಳಸಬೇಕೆಂದು ಕಚೇರಿಯನ್ನು ಕೇಳಿ.',
  'route.showOrdinary': 'ಸಾಮಾನ್ಯ ಅಂದಾಜು ತೋರಿಸಿ',
  'route.samePlace': 'ಬೇರೆ ಬೇರೆ ಎರಡು ಸ್ಥಳಗಳನ್ನು ಆಯ್ಕೆಮಾಡಿ.',
  'route.speak': 'ಮಾರ್ಗವನ್ನು ಓದಿ',
  'route.stop': 'ಓದುವುದನ್ನು ನಿಲ್ಲಿಸಿ',
  'route.speechUnsupported': 'ಈ ಬ್ರೌಸರ್ ಮಾತು ಬೆಂಬಲಿಸುವುದಿಲ್ಲ. ಬರೆದ ಹಂತಗಳು ಲಭ್ಯವಿವೆ.',
  'route.noVoice': 'ಈ ಸಾಧನದಲ್ಲಿ ಕನ್ನಡ ಧ್ವನಿ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಮಾರ್ಗವನ್ನು ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ಓದಲಾಗಿದೆ.',
  'route.myLocation': 'ನನ್ನ ಸ್ಥಳ',
  'route.snapped': 'ನಿಮ್ಮ ಸ್ಥಳವನ್ನು ಹತ್ತಿರದ ದಾಖಲಾದ ಮಾರ್ಗಕ್ಕೆ ಸೇರಿಸಲಾಗಿದೆ, {distance} ದೂರ.',
  'route.openGoogle': 'Google Maps ನಲ್ಲಿ ತೆರೆಯಿರಿ',
  'route.swap': 'ಪ್ರಾರಂಭ ಮತ್ತು ಗಮ್ಯಸ್ಥಾನ ಬದಲಿಸಿ',
  'route.stepFreeShort': 'ಮೆಟ್ಟಿಲಿಲ್ಲದ',
  'route.mapLabel': '{from} ರಿಂದ {to} ವರೆಗೆ ನಡಿಗೆ ಮಾರ್ಗ',

  'classroom.title': 'ತರಗತಿ ಕೊಠಡಿ ಹುಡುಕಾಟ',
  'classroom.description': 'ವಿಭಾಗ, ಕೋರ್ಸ್, ಕಟ್ಟಡ ಅಥವಾ ಕೊಠಡಿ ಸಂಖ್ಯೆಯಿಂದ ಹುಡುಕಿ.',
  'classroom.queryLabel': 'ಕೊಠಡಿ ಮತ್ತು ಕೋರ್ಸ್ ಹುಡುಕಿ',
  'classroom.queryPlaceholder': 'ಕೊಠಡಿ, ಕೋರ್ಸ್ ಕೋಡ್ ಅಥವಾ ಹೆಸರು…',
  'classroom.department': 'ವಿಭಾಗ',
  'classroom.course': 'ಕೋರ್ಸ್',
  'classroom.building': 'ಕಟ್ಟಡ',
  'classroom.all': 'ಎಲ್ಲಾ',
  'classroom.emptyTitle': 'ತರಗತಿ ಕೊಠಡಿ ಮಾಹಿತಿ ಇನ್ನೂ ಪ್ರಕಟವಾಗಿಲ್ಲ.',
  'classroom.emptyBody':
    'ಕೊಠಡಿ ಸಂಖ್ಯೆಗಳು ಮತ್ತು ಕೋರ್ಸ್ ವೇಳಾಪಟ್ಟಿ ಪ್ರತಿ ವಿಭಾಗದಿಂದ ಖಚಿತಪಡಿಸಬೇಕು. ಆ ಪಟ್ಟಿ ಸಿಗುವವರೆಗೆ ಈ ಹುಡುಕಾಟ ಖಾಲಿಯಾಗಿರುತ್ತದೆ, ಊಹಿಸುವುದಿಲ್ಲ.',
  'classroom.emptyAddHint':
    'ನಿರ್ವಾಹಕರಿಗೆ: ಪ್ರತಿ ಕೊಠಡಿಯನ್ನೂ ಮೂಲ ಕೊಂಡಿಯೊಂದಿಗೆ src/data/classrooms.ts ಗೆ ಸೇರಿಸಿ.',
  'classroom.results': '{count} ಕೊಠಡಿಗಳು',
  'classroom.floor': 'ಮಹಡಿ',
  'classroom.courses': 'ಕೋರ್ಸ್‌ಗಳು',
  'classroom.capacity': 'ಸಾಮರ್ಥ್ಯ',
  'classroom.unverified': 'ಪರಿಶೀಲಿಸದ ನಮೂದು',
  'classroom.directions': 'ದಾರಿ ಸೂಚನೆ',
  'classroom.noMatchTitle': 'ಈ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಕೊಠಡಿ ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ.',
  'classroom.noMatchBody': 'ಒಂದು ಫಿಲ್ಟರ್ ತೆಗೆಯಿರಿ ಅಥವಾ ಕೊಠಡಿ ಸಂಖ್ಯೆ ಹುಡುಕಿ.',
  'classroom.checked': 'ಕೊನೆಯ ಪರಿಶೀಲನೆ {date}',

  'events.title': 'ಕ್ಯಾಂಪಸ್ ಕಾರ್ಯಕ್ರಮಗಳು',
  'events.description': 'ಮುಂಬರುವ ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಅವುಗಳ ಸ್ಥಳ.',
  'events.upcoming': 'ಮುಂಬರುವ',
  'events.past': 'ನಡೆದ ಕಾರ್ಯಕ್ರಮಗಳು',
  'events.emptyTitle': 'ಇನ್ನೂ ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮ ಪ್ರಕಟವಾಗಿಲ್ಲ.',
  'events.emptyBody':
    'ಅಧಿಕೃತ MCE ಸೂಚನೆ ಅಥವಾ ವಿಭಾಗದ ಪ್ರಕಟಣೆ ಸೇರಿಸಿದ ನಂತರ ಕಾರ್ಯಕ್ರಮಗಳು ಇಲ್ಲಿ ಕಾಣಿಸುತ್ತವೆ.',
  'events.emptyAddHint':
    'ನಿರ್ವಾಹಕರಿಗೆ: ಸೂಚನೆಯ ಕೊಂಡಿಯೊಂದಿಗೆ src/data/events.ts ಗೆ ಕಾರ್ಯಕ್ರಮ ಸೇರಿಸಿ.',
  'events.expired': 'ಮುಗಿದಿದೆ',
  'events.venue': 'ಸ್ಥಳ',
  'events.directions': 'ದಾರಿ ಸೂಚನೆ ಪಡೆಯಿರಿ',
  'events.openVenue': 'ಸ್ಥಳವನ್ನು ನಕ್ಷೆಯಲ್ಲಿ ತೋರಿಸಿ',
  'events.verified': 'ಮೂಲ',
  'events.noUpcoming': 'ಸದ್ಯಕ್ಕೆ ಯಾವುದೇ ಕಾರ್ಯಕ್ರಮವಿಲ್ಲ.',

  'a11y.title': 'ಪ್ರವೇಶಿಸುವಿಕೆ',
  'a11y.description':
    'ಕ್ಯಾಂಪಸ್‌ನಲ್ಲಿ ದಾಖಲಾದ ಪ್ರವೇಶದ್ವಾರ, ರ್ಯಾಂಪ್, ಲಿಫ್ಟ್ ಮತ್ತು ಶೌಚಾಲಯ. ಮೆಟ್ಟಿಲಿಲ್ಲದ ಮಾರ್ಗ ಆಯ್ಕೆ ಇದನ್ನು ಬಳಸುತ್ತದೆ.',
  'a11y.filterLabel': 'ಪ್ರವೇಶಿಸುವಿಕೆ ವಿವರಗಳನ್ನು ಫಿಲ್ಟರ್ ಮಾಡಿ',
  'a11y.all': 'ಎಲ್ಲಾ ವಿವರಗಳು',
  'a11y.showOnMap': 'ನಕ್ಷೆಯಲ್ಲಿ ತೋರಿಸಿ',
  'a11y.hideFromMap': 'ನಕ್ಷೆಯಿಂದ ಮರೆಮಾಡಿ',
  'a11y.emptyTitle': 'ಇನ್ನೂ ಪ್ರವೇಶಿಸುವಿಕೆ ಸಮೀಕ್ಷೆ ನಡೆದಿಲ್ಲ.',
  'a11y.emptyBody':
    'ಪ್ರವೇಶಿಸುವಿಕೆ ಸಮೀಕ್ಷೆ ಸಿಗದ ಕಾರಣ ನಕ್ಷೆಯಲ್ಲಿ ರ್ಯಾಂಪ್, ಲಿಫ್ಟ್ ಅಥವಾ ಶೌಚಾಲಯ ತೋರಿಸಲಾಗಿಲ್ಲ ಮತ್ತು ಮೆಟ್ಟಿಲಿಲ್ಲದ ಮಾರ್ಗ ಖಚಿತಪಡಿಸಲಾಗುವುದಿಲ್ಲ.',
  'a11y.emptyAddHint':
    'ನಿರ್ವಾಹಕರಿಗೆ: ಸಮೀಕ್ಷಿಸಿದ ವಿವರಗಳನ್ನು src/data/accessibility.ts ಗೆ ಸೇರಿಸಿ, ನಂತರ ಸಂಬಂಧಿತ ಮಾರ್ಗ ಭಾಗಗಳನ್ನು ಮೆಟ್ಟಿಲಿಲ್ಲದ್ದು ಎಂದು ಗುರುತಿಸಿ.',
  'a11y.notSurveyed': 'ಸಮೀಕ್ಷೆ ಆಗಿಲ್ಲ',
  'a11y.openPlace': 'ಸ್ಥಳ ತೋರಿಸಿ',
  'a11y.surveyedOn': 'ಸಮೀಕ್ಷೆ {date}',
  'a11y.noneInFilter': 'ಈ ವರ್ಗದಲ್ಲಿ ದಾಖಲಾದ ವಿವರವಿಲ್ಲ.',

  'more.title': 'ಕ್ಯಾಂಪಸ್ ಸಾಧನಗಳು',
  'more.description': 'ಮಾರ್ಗಗಳು, ತರಗತಿ ಕೊಠಡಿಗಳು, ಕಾರ್ಯಕ್ರಮಗಳು ಮತ್ತು ಪ್ರವೇಶಿಸುವಿಕೆ.',
  'more.routes': 'ನಡಿಗೆ ಮಾರ್ಗಗಳು',
  'more.classrooms': 'ತರಗತಿ ಕೊಠಡಿ ಹುಡುಕಾಟ',
  'more.events': 'ಕಾರ್ಯಕ್ರಮಗಳು',
  'more.accessibility': 'ಪ್ರವೇಶಿಸುವಿಕೆ',
  'more.language': 'ಭಾಷೆ',
  'more.languageHint': 'ಇಂಟರ್ಫೇಸ್ ಭಾಷೆ',
  'more.contrast': 'ಹೆಚ್ಚಿನ ಕಾಂಟ್ರಾಸ್ಟ್',

  'offline.banner': 'ನೀವು ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿದ್ದೀರಿ. ಕ್ಯಾಂಪಸ್ ಸ್ಥಳಗಳು ಮತ್ತು ಉಳಿಸಿದ ವಿವರಗಳು ಇನ್ನೂ ಕೆಲಸ ಮಾಡುತ್ತವೆ.',
  'offline.reconnected': 'ಮತ್ತೆ ಆನ್‌ಲೈನ್.',
  'offline.mapNote':
    'ನಕ್ಷೆಯ ಚಿತ್ರಗಳಿಗೆ ಇಂಟರ್ನೆಟ್ ಬೇಕು, ಆದ್ದರಿಂದ ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ನಕ್ಷೆ ಲಭ್ಯವಿಲ್ಲ. ಕ್ಯಾಂಪಸ್ ಮಾಹಿತಿ, ಮಾರ್ಗಗಳು ಮತ್ತು ಉಳಿಸಿದ ವಿವರಗಳು ಇನ್ನೂ ಕೆಲಸ ಮಾಡುತ್ತವೆ.',
  'offline.tilesUnavailable': 'ಆಫ್‌ಲೈನ್‌ನಲ್ಲಿ ನಕ್ಷೆ ಚಿತ್ರಗಳು ಲಭ್ಯವಿಲ್ಲ',
  'offline.installHint': 'ಆಫ್‌ಲೈನ್ ಕ್ಯಾಂಪಸ್ ಮಾಹಿತಿಗಾಗಿ ಈ ಆ್ಯಪ್ ಸ್ಥಾಪಿಸಿ.',

  'compass.n': 'ಉತ್ತರ',
  'compass.ne': 'ಈಶಾನ್ಯ',
  'compass.e': 'ಪೂರ್ವ',
  'compass.se': 'ಆಗ್ನೇಯ',
  'compass.s': 'ದಕ್ಷಿಣ',
  'compass.sw': 'ನೈಋತ್ಯ',
  'compass.w': 'ಪಶ್ಚಿಮ',
  'compass.nw': 'ವಾಯುವ್ಯ',

  'dir.title': '{place} ಗೆ ದಾರಿ ಸೂಚನೆ',
  'dir.description':
    'ನಡಿಗೆ ಮಾರ್ಗವನ್ನು Google Maps ನೀಡುತ್ತದೆ. ಕಟ್ಟಡದೊಳಗಿನ ಹಂತ-ಹಂತದ ಮಾರ್ಗದರ್ಶನ ಲಭ್ಯವಿಲ್ಲ.',
  'dir.start': 'ಪ್ರಾರಂಭದ ಸ್ಥಳ',
  'dir.myLocation': 'ನನ್ನ ಪ್ರಸ್ತುತ ಸ್ಥಳ',
  'dir.myLocationHelp': 'ಅನುಮತಿ ನೀಡಿದ ನಂತರ ಮಾತ್ರ ಬಳಸಲಾಗುತ್ತದೆ. ನಿಮ್ಮ ಸ್ಥಳ ಉಳಿಸಲಾಗುವುದಿಲ್ಲ.',
  'dir.allowLocation': 'ನನ್ನ ಸ್ಥಳ ಅನುಮತಿಸಿ',
  'dir.updateLocation': 'ಸ್ಥಳ ನವೀಕರಿಸಿ',
  'dir.ready': 'ಸ್ಥಳ ಸಿದ್ಧ (±{distance}).',
  'dir.place': 'ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ',
  'dir.placeHelp': 'ನೀವು ದ್ವಾರದಲ್ಲಿ ಬರುತ್ತಿದ್ದರೆ ಉಪಯುಕ್ತ.',
  'dir.choosePlace': 'ಪ್ರಾರಂಭದ ಕ್ಯಾಂಪಸ್ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ',
  'dir.googleDecides': 'Google Maps ಗೆ ಬಿಡಿ',
  'dir.googleDecidesHelp': 'ತೆರೆದಾಗ Google Maps ನಿಮ್ಮ ಸ್ಥಳ ಕೇಳಬಹುದು.',
  'dir.note':
    'ಪರಿಶೀಲಿಸಿದ ಸ್ಥಾನಗಳನ್ನು ಪಿನ್ ಆಗಿ ತೋರಿಸಲಾಗಿದೆ. ಪರಿಶೀಲಿಸಿದ ಒಳಾಂಗಣ ಮಾರ್ಗ ಇಲ್ಲ, ಆದ್ದರಿಂದ ಕಾಲ್ಪನಿಕ ಹಂತಗಳನ್ನು ರಚಿಸುವ ಬದಲು Google Maps ತೆರೆಯುತ್ತದೆ.',
  'dir.open': 'Google Maps ನಲ್ಲಿ ನಡಿಗೆ ದಾರಿ ತೆರೆಯಿರಿ',
  'dir.campusRoute': 'ಕ್ಯಾಂಪಸ್ ನಡಿಗೆ ಮಾರ್ಗ ಬಳಸಿ',
  'dir.askLocation': 'ತೆರೆದಾಗ Google Maps ನಿಮ್ಮ ಸ್ಥಳ ಕೇಳುತ್ತದೆ.',
  'dir.denied':
    'ಸ್ಥಳ ಅನುಮತಿ ನಿರಾಕರಿಸಲಾಗಿದೆ. ಮುಖ್ಯ ದ್ವಾರವನ್ನು ಪ್ರಾರಂಭವಾಗಿ ಆಯ್ಕೆಮಾಡಿ ಅಥವಾ Google Maps ಗೆ ಬಿಡಿ.',
  'dir.unavailable': 'ನಿಮ್ಮ ಸ್ಥಳ ಓದಲಾಗಲಿಲ್ಲ. ಕ್ಯಾಂಪಸ್ ಪ್ರಾರಂಭ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.',
  'dir.noBrowser': 'ಈ ಬ್ರೌಸರ್ ಸ್ಥಳ ಒದಗಿಸುವುದಿಲ್ಲ. ಕ್ಯಾಂಪಸ್ ಪ್ರಾರಂಭ ಸ್ಥಳ ಆಯ್ಕೆಮಾಡಿ.',
};

const DICTIONARIES: Record<Language, Record<TranslationKey, string>> = { en, kn };

export type Translate = (key: TranslationKey, vars?: Record<string, string | number>) => string;

export function translate(
  language: Language,
  key: TranslationKey,
  vars?: Record<string, string | number>,
): string {
  const template = DICTIONARIES[language][key] ?? DICTIONARIES.en[key] ?? key;
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : match,
  );
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translate;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

const STORAGE_KEY = 'mce-campus-language';

function readLanguage(): Language {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored === 'kn' || stored === 'en') return stored;
  } catch {
    // Storage can be unavailable; fall back to the device language.
  }
  return typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('kn')
    ? 'kn'
    : 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(readLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore storage failures; the preference still applies for this visit.
    }
  }, [language]);

  const setLanguage = useCallback((next: Language) => setLanguageState(next), []);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useI18n must be used inside LanguageProvider');
  return context;
}

export const speechLocale = (language: Language): string => (language === 'kn' ? 'kn-IN' : 'en-IN');
