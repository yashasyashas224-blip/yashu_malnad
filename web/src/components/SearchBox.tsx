import { useEffect, useId, useRef, useState } from 'react';
import { ArrowUpRight, LifeBuoy, Loader2, Search, X } from 'lucide-react';
import {
  CATEGORY_BY_ID,
  CAMPUS,
  LOCATION_BY_ID,
  type CampusLocation,
  type CategoryId,
} from '../data/locations';
import { SERVICE_NEED_BY_ID, type CampusService } from '../data/services';
import type { SearchHit } from '../lib/search';
import type { ServiceHit } from '../lib/services';
import { findUnverifiedNeeds } from '../lib/services';
import { useI18n, type TranslationKey } from '../lib/i18n';

interface SearchBoxProps {
  value: string;
  onChange: (value: string) => void;
  results: SearchHit[];
  onSelect: (location: CampusLocation) => void;
  serviceHits?: ServiceHit[];
  onSelectService?: (service: CampusService) => void;
  onOpenServices?: (query: string) => void;
  isSearching: boolean;
  placeholder?: string;
  inputId?: string;
}

export function SearchBox({
  value,
  onChange,
  results,
  onSelect,
  serviceHits = [],
  onSelectService,
  onOpenServices,
  isSearching,
  placeholder,
  inputId,
}: SearchBoxProps) {
  const { t } = useI18n();
  const [focused, setFocused] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const blurTimer = useRef<number | null>(null);
  const lastChosen = useRef<{ id: string; at: number } | null>(null);
  const rawId = useId();
  const listId = `search-list-${rawId.replace(/:/g, '')}`;
  const resolvedInputId = inputId ?? `${listId}-input`;
  const optionId = (index: number): string => `${listId}-option-${index}`;

  const showList = focused && value.trim().length > 0;
  const services = serviceHits;
  const optionCount = results.length + services.length;
  const activeHit =
    activeIndex >= 0 && activeIndex < results.length ? results[activeIndex] : undefined;
  const activeService =
    activeIndex >= results.length ? services[activeIndex - results.length] : undefined;
  const missingNeed =
    !isSearching && results.length === 0 && services.length === 0
      ? findUnverifiedNeeds(value)[0]
      : undefined;

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  useEffect(() => {
    return () => {
      if (blurTimer.current) window.clearTimeout(blurTimer.current);
    };
  }, []);

  useEffect(() => {
    if (activeIndex >= optionCount) setActiveIndex(-1);
  }, [activeIndex, optionCount]);

  const choose = (location: CampusLocation): void => {
    const now = Date.now();
    if (lastChosen.current?.id === location.id && now - lastChosen.current.at < 600) {
      return;
    }
    lastChosen.current = { id: location.id, at: now };
    onSelect(location);
    setFocused(false);
    inputRef.current?.blur();
  };

  const chooseService = (service: CampusService): void => {
    if (!onSelectService) return;
    onSelectService(service);
    setFocused(false);
    inputRef.current?.blur();
  };

  return (
    <div className="relative w-full">
      <label htmlFor={resolvedInputId} className="sr-only">
        {t('search.label')}
      </label>

      <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-gold-500 focus-within:ring-4 focus-within:ring-gold-500/25">
        <Search aria-hidden="true" className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          ref={inputRef}
          id={resolvedInputId}
          type="text"
          role="combobox"
          aria-expanded={showList}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={
            showList && (activeHit || activeService) ? optionId(activeIndex) : undefined
          }
          autoComplete="off"
          spellCheck={false}
          value={value}
          placeholder={placeholder ?? t('search.placeholder')}
          onChange={(event) => {
            onChange(event.target.value);
            setFocused(true);
          }}
          onFocus={() => {
            if (blurTimer.current) window.clearTimeout(blurTimer.current);
            setFocused(true);
          }}
          onBlur={() => {
            // Give a click on an option time to complete before the list closes.
            blurTimer.current = window.setTimeout(() => setFocused(false), 180);
          }}
          onKeyDown={(event) => {
            if (event.key === 'ArrowDown') {
              event.preventDefault();
              if (optionCount > 0) {
                setFocused(true);
                setActiveIndex((index) => Math.min(index + 1, optionCount - 1));
              }
            } else if (event.key === 'ArrowUp') {
              event.preventDefault();
              setActiveIndex((index) => Math.max(index - 1, 0));
            } else if (event.key === 'Enter') {
              if (activeService) {
                event.preventDefault();
                chooseService(activeService.service);
              } else {
                const hit = activeHit ?? results[0];
                if (hit) {
                  event.preventDefault();
                  choose(hit.location);
                }
              }
            } else if (event.key === 'Escape') {
              setFocused(false);
              setActiveIndex(-1);
              inputRef.current?.blur();
            }
          }}
          className="min-w-0 flex-1 bg-transparent py-1 text-sm font-medium text-slate-900 outline-none placeholder:font-normal placeholder:text-slate-400"
        />

        {value ? (
          <button
            type="button"
            aria-label={t('search.clear')}
            onClick={() => {
              onChange('');
              setActiveIndex(-1);
              inputRef.current?.focus();
            }}
            className="grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-navy-900"
          >
            <X aria-hidden="true" className="h-3.5 w-3.5" />
          </button>
        ) : (
          <kbd className="hidden shrink-0 rounded-md border border-slate-200 bg-slate-50 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:block">
            Enter
          </kbd>
        )}
      </div>

      <p aria-live="polite" className="sr-only">
        {isSearching
          ? t('search.searching')
          : showList
            ? results.length === 1
              ? t('search.resultOne')
              : t('search.resultMany', { count: results.length })
            : ''}
      </p>

      {showList ? (
        <div
          id={listId}
          role="listbox"
          aria-label={t('search.label')}
          className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[22rem] overflow-y-auto rounded-2xl border border-slate-200 bg-white py-1 shadow-2xl"
        >
          {isSearching ? (
            <div className="flex items-center gap-2 px-4 py-4 text-sm text-slate-500">
              <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
              {t('search.searching')}
            </div>
          ) : missingNeed ? (
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-navy-900">
                No verified {missingNeed.label.toLowerCase()} location yet
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {missingNeed.description} MCE has not published a checked position for this, so
                the map does not guess one.
              </p>
              {onOpenServices ? (
                <button
                  type="button"
                  onPointerDown={(event) => event.preventDefault()}
                  onClick={() => {
                    onOpenServices(missingNeed.label);
                    setFocused(false);
                    inputRef.current?.blur();
                  }}
                  className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-navy-800"
                >
                  Open Find a service
                </button>
              ) : null}
            </div>
          ) : results.length === 0 && services.length === 0 ? (
            <div className="px-4 py-4">
              <p className="text-sm font-semibold text-navy-900">
                {t('search.noMatchTitle', { query: value.trim() })}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">
                {t('search.noMatchBody')}
              </p>
              <a
                href={CAMPUS.googleMapsQueryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-navy-900 px-3 py-2 text-xs font-bold text-white transition hover:bg-navy-800"
              >
                {t('search.openGoogle')}
                <ArrowUpRight aria-hidden="true" className="h-3.5 w-3.5" />
              </a>
            </div>
          ) : (
            results.map((hit, index) => {
              const meta = CATEGORY_BY_ID[hit.location.category];
              return (
                <div
                  key={hit.location.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  onPointerDown={(event) => {
                    event.preventDefault();
                  }}
                  onMouseDown={(event) => {
                    event.preventDefault();
                    choose(hit.location);
                  }}
                  onClick={() => choose(hit.location)}
                  onMouseEnter={() => setActiveIndex(index)}
                  className={`mx-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                    index === activeIndex ? 'bg-gold-500/15' : 'hover:bg-slate-50'
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-base"
                    style={{ backgroundColor: meta.softColor }}
                  >
                    {meta.emoji}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold text-navy-900">
                      {hit.location.name}
                    </span>
                    <span className="block truncate text-[11px] text-slate-500">
                      {t(`cat.${hit.location.category}` as TranslationKey)} ·{' '}
                      {hit.location.shortName}
                    </span>
                  </span>
                </div>
              );
            })
          )}

          {!isSearching && services.length > 0 ? (
            <div className="mt-1 border-t border-slate-100 pt-1">
              <p className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Campus services
              </p>
              {services.map((hit, offset) => {
                const index = results.length + offset;
                const place = LOCATION_BY_ID.get(hit.service.locationId);
                const need = SERVICE_NEED_BY_ID.get(hit.service.needId);
                return (
                  <div
                    key={hit.service.id}
                    id={optionId(index)}
                    role="option"
                    aria-selected={index === activeIndex}
                    onPointerDown={(event) => {
                      event.preventDefault();
                    }}
                    onMouseDown={(event) => {
                      event.preventDefault();
                      chooseService(hit.service);
                    }}
                    onClick={() => chooseService(hit.service)}
                    onMouseEnter={() => setActiveIndex(index)}
                    className={`mx-1 flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 transition ${
                      index === activeIndex ? 'bg-gold-500/15' : 'hover:bg-slate-50'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-emerald-800"
                    >
                      <LifeBuoy className="h-4 w-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-navy-900">
                        {hit.service.title}
                      </span>
                      <span className="block truncate text-[11px] text-slate-500">
                        {need?.label ?? 'Service'} · {place?.shortName ?? 'Unmapped'}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
