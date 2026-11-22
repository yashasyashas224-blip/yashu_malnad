import React, { useState, useEffect } from 'react';
import {
  Search,
  Bot,
  QrCode,
  Calendar,
  AlertTriangle,
  Share2,
  ShieldCheck,
  User,
  Eye,
  LogOut,
  Navigation,
  Compass,
  Building,
  Info,
  Clock,
  MapPin,
  Sparkles,
  ChevronRight,
  BookOpen,
  Coffee,
  CheckCircle,
  Accessibility
} from 'lucide-react';
import { MapLibreMap } from './components/MapLibreMap';
import { NavigationCard } from './components/NavigationCard';
import { SearchOverlay } from './components/SearchOverlay';
import { IndoorQRModal } from './components/IndoorQRModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { ClassroomFinderModal } from './components/ClassroomFinderModal';
import { EmergencyModal } from './components/EmergencyModal';
import { AuthModal } from './components/AuthModal';
import { LocationShareModal } from './components/LocationShareModal';

export const App: React.FC = () => {
  // Authentication State
  const [user, setUser] = useState<any>(() => {
    const saved = localStorage.getItem('mce_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string>(() => {
    return localStorage.getItem('mce_token') || '';
  });

  // Navigation State
  const [userLocation, setUserLocation] = useState<[number, number]>([76.10185, 13.02380]); // Salagame Road Main Gate
  const [buildings, setBuildings] = useState<any[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<any>(null);
  const [destinationNode, setDestinationNode] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [routeMode, setRouteMode] = useState<'shortest' | 'easiest' | 'accessible'>('shortest');
  const [activeCategory, setActiveCategory] = useState<string>('all');

  // Modals Visibility
  const [showSearch, setShowSearch] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [showClassroom, setShowClassroom] = useState(false);
  const [showEmergency, setShowEmergency] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Fetch campus buildings
  useEffect(() => {
    fetch('/api/campus/buildings')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBuildings(data.buildings || []);
        }
      })
      .catch(err => console.warn('Could not load buildings:', err));
  }, []);

  // Compute Route when destination changes
  useEffect(() => {
    if (!destinationNode) {
      setActiveRoute(null);
      return;
    }

    fetch('/api/navigation/route', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fromCoordinates: userLocation,
        toNodeId: destinationNode.id,
        toCoordinates: destinationNode.coordinates,
        mode: routeMode
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.route) {
          setActiveRoute(data.route);
        } else {
          alert('Could not compute path under current campus constraints.');
        }
      })
      .catch(() => alert('Route calculation server error.'));
  }, [destinationNode, userLocation, routeMode]);

  // Auth Callbacks
  const handleLoginSuccess = (newUser: any, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    localStorage.setItem('mce_user', JSON.stringify(newUser));
    localStorage.setItem('mce_token', newToken);
  };

  const handleLogout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('mce_user');
    localStorage.removeItem('mce_token');
  };

  // Select Destination from search, AI, or timetable
  const handleSelectDestination = (dest: any) => {
    if (dest.coordinates) {
      setDestinationNode({
        id: dest.targetNodeId || dest.id,
        name: dest.name,
        coordinates: dest.coordinates
      });
      setSelectedBuilding(null);
    }
  };

  // QR Checkpoint resolution
  const handleCheckpointDetected = (checkpointData: any) => {
    const coords = checkpointData.checkpoint.coordinates;
    setUserLocation(coords);
    alert(`📍 Position calibrated at ${checkpointData.locationName} (Floor ${checkpointData.floor}).`);
  };

  const categories = [
    { id: 'all', label: 'All Campus', icon: '🏛️' },
    { id: 'academic', label: 'Academic & Labs', icon: '💻' },
    { id: 'administrative', label: 'Admin & Exam', icon: '🏢' },
    { id: 'amenity', label: 'Library & Dining', icon: '📚' },
    { id: 'hostel', label: 'Hostels', icon: '🏠' },
    { id: 'sports', label: 'Sports Complex', icon: '⚽' },
    { id: 'spiritual', label: 'Spiritual Enclave', icon: '🕉️' }
  ];

  const filteredBuildings = activeCategory === 'all'
    ? buildings
    : buildings.filter(b => b.category === activeCategory);

  return (
    <div className={`relative w-screen h-screen flex flex-col font-sans select-none overflow-hidden ${highContrast ? 'high-contrast' : ''}`}>
      {/* Sleek Floating Header Bar */}
      <header className="absolute top-4 left-4 right-4 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex items-center justify-between gap-3 pointer-events-auto">
          {/* MCE Identity Badge */}
          <div className="glass-panel rounded-2xl px-3.5 py-2 flex items-center space-x-3 shadow-lg">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0f2c59] to-[#1e3a8a] border-2 border-amber-400 flex items-center justify-center font-extrabold text-white text-xs shadow-md">
              <span className="text-amber-400 tracking-tighter font-mono">MCE</span>
            </div>
            <div className="hidden sm:block">
              <h1 className="font-extrabold text-xs text-[#0f2c59] tracking-tight flex items-center gap-1.5">
                <span>Malnad College of Engineering</span>
                <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded">Hassan</span>
              </h1>
              <p className="text-[10px] text-slate-500 font-medium">Smart Campus Navigator • 41.28 Acres</p>
            </div>
          </div>

          {/* Center Search Pill Bar */}
          <div
            onClick={() => setShowSearch(true)}
            className="flex-1 max-w-md glass-panel hover:bg-white/95 rounded-2xl px-4 py-2.5 flex items-center justify-between cursor-pointer shadow-lg transition-all border border-white/80 group"
          >
            <div className="flex items-center space-x-2.5 text-slate-500 min-w-0">
              <Search className="w-4 h-4 text-blue-600 shrink-0 group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold text-slate-600 truncate">
                Search CSE, Principal, AI Lab, Library...
              </span>
            </div>
            <kbd className="hidden md:inline-flex text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              ⌘K
            </kbd>
          </div>

          {/* User Profile & Actions */}
          <div className="flex items-center space-x-2">
            {user ? (
              <div className="glass-panel px-3 py-1.5 rounded-2xl flex items-center space-x-2 shadow-lg">
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-[11px] font-bold text-slate-800 leading-none">{user.name.split(' ')[0]}</p>
                  <p className="text-[9px] text-emerald-600 font-semibold mt-0.5">Verified MCE {user.role}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="text-slate-400 hover:text-red-500 p-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuth(true)}
                className="bg-gradient-to-r from-[#0f2c59] to-[#1e3a8a] hover:from-[#0a1f3f] hover:to-[#172554] active:scale-95 text-white text-xs font-bold px-3.5 py-2.5 rounded-2xl shadow-xl flex items-center space-x-1.5 transition-all border border-white/20"
              >
                <User className="w-3.5 h-3.5 text-amber-400" />
                <span>MCE Login</span>
              </button>
            )}

            <button
              onClick={() => setHighContrast(!highContrast)}
              className="glass-panel p-2.5 rounded-2xl hover:bg-white text-slate-700 shadow-lg transition-colors"
              title="Toggle Accessibility High Contrast"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Horizontal Category Filtering Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto no-scrollbar pointer-events-auto py-1">
          {categories.map(c => {
            const isSelected = activeCategory === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setActiveCategory(c.id)}
                className={`glass-panel px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all shadow-md ${
                  isSelected
                    ? 'bg-[#0f2c59] text-white border-transparent ring-2 ring-blue-500/30'
                    : 'hover:bg-white text-slate-700'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Interactive Map Viewport */}
      <main className="flex-1 relative w-full h-full">
        <MapLibreMap
          buildings={filteredBuildings}
          userLocation={userLocation}
          destinationNode={destinationNode}
          activeRoute={activeRoute}
          onSelectBuilding={b => setSelectedBuilding(b)}
        />

        {/* Turn-by-turn Navigation HUD Card */}
        {activeRoute && destinationNode && (
          <NavigationCard
            route={activeRoute}
            destinationName={destinationNode.name}
            routeMode={routeMode}
            onChangeMode={mode => setRouteMode(mode)}
            onCancel={() => {
              setActiveRoute(null);
              setDestinationNode(null);
            }}
          />
        )}

        {/* Selected Building Details Bottom Sheet */}
        {selectedBuilding && !activeRoute && (
          <div className="absolute bottom-24 left-4 right-4 sm:left-6 sm:w-96 z-20 animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="glass-panel rounded-3xl p-5 border border-white/80 shadow-2xl">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                    {selectedBuilding.category}
                  </span>
                  <h3 className="font-extrabold text-base text-slate-900 mt-1.5 leading-snug">
                    {selectedBuilding.name}
                  </h3>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    {selectedBuilding.description}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedBuilding(null)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs shrink-0"
                >
                  ✕
                </button>
              </div>

              {/* Building Features Badges */}
              <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                  🏢 {selectedBuilding.floorsCount} Floors
                </span>
                {selectedBuilding.accessibility?.elevators && (
                  <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded flex items-center gap-1">
                    <Accessibility className="w-3 h-3" /> Elevator Available
                  </span>
                )}
                {selectedBuilding.accessibility?.wheelchairRamp && (
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded flex items-center gap-1">
                    ♿ Ramp Access
                  </span>
                )}
              </div>

              {/* Action Button */}
              <div className="mt-4 flex items-center space-x-2">
                <button
                  onClick={() => {
                    setDestinationNode({
                      id: selectedBuilding.id,
                      name: selectedBuilding.name,
                      coordinates: selectedBuilding.coordinates
                    });
                    setSelectedBuilding(null);
                  }}
                  className="flex-1 py-3 bg-gradient-to-r from-[#0f2c59] to-[#1e3a8a] hover:from-[#0a1f3f] hover:to-[#172554] active:scale-98 text-white font-extrabold text-xs rounded-2xl shadow-xl flex items-center justify-center space-x-2 transition-all"
                >
                  <Navigation className="w-4 h-4 text-amber-400" />
                  <span>Start Walking Directions</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Dock */}
      <footer className="absolute bottom-5 left-4 right-4 z-20 max-w-md mx-auto">
        <div className="glass-panel-dark rounded-3xl px-4 py-2.5 flex items-center justify-between shadow-2xl">
          <button
            onClick={() => setShowSearch(true)}
            className="flex flex-col items-center p-1.5 text-slate-300 hover:text-white transition-colors group"
            title="Explore Campus"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-blue-600/40 flex items-center justify-center text-blue-400 group-hover:text-white transition-all">
              <Search className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-300">Explore</span>
          </button>

          <button
            onClick={() => setShowAI(true)}
            className="flex flex-col items-center p-1.5 text-slate-300 hover:text-white transition-colors group"
            title="AI Campus Guide"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-amber-500/40 flex items-center justify-center text-amber-400 group-hover:text-white transition-all">
              <Bot className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-300">AI Guide</span>
          </button>

          <button
            onClick={() => setShowQR(true)}
            className="flex flex-col items-center p-1.5 text-slate-300 hover:text-white transition-colors group"
            title="Scan Indoor QR"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-indigo-600/40 flex items-center justify-center text-indigo-400 group-hover:text-white transition-all">
              <QrCode className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-300">Indoor QR</span>
          </button>

          <button
            onClick={() => setShowClassroom(true)}
            className="flex flex-col items-center p-1.5 text-slate-300 hover:text-white transition-colors group"
            title="Classroom Timetable"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-teal-600/40 flex items-center justify-center text-teal-400 group-hover:text-white transition-all">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-300">Classes</span>
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="flex flex-col items-center p-1.5 text-slate-300 hover:text-white transition-colors group"
            title="Share Position"
          >
            <div className="w-8 h-8 rounded-xl bg-white/10 group-hover:bg-purple-600/40 flex items-center justify-center text-purple-400 group-hover:text-white transition-all">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-slate-300">Share</span>
          </button>

          <button
            onClick={() => setShowEmergency(true)}
            className="flex flex-col items-center p-1.5 text-red-400 hover:text-red-300 transition-colors group"
            title="Campus SOS"
          >
            <div className="w-8 h-8 rounded-xl bg-red-500/20 group-hover:bg-red-600 flex items-center justify-center text-red-400 group-hover:text-white transition-all">
              <AlertTriangle className="w-4 h-4 animate-pulse" />
            </div>
            <span className="text-[9px] font-bold mt-1 text-red-400">SOS</span>
          </button>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SearchOverlay
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onSelectDestination={handleSelectDestination}
      />

      <AIAssistantModal
        isOpen={showAI}
        onClose={() => setShowAI(false)}
        onNavigateToEntity={handleSelectDestination}
      />

      <IndoorQRModal
        isOpen={showQR}
        onClose={() => setShowQR(false)}
        onCheckpointDetected={handleCheckpointDetected}
      />

      <ClassroomFinderModal
        isOpen={showClassroom}
        onClose={() => setShowClassroom(false)}
        onNavigateToRoom={handleSelectDestination}
        token={token}
      />

      <EmergencyModal
        isOpen={showEmergency}
        onClose={() => setShowEmergency(false)}
        onNavigateToEmergency={handleSelectDestination}
      />

      <AuthModal
        isOpen={showAuth}
        onClose={() => setShowAuth(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      <LocationShareModal
        isOpen={showShare}
        onClose={() => setShowShare(false)}
        userLocation={userLocation}
        token={token}
      />
    </div>
  );
};
