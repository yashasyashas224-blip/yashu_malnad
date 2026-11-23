import type { CampusLocation } from '../data/locations';

export function googlePlaceUrl(placeId: string): string {
  return `https://www.google.com/maps/place/?q=place_id:${placeId}`;
}

export interface DirectionsOrigin {
  lat: number;
  lng: number;
  placeId?: string;
}

/**
 * Walking directions are handed to Google Maps. The campus app does not claim
 * indoor or footpath-level turn-by-turn guidance.
 */
export function googleDirectionsUrl(
  destination: CampusLocation,
  origin?: DirectionsOrigin | null,
): string {
  const url = new URL('https://www.google.com/maps/dir/');
  url.searchParams.set('api', '1');
  url.searchParams.set(
    'destination',
    `${destination.coordinates.lat},${destination.coordinates.lng}`,
  );
  if (destination.googlePlaceId) {
    url.searchParams.set('destination_place_id', destination.googlePlaceId);
  }
  url.searchParams.set('travelmode', 'walking');
  if (origin) {
    url.searchParams.set('origin', `${origin.lat},${origin.lng}`);
    if (origin.placeId) url.searchParams.set('origin_place_id', origin.placeId);
  }
  return url.toString();
}

export function formatCoordinates(location: CampusLocation): string {
  return `${location.coordinates.lat.toFixed(6)}, ${location.coordinates.lng.toFixed(6)}`;
}
