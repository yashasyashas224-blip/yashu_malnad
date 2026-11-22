import React, { useState, useEffect } from 'react';
import {
  Volume2,
  VolumeX,
  Navigation,
  X,
  CheckCircle2,
  Accessibility,
  ArrowRight,
  ArrowUp,
  CornerUpRight,
  CornerUpLeft,
  ChevronRight,
  Footprints,
  Compass
} from 'lucide-react';

interface NavigationCardProps {
  route: any;
  destinationName: string;
  routeMode: 'shortest' | 'easiest' | 'accessible';
  onChangeMode: (mode: 'shortest' | 'easiest' | 'accessible') => void;
  onCancel: () => void;
}

export const NavigationCard: React.FC<NavigationCardProps> = ({
  route,
  destinationName,
  routeMode,
  onChangeMode,
  onCancel
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isVoiceMuted, setIsVoiceMuted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);

  const steps = route?.steps || [];
  const currentStep = steps[currentStepIndex] || steps[0];

  // Spoken voice guidance
  useEffect(() => {
    if (!isVoiceMuted && currentStep && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentStep.instruction);
      utterance.rate = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  }, [currentStepIndex, currentStep, isVoiceMuted]);

  const handleNextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setHasArrived(true);
      if (!isVoiceMuted && 'speechSynthesis' in window) {
        window.speechSynthesis.speak(new SpeechSynthesisUtterance('You have arrived at your destination.'));
      }
    }
  };

  const getStepIcon = (instruction: string) => {
    const lower = instruction.toLowerCase();
    if (lower.includes('elevator')) return '🛗';
    if (lower.includes('stair')) return '🪜';
    if (lower.includes('enter') || lower.includes('proceed through')) return '🚪';
    if (lower.includes('turn left')) return '⬅️';
    if (lower.includes('turn right')) return '➡️';
    if (lower.includes('arrived')) return '🏁';
    return '⬆️';
  };

  const progressPercent = steps.length > 1
    ? Math.min(100, Math.round(((currentStepIndex + 1) / steps.length) * 100))
    : 100;

  return (
    <div className="absolute top-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-30 animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel rounded-3xl overflow-hidden border border-white/80 shadow-2xl">
        {/* Navigation Top Banner */}
        <div className="bg-gradient-to-r from-[#07162c] via-[#0f2c59] to-[#1e3a8a] text-white px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-900 flex items-center justify-center font-black text-sm shrink-0 shadow-md">
              <Navigation className="w-4 h-4 fill-current" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Navigating to</p>
              <h3 className="font-extrabold text-sm truncate">{destinationName}</h3>
            </div>
          </div>
          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => setIsVoiceMuted(!isVoiceMuted)}
              className={`p-2 rounded-xl transition-all ${
                isVoiceMuted
                  ? 'bg-red-500/20 text-red-300'
                  : 'bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
              }`}
              title={isVoiceMuted ? 'Turn on voice guidance' : 'Mute voice guidance'}
            >
              {isVoiceMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onCancel}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-all"
              title="Exit Navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5">
          <div
            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Main Guidance Body */}
        <div className="p-5">
          {hasArrived ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-4 border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-3 shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h4 className="font-extrabold text-lg text-slate-900">Destination Reached</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-[240px] mx-auto">{destinationName}</p>
              <button
                onClick={onCancel}
                className="mt-5 w-full py-2.5 bg-[#0f2c59] hover:bg-slate-900 text-white font-bold rounded-2xl text-xs shadow-lg transition-all"
              >
                Complete Navigation
              </button>
            </div>
          ) : (
            <>
              {/* Active Step Hero */}
              <div className="flex items-start space-x-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-2xl flex items-center justify-center shrink-0 shadow-sm">
                  {getStepIcon(currentStep?.instruction || '')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      Step {currentStepIndex + 1} of {steps.length}
                    </span>
                    {isSpeaking && (
                      <span className="flex items-center space-x-1 text-[10px] font-bold text-emerald-600">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                        <span>Speaking</span>
                      </span>
                    )}
                  </div>
                  <h4 className="font-extrabold text-base text-slate-900 mt-1 leading-snug">
                    {currentStep?.instruction}
                  </h4>
                  {currentStep?.landmark && (
                    <p className="text-xs text-amber-700 font-semibold mt-1 flex items-center space-x-1">
                      <span>🏛️</span>
                      <span>{currentStep.landmark}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-100 text-center">
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Distance</span>
                  <span className="font-extrabold text-sm text-slate-800">{currentStep?.distanceMeters || 0} m</span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total</span>
                  <span className="font-extrabold text-sm text-[#0f2c59]">{route?.totalDistanceMeters} m</span>
                </div>
                <div className="bg-slate-50/80 p-2.5 rounded-2xl border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">ETA</span>
                  <span className="font-extrabold text-sm text-emerald-600">~{route?.estimatedWalkingMinutes} min</span>
                </div>
              </div>

              {/* Routing Preferences Selector */}
              <div className="mt-3 flex items-center justify-between bg-slate-100/80 p-1 rounded-2xl text-xs font-bold text-slate-600">
                <button
                  onClick={() => onChangeMode('shortest')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    routeMode === 'shortest'
                      ? 'bg-white text-[#0f2c59] shadow-sm font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Shortest
                </button>
                <button
                  onClick={() => onChangeMode('easiest')}
                  className={`flex-1 py-1.5 rounded-xl transition-all ${
                    routeMode === 'easiest'
                      ? 'bg-white text-[#0f2c59] shadow-sm font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  Easiest
                </button>
                <button
                  onClick={() => onChangeMode('accessible')}
                  className={`flex-1 py-1.5 rounded-xl flex items-center justify-center space-x-1 transition-all ${
                    routeMode === 'accessible'
                      ? 'bg-white text-[#0f2c59] shadow-sm font-extrabold'
                      : 'hover:text-slate-900'
                  }`}
                >
                  <Accessibility className="w-3.5 h-3.5 text-blue-600" />
                  <span>Stair-Free</span>
                </button>
              </div>

              {/* Step Navigation Action Button */}
              <button
                onClick={handleNextStep}
                className="mt-4 w-full py-3 bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] hover:from-[#1d4ed8] hover:to-[#1e40af] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-blue-500/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2"
              >
                <span>{currentStepIndex < steps.length - 1 ? 'Next Instruction' : 'Mark Arrival'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
