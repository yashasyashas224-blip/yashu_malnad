import { Contrast, MessageCircle, ScanLine } from 'lucide-react';
import type { CampusLocation } from '../data/locations';
import type { SearchHit } from '../lib/search';
import { SearchBox } from './SearchBox';

interface HeaderProps {
  query: string;
  onQueryChange: (value: string) => void;
  results: SearchHit[];
  onSelectResult: (location: CampusLocation) => void;
  isSearching: boolean;
  highContrast: boolean;
  onToggleContrast: () => void;
  onAssistant: () => void;
  onScan: () => void;
}

export function Header({
  query,
  onQueryChange,
  results,
  onSelectResult,
  isSearching,
  highContrast,
  onToggleContrast,
  onAssistant,
  onScan,
}: HeaderProps) {
  return (
    <header className="relative z-50 shrink-0 bg-navy-900 text-white">
      <div className="mx-auto w-full max-w-[1600px] px-3 pt-2 sm:px-4">
        <div className="flex items-center gap-2.5">
          <a
            href="/"
            aria-label="MCE Smart Campus Navigator home"
            className="flex min-w-0 items-center gap-2.5 rounded-xl"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gold-500 text-[12px] font-extrabold tracking-tight text-navy-950 shadow-sm">
              MCE
            </span>
            <span className="min-w-0">
              <span className="block truncate text-[13px] font-extrabold leading-tight sm:text-sm">
                Malnad College of Engineering
              </span>
              <span className="block truncate text-[10px] font-medium text-slate-300">
                Campus Navigator · Hassan
              </span>
            </span>
          </a>

          <div className="hidden min-w-0 flex-1 justify-center px-4 md:flex">
            <div className="w-full max-w-xl">
              <SearchBox
                inputId="campus-search"
                value={query}
                onChange={onQueryChange}
                results={results}
                onSelect={onSelectResult}
                isSearching={isSearching}
              />
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onToggleContrast}
              aria-pressed={highContrast}
              aria-label="Toggle high contrast mode"
              title="High contrast"
              className={`grid h-9 w-9 place-items-center rounded-xl border transition ${
                highContrast
                  ? 'border-gold-400 bg-gold-500 text-navy-950'
                  : 'border-white/15 text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <Contrast aria-hidden="true" className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={onAssistant}
              className="hidden min-h-[38px] items-center gap-1.5 rounded-xl bg-gold-500 px-3 text-xs font-extrabold text-navy-950 transition hover:bg-gold-400 md:inline-flex"
            >
              <MessageCircle aria-hidden="true" className="h-4 w-4" />
              Campus guide
            </button>

            <button
              type="button"
              onClick={onScan}
              className="hidden min-h-[38px] items-center gap-1.5 rounded-xl border border-white/20 px-3 text-xs font-bold text-white transition hover:bg-white/10 md:inline-flex"
            >
              <ScanLine aria-hidden="true" className="h-4 w-4" />
              Scan QR
            </button>
          </div>
        </div>

        <div className="pb-2.5 pt-2 md:hidden">
          <SearchBox
            inputId="campus-search-mobile"
            value={query}
            onChange={onQueryChange}
            results={results}
            onSelect={onSelectResult}
            isSearching={isSearching}
            placeholder="Search a campus place…"
          />
        </div>
      </div>
    </header>
  );
}
