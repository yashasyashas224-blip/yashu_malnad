import React, { useState } from 'react';
import { QrCode, X, Check, MapPin, AlertCircle, ArrowRight, Scan, ShieldCheck } from 'lucide-react';

interface IndoorQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckpointDetected: (checkpointData: any) => void;
}

export const IndoorQRModal: React.FC<IndoorQRModalProps> = ({
  isOpen,
  onClose,
  onCheckpointDetected
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const sampleCheckpoints = [
    { code: 'MCE-CHK-CSIS-2F', name: 'CS-IS Complex - Floor 2 (AI & ML Lab)', floor: 2, icon: '💻' },
    { code: 'MCE-CHK-CSIS-GF', name: 'CS-IS Complex - Ground Floor Foyer', floor: 0, icon: '🏢' },
    { code: 'MCE-CHK-ADM-1F', name: 'Admin Block - Floor 1 (Autonomous Exam Cell)', floor: 1, icon: '🏛️' },
    { code: 'MCE-CHK-LIB-GF', name: 'Central Library - Circulation Desk', floor: 0, icon: '📚' },
    { code: 'MCE-CHK-GATE-01', name: 'Salagame Road Main Gate Security Post', floor: 0, icon: '🚪' }
  ];

  const handleScanOrSubmit = (codeToScan: string) => {
    setLoading(true);
    setError('');

    fetch('/api/navigation/qr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: codeToScan })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          onCheckpointDetected(data);
          onClose();
        } else {
          setError(data.message || 'Invalid QR checkpoint code.');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Failed to resolve checkpoint.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-2xl border border-white/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07162c] via-[#0f2c59] to-[#1e3a8a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/30 border border-indigo-400 text-indigo-300 flex items-center justify-center">
              <Scan className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">Indoor QR Checkpoint</h3>
              <p className="text-[11px] text-slate-300">Precise Multi-Floor Positioning</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Indoor Technology Notice */}
        <div className="p-4 bg-amber-50/80 border-b border-amber-200/60 flex items-start space-x-2.5 text-xs text-amber-900 leading-relaxed">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
          <p>
            Satellite GPS cannot penetrate multi-story reinforced concrete slabs. MCE physical QR markers mounted on doorway frames and landings calibrate floor and corridor coordinates with 100% accuracy.
          </p>
        </div>

        {/* Viewfinder Simulation Area */}
        <div className="p-5">
          <div className="relative border-2 border-indigo-500/50 rounded-3xl p-6 text-center bg-slate-950 text-white overflow-hidden shadow-inner mb-4">
            {/* Viewfinder Neon Corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-indigo-400" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-indigo-400" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-indigo-400" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-indigo-400" />

            {/* Laser Sweep */}
            <div className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-laser shadow-[0_0_10px_#22d3ee]" />

            <QrCode className="w-16 h-16 text-indigo-400/80 mx-auto my-2 animate-pulse" />
            <p className="text-xs font-bold text-slate-200 tracking-wide uppercase">Point Camera at Checkpoint</p>
            <p className="text-[11px] text-slate-400 mt-1">Mounted on MCE corridor pillars & stairwells</p>
          </div>

          {/* Quick Select Checkpoints for Demo / Simulation */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-1">
              Simulate Active Campus Checkpoint:
            </span>
            {sampleCheckpoints.map(cp => (
              <button
                key={cp.code}
                onClick={() => handleScanOrSubmit(cp.code)}
                disabled={loading}
                className="w-full text-left p-2.5 rounded-2xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/60 transition-all flex items-center justify-between text-xs group active:scale-[0.99]"
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <span className="text-base">{cp.icon}</span>
                  <div className="min-w-0">
                    <span className="font-extrabold text-slate-900 block truncate group-hover:text-indigo-600 transition-colors">
                      {cp.name}
                    </span>
                    <span className="text-slate-400 font-mono text-[10px]">{cp.code}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-1 shrink-0 text-slate-400 group-hover:text-indigo-600">
                  <span className="text-[10px] font-bold">Floor {cp.floor}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>

          {error && (
            <p className="mt-3 text-xs text-red-600 font-bold text-center bg-red-50 p-2 rounded-xl border border-red-200">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
