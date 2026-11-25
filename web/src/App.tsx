import {
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  CAMPUS,
  LOCATIONS,
  LOCATION_BY_ID,
  type CampusLocation,
  type CategoryId,
} from './data/locations';
import { filterByCategory, searchLocations } from './lib/search';
import { useOnlineStatus } from './lib/offline';
import { useI18n } from './lib/i18n';
import type { WalkingRoute } from './lib/routing';
import { Header } from './components/Header';
import { CategoryBar } from './components/CategoryBar';
import { ResultsPanel } from './components/ResultsPanel';
import { MapPanel } from './components/MapPanel';
import { LocationCard } from './components/LocationCard';
import { AssistantPanel } from './components/AssistantPanel';
import { ScannerDialog } from './components/ScannerDialog';
import { DirectionsDialog } from './components/DirectionsDialog';
import { RoutePlanner } from './components/RoutePlanner';
import { ClassroomFinder } from './components/ClassroomFinder';
import { EventsSheet } from './components/EventsSheet';
import { AccessibilitySheet } from './components/AccessibilitySheet';
import { ToolsSheet } from './components/ToolsSheet';
import { PlannerSheet } from './components/PlannerSheet';
import { ServicesSheet } from './components/ServicesSheet';
import { IndoorSheet } from './components/IndoorSheet';
import { PulseSheet } from './components/PulseSheet';
import { TourSheet } from './components/TourSheet';
import { MaintainerSheet } from './components/MaintainerSheet';
import { BottomNav } from './components/BottomNav';
import { searchServices } from './lib/services';
import { parseIndoorCode, type IndoorCodeTarget } from './lib/indoor';
import { Modal } from './components/Modal';

function readPlaceFromUrl(): string | null {
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#\/?/, ''));
  return (
    search.get('place') ??
    search.get('location') ??
    hash.get('place') ??
    hash.get('location')
  );
}

export function App() {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);
  const [category, setCategory] = useState<CategoryId | 'all'>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusToken, setFocusToken] = useState(0);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [directionsFor, setDirectionsFor] = useState<CampusLocation | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [routeOpen, setRouteOpen] = useState(false);
  const [routeDestinationId, setRouteDestinationId] = useState<string | null>(null);
  const [plannedRoute, setPlannedRoute] = useState<WalkingRoute | null>(null);
  const [classroomsOpen, setClassroomsOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [accessibilityOpen, setAccessibilityOpen] = useState(false);
  const [showAccessibilityOnMap, setShowAccessibilityOnMap] = useState(false);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [servicesOpen, setServicesOpen] = useState(false);
  const [servicesQuery, setServicesQuery] = useState('');
  const [indoorOpen, setIndoorOpen] = useState(false);
  const [indoorTarget, setIndoorTarget] = useState<IndoorCodeTarget | null>(null);
  const [pulseOpen, setPulseOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [maintainerOpen, setMaintainerOpen] = useState(false);
  const online = useOnlineStatus();
  const [highContrast, setHighContrast] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem('mce-campus-contrast') === 'high';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    document.documentElement.dataset.contrast = highContrast ? 'high' : 'normal';
    try {
      window.localStorage.setItem('mce-campus-contrast', highContrast ? 'high' : 'normal');
    } catch {
      // Storage can be unavailable in private browsing; the preference still applies.
    }
  }, [highContrast]);

  const results = useMemo(
    () =>
      searchLocations(filterByCategory(LOCATIONS, category), deferredQuery, {
        limit: 20,
      }),
    [category, deferredQuery],
  );

  const resultLocations = useMemo(
    () => results.map((hit) => hit.location),
    [results],
  );

  const serviceHits = useMemo(() => searchServices(deferredQuery), [deferredQuery]);

  const selected = selectedId ? (LOCATION_BY_ID.get(selectedId) ?? null) : null;

  const visibleIds = useMemo(() => {
    const ids = new Set(resultLocations.map((location) => location.id));
    if (selectedId) ids.add(selectedId);
    return ids;
  }, [resultLocations, selectedId]);

  const isSearching = query.trim() !== deferredQuery.trim();

  const openLocation = useCallback(
    (location: CampusLocation, options?: { syncSearch?: boolean }) => {
      setSelectedId(location.id);
      setFocusToken((token) => token + 1);
      setExploreOpen(false);
      if (options?.syncSearch) {
        setCategory('all');
        setQuery(location.name);
      }
      try {
        const url = new URL(window.location.href);
        url.searchParams.set('place', location.id);
        window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
      } catch {
        // URL updates are a convenience; selection still works without them.
      }
    },
    [],
  );

  const closeCard = useCallback(() => {
    setSelectedId(null);
    try {
      const url = new URL(window.location.href);
      url.searchParams.delete('place');
      url.searchParams.delete('location');
      window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    } catch {
      // Ignore URL failures.
    }
  }, []);

  const openCampusRoute = useCallback((location: CampusLocation) => {
    setRouteDestinationId(location.id);
    setRouteOpen(true);
  }, []);

  const handleRouteChange = useCallback((next: WalkingRoute | null) => {
    setPlannedRoute(next);
  }, []);

  useEffect(() => {
    const applyUrl = (): void => {
      const id = readPlaceFromUrl();
      const location = id ? LOCATION_BY_ID.get(id) : undefined;
      if (location) openLocation(location, { syncSearch: true });
    };

    applyUrl();
    window.addEventListener('popstate', applyUrl);
    return () => window.removeEventListener('popstate', applyUrl);
  }, [openLocation]);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get('indoor');
    if (!value) return;
    const target = parseIndoorCode(`mce-indoor:${value}`);
    if (!target) return;
    setIndoorTarget(target);
    setIndoorOpen(true);
  }, []);

  const focusSearch = (): void => {
    window.setTimeout(() => {
      const inputs = Array.from(
        document.querySelectorAll<HTMLInputElement>('input[role="combobox"]'),
      );
      const visible = inputs.find((input) => input.offsetParent !== null) ?? inputs[0];
      visible?.focus();
    }, 120);
  };

  const handleSearchInstead = (): void => {
    setScannerOpen(false);
    setExploreOpen(false);
    focusSearch();
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      <Header
        query={query}
        onQueryChange={setQuery}
        results={results}
        onSelectResult={(location) => openLocation(location, { syncSearch: true })}
        isSearching={isSearching}
        highContrast={highContrast}
        onToggleContrast={() => setHighContrast((value) => !value)}
        onAssistant={() => setAssistantOpen(true)}
        onScan={() => setScannerOpen(true)}
        onTools={() => setToolsOpen(true)}
        serviceHits={serviceHits}
        onSelectService={(service) => {
          setExploreOpen(false);
          setServicesQuery(service.title);
          setServicesOpen(true);
        }}
      />

      {!online ? (
        <div
          role="status"
          aria-live="polite"
          className="shrink-0 border-b border-amber-300 bg-amber-100 px-3 py-1.5 text-center text-[11px] font-bold text-amber-900"
        >
          {t('offline.banner')}
        </div>
      ) : null}

      <CategoryBar category={category} onChange={setCategory} />

      <div className="relative flex min-h-0 flex-1">
        <aside className="hidden w-[380px] shrink-0 border-r border-slate-200 bg-slate-50 lg:flex lg:flex-col xl:w-[410px]">
          <ResultsPanel
            locations={resultLocations}
            query={deferredQuery}
            selectedId={selectedId}
            onSelect={(location) => openLocation(location)}
            onQuickSearch={setQuery}
            totalCount={LOCATIONS.length}
            serviceHits={serviceHits}
            onSelectService={(service) => {
              setExploreOpen(false);
              setServicesQuery(service.title);
              setServicesOpen(true);
            }}
          />
        </aside>

        <main className="relative min-w-0 flex-1">
          <MapPanel
            locations={LOCATIONS}
            visibleIds={visibleIds}
            selectedId={selectedId}
            focusToken={focusToken}
            route={plannedRoute}
            showAccessibility={showAccessibilityOnMap}
            onSelect={(id) => {
              const location = LOCATION_BY_ID.get(id);
              if (location) openLocation(location);
            }}
          />

          {selected ? (
            <LocationCard
              location={selected}
              onClose={closeCard}
              onDirections={(location) => setDirectionsFor(location)}
              onCampusRoute={openCampusRoute}
              onAccessibility={() => setAccessibilityOpen(true)}
            />
          ) : null}
        </main>
      </div>

      <BottomNav
        onExplore={() => {
          setQuery('');
          setCategory('all');
          setExploreOpen(true);
        }}
        onAssistant={() => setAssistantOpen(true)}
        onScan={() => setScannerOpen(true)}
        onMore={() => setToolsOpen(true)}
      />

      <p aria-live="polite" className="sr-only">
        {selected ? `${selected.name} selected. Place details opened.` : ''}
      </p>

      <Modal
        open={exploreOpen}
        onClose={() => setExploreOpen(false)}
        title={t('results.exploreTitle')}
        description={`${LOCATIONS.length} verified places · positions checked 23 November 2026`}
        variant="sheet"
      >
        <div className="flex min-h-0 flex-1 flex-col">
          <ResultsPanel
            locations={resultLocations}
            query={deferredQuery}
            selectedId={selectedId}
            onSelect={(location) => {
              openLocation(location);
              setExploreOpen(false);
            }}
            onQuickSearch={setQuery}
            totalCount={LOCATIONS.length}
            serviceHits={serviceHits}
            onSelectService={(service) => {
              setExploreOpen(false);
              setServicesQuery(service.title);
              setServicesOpen(true);
            }}
          />
        </div>
      </Modal>

      <AssistantPanel
        open={assistantOpen}
        onClose={() => setAssistantOpen(false)}
        locations={LOCATIONS}
        onShowLocation={(location) => openLocation(location, { syncSearch: true })}
        onDirections={(location) => setDirectionsFor(location)}
      />

      <ScannerDialog
        open={scannerOpen}
        locations={LOCATIONS}
        onClose={() => setScannerOpen(false)}
        onResolved={(location) => openLocation(location, { syncSearch: true })}
        onSearchInstead={handleSearchInstead}
        onIndoorCode={(target) => {
          setIndoorTarget(target);
          setIndoorOpen(true);
        }}
      />

      {directionsFor ? (
        <DirectionsDialog
          key={directionsFor.id}
          open
          destination={directionsFor}
          locations={LOCATIONS}
          onClose={() => setDirectionsFor(null)}
          onCampusRoute={openCampusRoute}
        />
      ) : null}

      {routeOpen ? (
        <RoutePlanner
          key={`route-${routeDestinationId ?? 'any'}`}
          open
          initialDestinationId={routeDestinationId}
          onClose={() => {
            setRouteOpen(false);
            setRouteDestinationId(null);
          }}
          onRouteChange={handleRouteChange}
          onOpenLocation={(location) => openLocation(location)}
        />
      ) : null}

      <ClassroomFinder
        open={classroomsOpen}
        onClose={() => setClassroomsOpen(false)}
        onDirections={(location) => setDirectionsFor(location)}
        onCampusRoute={(location) => {
          setClassroomsOpen(false);
          openCampusRoute(location);
        }}
      />

      <EventsSheet
        open={eventsOpen}
        onClose={() => setEventsOpen(false)}
        onOpenLocation={(location) => {
          setEventsOpen(false);
          openLocation(location);
        }}
        onCampusRoute={(location) => {
          setEventsOpen(false);
          openCampusRoute(location);
        }}
      />

      <AccessibilitySheet
        open={accessibilityOpen}
        onClose={() => setAccessibilityOpen(false)}
        showOnMap={showAccessibilityOnMap}
        onToggleMap={() => setShowAccessibilityOnMap((value) => !value)}
        onOpenLocation={(location) => {
          setAccessibilityOpen(false);
          openLocation(location);
        }}
      />

      <ToolsSheet
        open={toolsOpen}
        onClose={() => setToolsOpen(false)}
        onRoutes={() => {
          setRouteDestinationId(selectedId);
          setRouteOpen(true);
        }}
        onClassrooms={() => setClassroomsOpen(true)}
        onEvents={() => setEventsOpen(true)}
        onAccessibility={() => setAccessibilityOpen(true)}
        onPlanner={() => setPlannerOpen(true)}
        onServices={() => {
          setServicesQuery('');
          setServicesOpen(true);
        }}
        onIndoor={() => {
          setIndoorTarget(null);
          setIndoorOpen(true);
        }}
        onPulse={() => setPulseOpen(true)}
        onTour={() => setTourOpen(true)}
        onMaintainer={() => setMaintainerOpen(true)}
      />

      <PlannerSheet
        open={plannerOpen}
        onClose={() => setPlannerOpen(false)}
        onOpenLocation={(location) => {
          setPlannerOpen(false);
          openLocation(location);
        }}
        onCampusRoute={(location) => {
          setPlannerOpen(false);
          openCampusRoute(location);
        }}
      />

      <ServicesSheet
        open={servicesOpen}
        initialQuery={servicesQuery}
        onClose={() => setServicesOpen(false)}
        onOpenLocation={(location) => {
          setServicesOpen(false);
          openLocation(location);
        }}
        onCampusRoute={(location) => {
          setServicesOpen(false);
          openCampusRoute(location);
        }}
      />

      <IndoorSheet
        open={indoorOpen}
        target={indoorTarget}
        onClose={() => {
          setIndoorOpen(false);
          setIndoorTarget(null);
        }}
        onOpenLocation={(location) => {
          setIndoorOpen(false);
          openLocation(location);
        }}
        onCampusRoute={(location) => {
          setIndoorOpen(false);
          openCampusRoute(location);
        }}
      />

      <PulseSheet
        open={pulseOpen}
        onClose={() => setPulseOpen(false)}
        onOpenLocation={(location) => {
          setPulseOpen(false);
          openLocation(location);
        }}
      />

      <TourSheet
        open={tourOpen}
        onClose={() => setTourOpen(false)}
        onOpenLocation={(location) => {
          setTourOpen(false);
          openLocation(location);
        }}
        onCampusRoute={(location) => {
          setTourOpen(false);
          openCampusRoute(location);
        }}
      />

      <MaintainerSheet open={maintainerOpen} onClose={() => setMaintainerOpen(false)} />

      <p className="sr-only">
        Campus map data checked on 23 November 2026. {CAMPUS.name}, {CAMPUS.address}.
        OpenStreetMap campus boundary licensed under ODbL.
      </p>
    </div>
  );
}
