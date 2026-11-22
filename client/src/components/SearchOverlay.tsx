import React, { useState, useEffect } from 'react';
import { Search, MapPin, Building2, BookOpen, Coffee, Home, X, Navigation, CheckCircle, ArrowRight } from 'lucide-react';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDestination: (dest: any) => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({
  isOpen,
  onClose,
  onSelectDestination
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(query)}&category=${category}`)
        .then(res => res.json())
        .then(data => {
          setResults(data.results || []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }, 150);

    return () => clearTimeout(timer);
  }, [query, category, isOpen]);

  if (!isOpen) return null;

  const categories = [
    { id: 'all', label: 'All Destinations', icon: '📍' },
    { id: 'academic', label: 'Departments', icon: '💻' },
    { id: 'laboratory', label: 'Laboratories', icon: '🔬' },
    { id: 'administrative', label: 'Administrative', icon: '🏛️' },
    { id: 'amenity', label: 'Facilities', icon: '☕' },
    { id: 'hostel', label: 'Hostels', icon: '🏠' }
  ];

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex flex-col justify-start pt-12 sm:pt-20 p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl sm:max-w-xl sm:mx-auto w-full max-h-[82vh] flex flex-col shadow-2xl overflow-hidden border border-white/80">
        {/* Search Bar Input */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center space-x-3.5 bg-gradient-to-b from-slate-50/50 to-white">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search departments, labs, exam cell, library..."
            className="flex-1 bg-transparent text-slate-900 font-bold placeholder-slate-400 focus:outline-none text-base"
            autoFocus
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
          >
            Esc
          </button>
        </div>

        {/* Category Filters Carousel */}
        <div className="px-4 py-2.5 bg-slate-50/70 border-b border-slate-100 flex items-center space-x-2 overflow-x-auto no-scrollbar">
          {categories.map(c => {
            const isSelected = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${
                  isSelected
                    ? 'bg-[#0f2c59] text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
                }`}
              >
                <span>{c.icon}</span>
                <span>{c.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search Results List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {loading && (
            <div className="text-center py-10 flex flex-col items-center justify-center space-y-2">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-semibold text-slate-400">Searching 41.28-acre MCE database...</p>
            </div>
          )}

          {!loading && results.length === 0 && (
            <div className="text-center py-12">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-2 text-xl">
                🔍
              </div>
              <h4 className="font-bold text-slate-800 text-sm">No campus destination matched</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                Try searching by department acronym (e.g. "CSE", "ECE", "AIML"), room number (e.g. "204"), or facility.
              </p>
            </div>
          )}

          {!loading && results.map(item => (
            <div
              key={item.id}
              onClick={() => {
                onSelectDestination(item);
                onClose();
              }}
              className="p-3.5 bg-white hover:bg-blue-50/70 border border-slate-100 hover:border-blue-200 rounded-2xl cursor-pointer transition-all flex items-center justify-between group shadow-sm hover:shadow"
            >
              <div className="flex items-start space-x-3.5 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-100 text-[#0f2c59] flex items-center justify-center shrink-0 text-lg transition-colors">
                  {item.category === 'academic' ? '💻' : item.category === 'administrative' ? '🏛️' : item.category === 'hostel' ? '🏠' : '📍'}
                </div>
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-blue-700 transition-colors">
                    {item.name}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5 truncate">
                    {item.buildingName || 'Campus'} • Floor {item.floor ?? 0}
                    {item.roomNumber ? ` • ${item.roomNumber}` : ''}
                  </p>
                  {item.verificationStatus === 'needs_verification' && (
                    <span className="inline-block mt-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                      ⚠️ Physical Survey Pending
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1.5 shrink-0 ml-2">
                <button className="px-3 py-1.5 bg-[#0f2c59] group-hover:bg-blue-600 text-white rounded-xl text-xs font-bold shadow transition-colors flex items-center space-x-1">
                  <span>Directions</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
