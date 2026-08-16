import React, { useState } from 'react';
import { AppSettings } from '../types';
import { signInWithGoogle, logoutUser } from '../firebase/config';
import { 
  ShieldCheck, 
  Lock, 
  Key, 
  Building2, 
  FileSignature, 
  AlertCircle, 
  Eye, 
  EyeOff,
  ArrowRight,
  Sparkles,
  HelpCircle,
  Cloud
} from 'lucide-react';

interface LockScreenProps {
  settings: AppSettings;
  onAuthenticate: () => void;
  onUpdateSettings: (newSettings: AppSettings) => void;
  onGoogleSignInSuccess?: (user: any) => void;
}

export const LockScreen: React.FC<LockScreenProps> = ({
  settings,
  onAuthenticate,
  onUpdateSettings,
  onGoogleSignInSuccess,
}) => {
  const [passkeyInput, setPasskeyInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSignRecovery, setShowSignRecovery] = useState(false);
  const [recoverySignInput, setRecoverySignInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingAfterSign, setIsResettingAfterSign] = useState(false);
  const [newPasskey, setNewPasskey] = useState('');
  const [confirmPasskey, setConfirmPasskey] = useState('');
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handlePasskeySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    const input = passkeyInput.trim();
    const currentKey = (settings.passkey || '').trim();

    // Strict validation: Only match the current active passkey
    if (currentKey && (input === currentKey || input.toUpperCase() === currentKey.toUpperCase())) {
      onAuthenticate();
    } else if (!currentKey && input.toUpperCase() === 'MOSHA') {
      // Fallback only if no passkey exists in settings
      onAuthenticate();
    } else {
      setErrorMsg('Passkey uliyoweka sio sahihi. Tafadhali weka nenosiri lako sahihi au tumia Sign ya Uokozi.');
      setPasskeyInput('');
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setErrorMsg('');
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        // Check if there is an authorized Google account bound
        if (settings.authorizedGoogleEmail && settings.authorizedGoogleEmail.trim() !== '') {
          if (user.email.toLowerCase() !== settings.authorizedGoogleEmail.toLowerCase()) {
            await logoutUser();
            setErrorMsg(
              `Akaunti hii ya Google (${user.email}) hairuhusiwi! Ofisi hii imefungwa moja kwa moja kwa akaunti rasmi ya: ${settings.authorizedGoogleEmail}.`
            );
            return;
          }
        } else {
          // First Google login - bind this account as the permanent official Google Account
          const updated = {
            ...settings,
            authorizedGoogleEmail: user.email,
          };
          onUpdateSettings(updated);
        }

        if (onGoogleSignInSuccess) {
          onGoogleSignInSuccess(user);
        }
        onAuthenticate();
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Haikuweza kuingia na Google. Tafadhali tumia Passkey yako au jaribu tena.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleRecoverySignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (
      recoverySignInput.trim().toLowerCase() ===
      settings.securitySign.trim().toLowerCase()
    ) {
      setIsResettingAfterSign(true);
    } else {
      setErrorMsg('Sahihi (Sign) ya uokozi sio sahihi. Tafadhali hakiki herufi zako.');
    }
  };

  const handleSaveNewPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPasskey.length < 4) {
      setErrorMsg('Passkey lazima iwe na angalau nambari au herufi 4.');
      return;
    }
    if (newPasskey !== confirmPasskey) {
      setErrorMsg('Passkey mpya hazilingani. Hakiki tena.');
      return;
    }

    const updated = {
      ...settings,
      passkey: newPasskey.trim(),
    };
    onUpdateSettings(updated);
    setIsResettingAfterSign(false);
    setShowSignRecovery(false);
    setRecoverySignInput('');
    setNewPasskey('');
    setConfirmPasskey('');
    onAuthenticate();
  };

  // Numpad helper
  const handleKeypadPress = (val: string) => {
    if (passkeyInput.length < 12) {
      setPasskeyInput((prev) => prev + val);
    }
  };

  const handleKeypadDelete = () => {
    setPasskeyInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="min-h-screen w-full bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl p-6 sm:p-8 text-white relative z-10">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-lg flex items-center justify-center mb-3">
            {settings.logoUrl ? (
              <img
                src={settings.logoUrl}
                alt="Logo"
                className="w-full h-full object-contain rounded-2xl bg-slate-950 p-1"
              />
            ) : (
              <div className="w-full h-full bg-slate-950 rounded-2xl flex items-center justify-center text-amber-400">
                <Building2 className="w-8 h-8" />
              </div>
            )}
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight uppercase bg-gradient-to-r from-white via-slate-100 to-amber-300 bg-clip-text text-transparent">
            {settings.companyName || 'MOSHA FOUNDATION BANK'}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Lango Salama la Ofisi (Office Secure Portal)
          </p>
        </div>

        {/* Error Notification */}
        {errorMsg && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center space-x-2 animate-shake">
            <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* View 1: Standard Passkey Login */}
        {!showSignRecovery && !isResettingAfterSign && (
          <div>
            <form onSubmit={handlePasskeySubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Weka Passkey ya Ofisi:
                </label>

                <div className="relative">
                  <input
                    id="input-passkey"
                    type={showPassword ? 'text' : 'password'}
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    placeholder="Weka passkey ya ofisi..."
                    autoFocus
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-center text-lg font-mono uppercase tracking-widest text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Interactive Virtual Numpad */}
              <div className="grid grid-cols-3 gap-2 pt-2">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleKeypadPress(num)}
                    className="py-3 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-lg font-mono font-bold text-slate-100 transition shadow-sm border border-slate-800"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPasskeyInput('')}
                  className="py-3 bg-slate-800/40 hover:bg-slate-800 text-xs font-semibold text-slate-400 rounded-xl transition border border-slate-800"
                >
                  Futa Yote
                </button>
                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="py-3 bg-slate-800/80 hover:bg-slate-700 active:bg-slate-600 rounded-xl text-lg font-mono font-bold text-slate-100 transition shadow-sm border border-slate-800"
                >
                  0
                </button>
                <button
                  type="button"
                  onClick={handleKeypadDelete}
                  className="py-3 bg-slate-800/40 hover:bg-slate-800 text-xs font-semibold text-slate-400 rounded-xl transition border border-slate-800"
                >
                  ⌫ Nyuma
                </button>
              </div>

              <button
                id="btn-unlock-office"
                type="submit"
                className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-sm sm:text-base rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
              >
                <Lock className="w-4 h-4" />
                <span>Fungua Mfumo wa Ofisi</span>
              </button>
            </form>

            {/* Google Firebase Sign In Option */}
            <div className="mt-4 pt-4 border-t border-slate-800">
              {settings.authorizedGoogleEmail && (
                <div className="mb-2 text-center text-[11px] text-slate-400">
                  Akaunti Rasmi ya Google:{' '}
                  <span className="text-amber-300 font-mono font-medium">
                    {settings.authorizedGoogleEmail}
                  </span>
                </div>
              )}
              <button
                id="btn-google-login-lockscreen"
                type="button"
                disabled={isGoogleLoading}
                onClick={handleGoogleLogin}
                className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs sm:text-sm rounded-xl border border-slate-700 transition flex items-center justify-center space-x-2.5 shadow"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#EA4335"
                    d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.4 1 3.5 3.6 1.6 7.4l3.7 2.9C6.2 7.4 8.9 5 12 5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.6h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.9z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.3 14.7c-.2-.7-.4-1.5-.4-2.4s.2-1.7.4-2.4L1.6 7.4C.6 9.4 0 11.6 0 14s.6 4.6 1.6 6.6l3.7-2.9z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3.1 0-5.8-2.4-6.7-5.3L1.6 15.9C3.5 19.7 7.4 23 12 23z"
                  />
                </svg>
                <span>
                  {isGoogleLoading
                    ? 'Inaunganisha na Google...'
                    : settings.authorizedGoogleEmail
                    ? 'Ingia na Google (Akaunti Rasmi)'
                    : 'Ingia na Google (Hifadhi ya Moja kwa Moja)'}
                </span>
              </button>
            </div>

            <div className="mt-4 text-center">
              <button
                id="btn-forgot-passkey"
                type="button"
                onClick={() => {
                  setShowSignRecovery(true);
                  setErrorMsg('');
                }}
                className="text-xs text-amber-400/90 hover:text-amber-300 hover:underline flex items-center justify-center space-x-1.5 mx-auto"
              >
                <FileSignature className="w-4 h-4" />
                <span>Umesahau Passkey? Ingia kwa Sign ya Uokozi</span>
              </button>
            </div>
          </div>
        )}

        {/* View 2: Recovery via Security Sign */}
        {showSignRecovery && !isResettingAfterSign && (
          <form onSubmit={handleRecoverySignSubmit} className="space-y-4">
            <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-xl text-xs text-indigo-200 flex items-start space-x-2.5">
              <FileSignature className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Uokozi kwa Sahihi (Security Sign):</span>
                <span>
                  Weka Sign au Neno la Ulinzi lililowekwa wakati wa usajili wa ofisi ili kufungua na kuweka Passkey mpya.
                </span>
                {settings.securitySign === 'MOSHA-SIGN-2026' && (
                  <span className="block mt-1 font-mono text-[11px] text-amber-300">
                    Sign ya Awali: MOSHA-SIGN-2026
                  </span>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Weka Sahihi ya Uokozi (Sign):
              </label>
              <input
                id="input-recovery-sign"
                type="text"
                value={recoverySignInput}
                onChange={(e) => setRecoverySignInput(e.target.value)}
                placeholder="Weka Sahihi ya Uokozi (Sign)..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 transition"
              />
            </div>

            <button
              id="btn-verify-sign"
              type="submit"
              className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Thibitisha Sign & Fungua</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowSignRecovery(false);
                setErrorMsg('');
              }}
              className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              ← Rudi Kwenye Passkey
            </button>
          </form>
        )}

        {/* View 3: Reset Passkey after successful Sign */}
        {isResettingAfterSign && (
          <form onSubmit={handleSaveNewPasskey} className="space-y-4">
            <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-xs text-emerald-200 flex items-start space-x-2">
              <Sparkles className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-bold block">Sign Imethibitishwa Kikamilifu!</span>
                <span>Weka Passkey mpya ya ofisi utakayotumia kuanzia sasa.</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Passkey Mpya:
              </label>
              <input
                id="input-new-passkey"
                type="password"
                value={newPasskey}
                onChange={(e) => setNewPasskey(e.target.value)}
                placeholder="Angalau tarakimu 4..."
                autoFocus
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Rudia Passkey Mpya:
              </label>
              <input
                id="input-confirm-passkey"
                type="password"
                value={confirmPasskey}
                onChange={(e) => setConfirmPasskey(e.target.value)}
                placeholder="Rudia passkey mpya..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-white text-sm font-mono focus:outline-none focus:border-emerald-400"
              />
            </div>

            <button
              id="btn-save-new-passkey"
              type="submit"
              className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition shadow-lg flex items-center justify-center space-x-2"
            >
              <Key className="w-4 h-4" />
              <span>Hifadhi Passkey Mpya & Ingia Ndani</span>
            </button>
          </form>
        )}

        {/* Security Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center space-x-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Mfumo Salama wa Kibenki</span>
          </div>
          <div className="flex items-center space-x-1 text-indigo-400">
            <Cloud className="w-3.5 h-3.5" />
            <span>Firestore Cloud</span>
          </div>
        </div>
      </div>
    </div>
  );
};

