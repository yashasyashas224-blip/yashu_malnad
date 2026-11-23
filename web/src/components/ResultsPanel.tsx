import { ArrowUpRight, ChevronRight, MapPin, SearchX } from 'lucide-react';
import {
  CAMPUS,
  CATEGORY_BY_ID,
  PLACES_CHECKED_ON,
  type CampusLocation,
} from '../data/locations';
import { groupByCategory, QUICK_SEARCHES } from '../lib/search';

interface ResultsPanelProps {
  locations: CampusLocation[];
  query: string;
  selectedId: string | null;
  onSelect: (location: CampusLocation) => void;
  onQuickSearch: (query: string) => void;
  totalCount: number;
}

function LocationRow({
  location,
  selected,
  onSelect,
}: {
  location: CampusLocation;
  selected: boolean;
  onSelect: (location: CampusLocation) => void;
}) {
  const meta = CATEGORY_BY_ID[location.category];
  return (
    <button
      type="button"
      onClick={() => onSelect(location)}
      aria-current={selected ? 'true' : undefined}
      className={`group flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition ${
        selected
          ? 'border-gold-500 bg-gold-500/10 shadow-sm'
          : 'border-transparent bg-white hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl text-lg"
        style={{ backgroundColor: meta.softColor }}
      >
        {meta.emoji}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="truncate text-sm font-bold text-navy-900">{location.name}</span>
        </span>
        <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          {meta.label}
        </span>
        <span className="mt-1 block line-clamp-2 text-xs leading-relaxed text-slate-500">
          {location.description}
        </span>
      </span>
      <ChevronRight
        aria-hidden="true"
        className="mt-2 h-4 w-4 shrink-0 text-slate-300 transition group-hover:text-navy-700"
      />
    </button>
  );
}

export function ResultsPanel({
  locations,
  query,
  selectedId,
  onSelect,
  onQuickSearch,
  totalCount,
}: ResultsPanelProps) {
  const trimmed = query.trim();
  const groups = groupByCategory(locations);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-baseline justify-between gap-3 px-4 pb-2 pt-4">
        <h2 className="text-sm font-extrabold uppercase tracking-wider text-navy-900">
          {trimmed ? 'Search results' : 'Explore campus'}
        </h2>
        <span className="text-[11px] font-semibold text-slate-400">
          {locations.length} of {totalCount}
        </span>
      </div>

      <div className="nice-scroll min-h-0 flex-1 overflow-y-auto px-3 pb-4">
        {locations.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-4 text-center">
            <SearchX aria-hidden="true" className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-2 text-sm font-bold text-navy-900">
              No verified place matches {trimmed ? `“${trimmed}”` : 'this filter'}.
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              I only list places whose name and position are verified. Unmapped
              facilities are not guessed.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-1.5">
              {QUICK_SEARCHES.slice(0, 4).map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => onQuickSearch(suggestion)}
                  className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-300 hover:text-navy-900"
                >
                  {suggestion}
                </button>
              ))}
            </div>
            <a
              href={CAMPUS.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:underline"
            >
              Check the wider area on Google Maps
              <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : trimmed ? (
          <div className="space-y-1">
            {locations.map((location) => (
              <LocationRow
                key={location.id}
                location={location}
                selected={location.id === selectedId}
                onSelect={onSelect}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.map((group) => (
              <section key={group.id} aria-labelledby={`group-${group.id}`}>
                <h3
                  id={`group-${group.id}`}
                  className="flex items-center gap-1.5 px-1 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-400"
                >
                  <span aria-hidden="true">{group.emoji}</span>
                  {group.label}
                </h3>
                <div className="space-y-1">
                  {group.locations.map((location) => (
                    <LocationRow
                      key={location.id}
                      location={location}
                      selected={location.id === selectedId}
                      onSelect={onSelect}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="shrink-0 border-t border-slate-200 bg-slate-50 px-4 py-3">
        <p className="flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-500">
          <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            {totalCount} verified places. Positions checked against Google Maps /
            OpenStreetMap on {PLACES_CHECKED_ON}. Unverified facilities are left
            off the map.
          </span>
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 pl-5 text-[11px] font-semibold">
          <a
            href={CAMPUS.officialUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 hover:underline"
          >
            Official MCE site
          </a>
          <a
            href={CAMPUS.boundarySource}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-500 hover:underline"
          >
            Boundary © OpenStreetMap
          </a>
        </div>
      </div>
    </div>
  );
}
