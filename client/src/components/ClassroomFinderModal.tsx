import React, { useState, useEffect } from 'react';
import { Calendar, Clock, MapPin, Navigation, X, BookOpen, AlertCircle, Sparkles } from 'lucide-react';

interface ClassroomFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToRoom: (roomData: any) => void;
  token?: string;
}

export const ClassroomFinderModal: React.FC<ClassroomFinderModalProps> = ({
  isOpen,
  onClose,
  onNavigateToRoom,
  token
}) => {
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);

    fetch('/api/timetable/my', {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          setScheduleData(data);
        }
      })
      .catch(() => setLoading(false));
  }, [isOpen, token]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-lg w-full max-h-[85vh] flex flex-col shadow-2xl border border-white/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07162c] via-[#0f2c59] to-[#1e3a8a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400 text-teal-300 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Classroom Finder & Timetable</h3>
              <p className="text-[11px] text-slate-300">Semester 6 • Computer Science & Engineering</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Next Class Hero Banner */}
          {scheduleData?.nextClass && (
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 p-5 shadow-sm">
              <div className="flex items-center justify-between text-xs font-extrabold text-blue-900 uppercase tracking-wider mb-2">
                <span className="flex items-center space-x-1.5 text-blue-700">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Next Upcoming Lecture</span>
                </span>
                <span className="flex items-center space-x-1 text-emerald-800 bg-emerald-100/80 px-2.5 py-0.5 rounded-full font-mono text-[11px] font-bold">
                  <Clock className="w-3 h-3" />
                  <span>{scheduleData.nextClass.startTime} - {scheduleData.nextClass.endTime}</span>
                </span>
              </div>
              <h4 className="font-extrabold text-base text-slate-900 mt-1">
                {scheduleData.nextClass.subjectName}
              </h4>
              <p className="text-xs font-mono font-bold text-slate-500 mt-0.5">
                Course Code: {scheduleData.nextClass.subjectCode} • {scheduleData.nextClass.facultyName}
              </p>
              <div className="mt-3 flex items-center space-x-2 text-xs text-slate-600 bg-white/80 p-2 rounded-xl border border-white">
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="font-bold text-slate-800">{scheduleData.nextClass.roomName}</span>
                <span>• Floor {scheduleData.nextClass.floor} ({scheduleData.nextClass.buildingName})</span>
              </div>
              <button
                onClick={() => {
                  onNavigateToRoom(scheduleData.nextClass);
                  onClose();
                }}
                className="mt-4 w-full py-3 bg-[#0f2c59] hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-slate-900/10 flex items-center justify-center space-x-2 transition-all"
              >
                <Navigation className="w-4 h-4 text-amber-400" />
                <span>Navigate Directly to Classroom</span>
              </button>
            </div>
          )}

          {/* Day Schedule */}
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h4 className="font-extrabold text-sm text-slate-900">
                Today's Schedule ({scheduleData?.day || 'Monday'})
              </h4>
              <span className="text-[11px] font-bold text-slate-400">Section A</span>
            </div>

            {loading ? (
              <div className="py-8 text-center text-xs text-slate-400 font-medium">
                Loading schedule...
              </div>
            ) : (
              <div className="space-y-2">
                {scheduleData?.schedule?.map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl border border-slate-100 bg-slate-50/80 hover:bg-blue-50/70 hover:border-blue-200 transition-all flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono font-extrabold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                          {item.startTime} - {item.endTime}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400">{item.subjectCode}</span>
                      </div>
                      <h5 className="font-extrabold text-xs text-slate-900 mt-1">{item.subjectName}</h5>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.facultyName} • {item.roomName}</p>
                    </div>
                    <button
                      onClick={() => {
                        onNavigateToRoom(item);
                        onClose();
                      }}
                      className="px-3 py-1.5 bg-white border border-slate-200 hover:border-blue-500 text-[#0f2c59] hover:bg-[#0f2c59] hover:text-white rounded-xl text-xs font-bold shadow-xs transition-colors shrink-0 ml-2"
                    >
                      Route
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
