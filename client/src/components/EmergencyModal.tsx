import React, { useState, useEffect } from 'react';
import { AlertTriangle, PhoneCall, ShieldAlert, Cross, Navigation, X, Siren } from 'lucide-react';

interface EmergencyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToEmergency: (location: any) => void;
}

export const EmergencyModal: React.FC<EmergencyModalProps> = ({
  isOpen,
  onClose,
  onNavigateToEmergency
}) => {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/emergency/locations')
      .then(res => res.json())
      .then(d => {
        if (d.success) setData(d);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-red-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-2xl border-2 border-red-500/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-700 to-rose-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center animate-pulse">
              <Siren className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-base">Campus Emergency Services</h3>
              <p className="text-[11px] text-red-100">Malnad College of Engineering Safety Desk</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Hotlines */}
        <div className="p-4 bg-red-50/70 border-b border-red-100">
          <h4 className="text-[10px] font-extrabold text-red-800 uppercase tracking-wider mb-2">Direct Emergency Hotlines</h4>
          <div className="grid grid-cols-2 gap-2">
            <a
              href="tel:+918172245082"
              className="p-3 bg-white rounded-2xl border border-red-200 flex items-center space-x-2.5 hover:bg-red-100/60 transition-colors shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] text-slate-500 font-bold truncate">MCE Security</p>
                <p className="text-xs font-black text-red-700">08172-245082</p>
              </div>
            </a>
            <a
              href="tel:108"
              className="p-3 bg-white rounded-2xl border border-red-200 flex items-center space-x-2.5 hover:bg-red-100/60 transition-colors shadow-xs active:scale-95"
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <Cross className="w-4 h-4" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-[10px] text-slate-500 font-bold truncate">Ambulance</p>
                <p className="text-xs font-black text-emerald-700">108</p>
              </div>
            </a>
          </div>
        </div>

        {/* Evacuation Routes */}
        <div className="p-4 space-y-2">
          <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider mb-2">Fast Evacuation Routes</h4>
          {data?.locations?.map((loc: any) => (
            <div
              key={loc.id}
              className="p-3.5 rounded-2xl border border-slate-200 hover:border-red-300 bg-white hover:bg-red-50/50 transition-all flex items-center justify-between shadow-xs"
            >
              <div className="min-w-0 pr-2">
                <h5 className="font-extrabold text-xs text-slate-900 truncate">{loc.name}</h5>
                <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{loc.description}</p>
              </div>
              <button
                onClick={() => {
                  onNavigateToEmergency(loc);
                  onClose();
                }}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black flex items-center space-x-1 shrink-0 shadow-md transition-all active:scale-95"
              >
                <Navigation className="w-3.5 h-3.5 fill-current" />
                <span>Route</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
