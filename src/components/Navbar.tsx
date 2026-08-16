import React from 'react';
import { AppSettings, Loan } from '../types';
import { 
  Building2, 
  Lock, 
  Settings, 
  Wallet, 
  FileText, 
  Receipt, 
  ShieldCheck,
  Plus,
  HelpCircle,
  Cloud,
  CloudCheck,
  LogOut,
  User as UserIcon
} from 'lucide-react';
import { User } from 'firebase/auth';

interface NavbarProps {
  activeTab: 'loans' | 'expenses' | 'vault';
  setActiveTab: (tab: 'loans' | 'expenses' | 'vault') => void;
  settings: AppSettings;
  loans: Loan[];
  currentUser: User | null;
  onLock: () => void;
  onOpenSettings: () => void;
  onGoogleSignIn: () => void;
  onGoogleSignOut: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  settings,
  loans,
  currentUser,
  onLock,
  onOpenSettings,
  onGoogleSignIn,
  onGoogleSignOut,
}) => {
  const activeLoansCount = loans.filter((l) => l.balanceRemaining > 0).length;

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logo & Brand Name */}
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 p-0.5 shadow-md flex items-center justify-center shrink-0">
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt={settings.companyName}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-contain rounded-xl bg-slate-950 p-0.5"
                />
              ) : (
                <div className="w-full h-full bg-slate-950 rounded-xl flex items-center justify-center text-amber-400">
                  <Building2 className="w-6 h-6" />
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-sm sm:text-lg font-black tracking-tight uppercase text-white truncate max-w-[200px] sm:max-w-none">
                  {settings.companyName || 'MOSHA FOUNDATION BANK'}
                </h1>
                <span className="hidden sm:inline-flex items-center px-2 py-0.5 bg-amber-400/10 text-amber-400 border border-amber-400/20 text-[10px] font-bold rounded-full">
                  Portal Rasmi
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:flex items-center space-x-2">
                <span>{settings.tagline || 'Hifadhi ya Fedha, Madeni & Matumizi'}</span>
                {currentUser && (
                  <span className="text-emerald-400 flex items-center space-x-1 text-[10px]">
                    <span>•</span>
                    <Cloud className="w-3 h-3" />
                    <span>Firestore Imeunganishwa</span>
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Navigation Tabs (Desktop) */}
          <nav className="hidden md:flex items-center space-x-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              id="nav-tab-loans"
              type="button"
              onClick={() => setActiveTab('loans')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'loans'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Madeni & Mikopo</span>
              {activeLoansCount > 0 && (
                <span className="px-1.5 py-0.2 bg-amber-400 text-slate-950 text-[10px] font-bold rounded-full">
                  {activeLoansCount}
                </span>
              )}
            </button>

            <button
              id="nav-tab-expenses"
              type="button"
              onClick={() => setActiveTab('expenses')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                activeTab === 'expenses'
                  ? 'bg-amber-600 text-white shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Receipt className="w-4 h-4" />
              <span>Matumizi ya Ofisi</span>
            </button>
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2">
            {/* Google User or Connect Button */}
            {currentUser ? (
              <div className="hidden sm:flex items-center space-x-2 bg-slate-800/80 px-2.5 py-1.5 rounded-xl border border-slate-700 text-xs">
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-5 h-5 rounded-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-4 h-4 text-emerald-400" />
                )}
                <span className="text-slate-300 font-medium max-w-[100px] truncate text-[11px]">
                  {currentUser.displayName || currentUser.email?.split('@')[0]}
                </span>
                <button
                  type="button"
                  onClick={onGoogleSignOut}
                  className="text-slate-400 hover:text-red-400 p-0.5 ml-1 transition"
                  title="Ondoka Google"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                id="btn-nav-google-connect"
                type="button"
                onClick={onGoogleSignIn}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-200 text-xs font-semibold rounded-xl border border-indigo-500/30 transition shadow-sm"
                title="Unganisha na Google kwa Hifadhi ya Cloud"
              >
                <Cloud className="w-3.5 h-3.5 text-indigo-400" />
                <span>Unganisha Cloud</span>
              </button>
            )}

            <button
              id="btn-nav-settings"
              type="button"
              onClick={onOpenSettings}
              className="p-2 sm:px-3 sm:py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition flex items-center space-x-1.5 shadow-sm"
              title="Mipangilio & Ulinzi"
            >
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Mipangilio</span>
            </button>

            <button
              id="btn-nav-lock"
              type="button"
              onClick={onLock}
              className="p-2 sm:px-3 sm:py-2 bg-red-950/40 hover:bg-red-900/60 text-red-300 text-xs font-semibold rounded-xl border border-red-500/30 transition flex items-center space-x-1.5"
              title="Funga Lango la Ofisi (Lock)"
            >
              <Lock className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Funga Ofisi</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Tabs (Sub-bar) */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('loans')}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg ${
              activeTab === 'loans' ? 'bg-indigo-600 text-white' : 'text-slate-400'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Madeni ({activeLoansCount})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center space-x-1.5 py-1.5 px-3 rounded-lg ${
              activeTab === 'expenses' ? 'bg-amber-600 text-white' : 'text-slate-400'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Matumizi</span>
          </button>
        </div>
      </div>
    </header>
  );
};
