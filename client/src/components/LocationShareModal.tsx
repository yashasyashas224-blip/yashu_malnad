import React, { useState } from 'react';
import { Share2, Clock, Check, X, ShieldAlert } from 'lucide-react';

interface LocationShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLocation: [number, number];
  token?: string;
}

export const LocationShareModal: React.FC<LocationShareModalProps> = ({
  isOpen,
  onClose,
  userLocation,
  token
}) => {
  const [duration, setDuration] = useState(30);
  const [description, setDescription] = useState('Meeting near Central Library');
  const [shareLink, setShareLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCreateShare = () => {
    setLoading(true);
    fetch('/api/share/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: JSON.stringify({
        coordinates: userLocation,
        locationDescription: description,
        durationMinutes: duration
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          const fullUrl = `${window.location.origin}${data.shareUrl}`;
          setShareLink(fullUrl);
        }
      })
      .catch(() => setLoading(false));
  };

  const handleCopy = () => {
    if (shareLink) {
      navigator.clipboard.writeText(shareLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-[#0f2c59] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Share2 className="w-6 h-6 text-[#c59b27]" />
            <div>
              <h3 className="font-bold text-base">Share Campus Location</h3>
              <p className="text-xs text-slate-300">Time-Limited & Explicit Consent</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-900 flex items-start space-x-2">
            <ShieldAlert className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <p>
              Only friends with this secure link can view your campus pin. The link automatically expires after the selected duration.
            </p>
          </div>

          {!shareLink ? (
            <>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Spot Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder="e.g. Near Canteen, Library stairs..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Duration</label>
                <div className="grid grid-cols-3 gap-2">
                  {[15, 30, 60].map(m => (
                    <button
                      key={m}
                      onClick={() => setDuration(m)}
                      className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                        duration === m
                          ? 'bg-[#0f2c59] text-white border-[#0f2c59] shadow-sm'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {m} Minutes
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleCreateShare}
                disabled={loading}
                className="w-full py-2.5 bg-[#2563eb] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition-all active:scale-98"
              >
                {loading ? 'Generating Secure Session...' : 'Create Share Link'}
              </button>
            </>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-700 block">Your Private Share Link:</label>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-700 break-all select-all">
                {shareLink}
              </div>
              <button
                onClick={handleCopy}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-all flex items-center justify-center space-x-1.5"
              >
                {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
                <span>{copied ? 'Link Copied to Clipboard!' : 'Copy Share Link'}</span>
              </button>
              <button
                onClick={() => setShareLink('')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600"
              >
                Create Another Link
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
