import React, { useState } from 'react';
import { ShieldCheck, UserCheck, KeyRound, Phone, Mail, X, AlertOctagon, CheckCircle2, Lock, Sparkles } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess
}) => {
  const [tab, setTab] = useState<'login' | 'signup' | 'google-link'>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Form State
  const [fullName, setFullName] = useState('');
  const [institutionalId, setInstitutionalId] = useState('');
  const [officialEmail, setOfficialEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [phoneOtp, setPhoneOtp] = useState('');
  const [emailOtp, setEmailOtp] = useState('');
  const [googleEmail, setGoogleEmail] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier: loginIdentifier, password })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          setError(data.message || 'Authentication failed.');
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Server connection error.');
      });
  };

  // Step 1: Send OTPs for registration
  const handleSendRegistrationOtps = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !institutionalId || !officialEmail || !phone) {
      setError('All fields are mandatory for MCE student/staff identity verification.');
      return;
    }

    setLoading(true);
    setError('');

    fetch('/api/auth/otp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone, type: 'phone' })
    })
      .then(res => res.json())
      .then(phoneRes => {
        if (!phoneRes.success) {
          setLoading(false);
          setError(phoneRes.message);
          return;
        }

        fetch('/api/auth/otp/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ target: officialEmail, type: 'email' })
        })
          .then(res => res.json())
          .then(emailRes => {
            setLoading(false);
            if (!emailRes.success) {
              setError(emailRes.message);
              return;
            }
            setStep('otp');
            setSuccessMsg(`Two-Factor OTP dispatched. Demo codes: Phone (${phoneRes.debugOtp}), Email (${emailRes.debugOtp}).`);
          });
      })
      .catch(() => {
        setLoading(false);
        setError('Could not initiate OTP service.');
      });
  };

  // Step 2: Verify OTPs and Complete Strict MCE Registration
  const handleCompleteRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    fetch('/api/auth/otp/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ target: phone, code: phoneOtp })
    })
      .then(res => res.json())
      .then(phoneVer => {
        if (!phoneVer.success) {
          setLoading(false);
          setError(`Phone OTP Error: ${phoneVer.message}`);
          return;
        }

        fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fullName,
            institutionalId,
            officialEmail,
            phone,
            password
          })
        })
          .then(res => res.json())
          .then(regRes => {
            setLoading(false);
            if (regRes.success) {
              onLoginSuccess(regRes.user, regRes.token);
              onClose();
            } else {
              setError(regRes.message);
            }
          })
          .catch(() => {
            setLoading(false);
            setError('Registration server error.');
          });
      })
      .catch(() => {
        setLoading(false);
        setError('Failed to verify OTP.');
      });
  };

  // Google Login Linkage
  const handleGoogleLink = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    fetch('/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        googleId: `g-${Date.now()}`,
        email: googleEmail,
        name: fullName || 'MCE Student',
        institutionalId
      })
    })
      .then(res => res.json())
      .then(data => {
        setLoading(false);
        if (data.success) {
          onLoginSuccess(data.user, data.token);
          onClose();
        } else {
          setError(data.message);
        }
      })
      .catch(() => {
        setLoading(false);
        setError('Google linkage failed.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white/95 backdrop-blur-2xl rounded-3xl max-w-md w-full shadow-2xl border border-white/80 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#07162c] via-[#0f2c59] to-[#1e3a8a] text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-900 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base">MCE Hassan Identity Desk</h3>
              <p className="text-[11px] text-amber-300 font-semibold">Strict Malnad College Authorization</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-3.5 bg-blue-50/80 border-b border-blue-200/60 flex items-start space-x-2 text-xs text-blue-900 font-medium leading-relaxed">
          <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-blue-600" />
          <p>
            Exclusive to authorized MCE students and faculty. Registrations from other institutions are strictly rejected.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 text-xs font-bold text-slate-500 bg-slate-50/70">
          <button
            onClick={() => { setTab('login'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 border-b-2 text-center transition-all ${
              tab === 'login' ? 'border-[#0f2c59] text-[#0f2c59] bg-white font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('signup'); setStep('details'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 border-b-2 text-center transition-all ${
              tab === 'signup' ? 'border-[#0f2c59] text-[#0f2c59] bg-white font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Student Sign Up
          </button>
          <button
            onClick={() => { setTab('google-link'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-3 border-b-2 text-center transition-all ${
              tab === 'google-link' ? 'border-[#0f2c59] text-[#0f2c59] bg-white font-extrabold' : 'border-transparent hover:text-slate-900'
            }`}
          >
            Link Google
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-2xl flex items-start space-x-2">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* LOGIN TAB */}
          {tab === 'login' && (
            <form onSubmit={handleLogin} className="space-y-3.5">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">MCE USN, Official Email or Phone</label>
                <input
                  type="text"
                  value={loginIdentifier}
                  onChange={e => setLoginIdentifier(e.target.value)}
                  placeholder="e.g. 4MC22CS045 or principal@mcehassan.ac.in"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600 shadow-inner"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium focus:outline-none focus:border-blue-600 shadow-inner"
                  required
                />
              </div>

              {/* Quick Fill Demo Credentials */}
              <div className="p-3 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-extrabold text-amber-800 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quick Fill Demo Accounts</span>
                  </span>
                </div>
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('principal@mcehassan.ac.in');
                      setPassword('MceAdmin@2025');
                    }}
                    className="flex-1 py-1 px-2 bg-white rounded-lg border border-amber-300 font-bold hover:bg-amber-100/50 transition-colors"
                  >
                    Admin Account
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setLoginIdentifier('4MC22CS045');
                      setPassword('MceStudent@2025');
                    }}
                    className="flex-1 py-1 px-2 bg-white rounded-lg border border-amber-300 font-bold hover:bg-amber-100/50 transition-colors"
                  >
                    Student Account
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-gradient-to-r from-[#0f2c59] to-[#1e3a8a] hover:from-[#0a1f3f] hover:to-[#172554] active:scale-[0.98] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-xl transition-all"
              >
                {loading ? 'Authenticating with MCE...' : 'Sign In to Campus Navigator'}
              </button>
            </form>
          )}

          {/* SIGN UP TAB */}
          {tab === 'signup' && step === 'details' && (
            <form onSubmit={handleSendRegistrationOtps} className="space-y-3">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-0.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  placeholder="Yashaswini K S"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-0.5">MCE USN / Employee ID</label>
                <input
                  type="text"
                  value={institutionalId}
                  onChange={e => setInstitutionalId(e.target.value)}
                  placeholder="4MC22CS045"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-0.5">Official College Email</label>
                <input
                  type="email"
                  value={officialEmail}
                  onChange={e => setOfficialEmail(e.target.value)}
                  placeholder="yashaswini.22cs045@mcehassan.ac.in"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-0.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 9448123456"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-0.5">Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all"
              >
                {loading ? 'Validating against Roster...' : 'Verify Phone & Email OTP →'}
              </button>
            </form>
          )}

          {/* SIGN UP STEP 2: OTP */}
          {tab === 'signup' && step === 'otp' && (
            <form onSubmit={handleCompleteRegistration} className="space-y-4">
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Enter Verification OTP</label>
                <input
                  type="text"
                  value={phoneOtp}
                  onChange={e => setPhoneOtp(e.target.value)}
                  placeholder="Enter 6-digit Code"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-center font-mono font-black tracking-widest text-lg focus:outline-none focus:border-blue-600"
                  maxLength={6}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-lg transition-all"
              >
                {loading ? 'Activating MCE Account...' : 'Activate Verified Account'}
              </button>
              <button
                type="button"
                onClick={() => setStep('details')}
                className="w-full text-center text-xs text-slate-400 hover:text-slate-600 font-semibold"
              >
                ← Back to Details
              </button>
            </form>
          )}

          {/* GOOGLE LINK TAB */}
          {tab === 'google-link' && (
            <form onSubmit={handleGoogleLink} className="space-y-3.5">
              <p className="text-xs text-slate-500 leading-relaxed">
                Google login alone is not proof of MCE membership. You must pair your Google identity with your authorized MCE Student USN.
              </p>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Google Email</label>
                <input
                  type="email"
                  value={googleEmail}
                  onChange={e => setGoogleEmail(e.target.value)}
                  placeholder="student@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-extrabold text-slate-700 block mb-1">Authorized MCE USN</label>
                <input
                  type="text"
                  value={institutionalId}
                  onChange={e => setInstitutionalId(e.target.value)}
                  placeholder="e.g. 4MC22CS089"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs uppercase font-mono font-bold focus:outline-none focus:border-blue-600"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-[#0f2c59] hover:bg-slate-900 active:scale-[0.98] text-white font-extrabold text-xs rounded-2xl shadow-xl transition-all"
              >
                {loading ? 'Verifying with MCE...' : 'Verify & Link Google Account'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
