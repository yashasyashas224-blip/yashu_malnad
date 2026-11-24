/**
 * Accessibility features on campus.
 *
 * NOTHING HERE IS SURVEYED YET, so the list is empty. The app renders an
 * honest "not surveyed" state, and the step-free route option refuses to claim
 * a route until segments in data/routes.ts are marked stepFree: 'confirmed'.
 *
 * HOW A MAINTAINER ADDS DATA
 * --------------------------
 * Walk the campus with the estate office (or take the institution's own audit
 * report) and record each feature with a position or a building reference:
 *
 *   {
 *     id: 'lib-ramp-east',
 *     kind: 'ramp',
 *     label: 'Library east ramp',
 *     locationId: 'central-library',
 *     coordinates: { lat: 13.02531, lng: 76.10248 },
 *     note: 'Ramp from the east approach; handrail on the left.',
 *     source: { label: 'Estate office accessibility audit', url: 'https://…' },
 *     checkedOn: '2026-11-24',
 *   }
 *
 * Remove or amend an entry as soon as a feature changes. Never mark a feature
 * as accessible without the survey note that supports it.
 */

import type { LatLng } from './locations';

export type AccessibilityFeatureKind =
  | 'accessible-entrance'
  | 'ramp'
  | 'lift'
  | 'accessible-washroom'
  | 'stairs'
  | 'step-free-path';

export interface AccessibilityFeature {
  id: string;
  kind: AccessibilityFeatureKind;
  label: string;
  /** Place id from locations.ts, when the feature belongs to a building. */
  locationId: string | null;
  coordinates: LatLng | null;
  note: string | null;
  source: { label: string; url: string } | null;
  checkedOn: string;
}

export interface AccessibilityKindMeta {
  id: AccessibilityFeatureKind;
  label: string;
  shortLabel: string;
  emoji: string;
  description: string;
}

export const ACCESSIBILITY_KINDS: AccessibilityKindMeta[] = [
  {
    id: 'accessible-entrance',
    label: 'Accessible entrance',
    shortLabel: 'Entrances',
    emoji: '🚪',
    description: 'Doors or gates usable without steps.',
  },
  {
    id: 'ramp',
    label: 'Ramp',
    shortLabel: 'Ramps',
    emoji: '📐',
    description: 'Sloped access between levels.',
  },
  {
    id: 'lift',
    label: 'Lift',
    shortLabel: 'Lifts',
    emoji: '🛗',
    description: 'Vertical access between floors.',
  },
  {
    id: 'accessible-washroom',
    label: 'Accessible washroom',
    shortLabel: 'Washrooms',
    emoji: '🚻',
    description: 'Washrooms designed for wheelchair users.',
  },
  {
    id: 'stairs',
    label: 'Stairs',
    shortLabel: 'Stairs',
    emoji: '🪜',
    description: 'Stepped route that step-free travel must avoid.',
  },
  {
    id: 'step-free-path',
    label: 'Step-free path',
    shortLabel: 'Paths',
    emoji: '♿',
    description: 'A surveyed route without stairs.',
  },
];

export const ACCESSIBILITY_KIND_BY_ID = Object.fromEntries(
  ACCESSIBILITY_KINDS.map((kind) => [kind.id, kind]),
) as Record<AccessibilityFeatureKind, AccessibilityKindMeta>;

export const ACCESSIBILITY_FEATURES: AccessibilityFeature[] = [];

export const ACCESSIBILITY_SURVEYED = ACCESSIBILITY_FEATURES.length > 0;

export const featuresForLocation = (locationId: string): AccessibilityFeature[] =>
  ACCESSIBILITY_FEATURES.filter((feature) => feature.locationId === locationId);

export const accessibilityCheckedOn = (): string | null => {
  let latest: string | null = null;
  for (const feature of ACCESSIBILITY_FEATURES) {
    if (!latest || feature.checkedOn > latest) latest = feature.checkedOn;
  }
  return latest;
};
