import { TOUR_STOPS, type TourStop } from '../data/tour';
import { readLocal, writeLocal, type WriteResult } from './localStore';

/** Tour position, stored on this device only. */

export const TOUR_KEY = 'tour.v1';

export interface TourProgress {
  /** Index into TOUR_STOPS. */
  index: number;
  startedAt: string | null;
  /** Stop ids the student has marked as reached. */
  visited: string[];
  finished: boolean;
}

export const EMPTY_PROGRESS: TourProgress = {
  index: 0,
  startedAt: null,
  visited: [],
  finished: false,
};

export function loadProgress(): TourProgress {
  const raw = readLocal<TourProgress>(TOUR_KEY, EMPTY_PROGRESS);
  if (!raw || typeof raw !== 'object') return EMPTY_PROGRESS;
  const index = Number(raw.index);
  const visited = Array.isArray(raw.visited)
    ? raw.visited.filter((id): id is string => typeof id === 'string')
    : [];
  return {
    index: Number.isFinite(index) ? Math.min(Math.max(0, index), TOUR_STOPS.length - 1) : 0,
    startedAt: typeof raw.startedAt === 'string' ? raw.startedAt : null,
    visited,
    finished: raw.finished === true,
  };
}

export function saveProgress(progress: TourProgress): WriteResult {
  return writeLocal(TOUR_KEY, progress);
}

export function currentStop(progress: TourProgress): TourStop | null {
  if (progress.finished) return null;
  return TOUR_STOPS[progress.index] ?? null;
}

export function startTour(now = new Date()): TourProgress {
  const progress: TourProgress = {
    index: 0,
    startedAt: now.toISOString(),
    visited: [],
    finished: false,
  };
  saveProgress(progress);
  return progress;
}

export function markStopVisited(
  progress: TourProgress,
  stopId: string,
): TourProgress {
  const visited = progress.visited.includes(stopId)
    ? progress.visited
    : [...progress.visited, stopId];
  const index = Math.min(progress.index + 1, TOUR_STOPS.length);
  const next: TourProgress = {
    ...progress,
    visited,
    index,
    finished: index >= TOUR_STOPS.length,
  };
  saveProgress(next);
  return next;
}

export function jumpToStop(progress: TourProgress, index: number): TourProgress {
  const next: TourProgress = {
    ...progress,
    index: Math.min(Math.max(0, index), TOUR_STOPS.length - 1),
    finished: false,
  };
  saveProgress(next);
  return next;
}

export function restartTour(now = new Date()): TourProgress {
  return startTour(now);
}

export function exitTour(): TourProgress {
  const cleared: TourProgress = { ...EMPTY_PROGRESS };
  saveProgress(cleared);
  return cleared;
}

export const tourPercent = (progress: TourProgress): number =>
  Math.round((progress.visited.length / TOUR_STOPS.length) * 100);
