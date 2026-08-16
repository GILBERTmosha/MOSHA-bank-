import React, { useState } from 'react';
import { AccountBalances, Loan, AppSettings } from '../types';
import { formatCurrency } from '../services/notificationService';
import { 
  PiggyBank, 
  Wallet, 
  Receipt, 
  TrendingUp, 
  Eye, 
  EyeOff, 
  ShieldCheck, 
  ArrowRightLeft,
  CircleDollarSign,
  ArrowDownRight,
  ArrowUpRight,
  Landmark,
  BadgeAlert
} from 'lucide-react';

interface FinancialSummaryProps {
  balances: AccountBalances;
  loans: Loan[];
  settings: AppSettings;
  onOpenFundModal: () => void;
}

export const FinancialSummary: React.FC<FinancialSummaryProps> = ({
  balances,
  loans,
  settings,
  onOpenFundModal,
}) => {
  const [hideBalances, setHideBalances] = useState(settings.hideBalancesByDefault || false);
  const [showPasskeyPrompt, setShowPasskeyPrompt] = useState(false);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [passkeyError, setPasskeyError] = useState(false);

  // 1. Total Cash in Hand / Liquid Capital (Fedha Taslimu Mfukoni / Benki) - NOT mixed with debt
  const totalCashInPockets =
    (balances.mamaEla || 0) +
    (balances.elaYangu || 0) +
    (balances.elaYaMatumizi || 0);

  // 2. Total Outstanding Loans (Madeni Yaliyopo Nje kwa Wateja) - Kept strictly independent
  const totalOutstandingLoans = loans.reduce((sum, loan) => sum + (loan.balanceRemaining || 0), 0);
  
  // Total Money Disbursed Out to Borrowers (Jumla ya Fedha Zilizotolewa Kukopesha)
  const totalPrincipalGiven = loans.reduce((sum, loan) => sum + (loan.principalAmount || 0), 0);

  // Total Money Collected In from Repayments (Jumla ya Fedha Zilizorudishwa / Kuingia)
  const totalCollectedRepayments = loans.reduce((sum, loan) => sum + (loan.amountPaid || 0), 0);

  // Total Fees/Profit expected from loans
  const totalFeesExpected = loans.reduce((sum, loan) => sum + (loan.feeAmount || 0), 0);

  // Active loans count
  const activeLoansCount = loans.filter((l) => l.balanceRemaining > 0).length;

  const toggleHide = () => {
    if (hideBalances) {
      setShowPasskeyPrompt(true);
    } else {
      setHideBalances(true);
    }
  };

  const handleRevealPasskey = (e: React.FormEvent) => {
    e.preventDefault();
    const activeKey = (settings.passkey || 'MOSHA').trim();
    if (passkeyInput.trim() === activeKey || passkeyInput.trim().toUpperCase() === activeKey.toUpperCase()) {
      setHideBalances(false);
      setShowPasskeyPrompt(false);
      setPasskeyInput('');
      setPasskeyError(false);
    } else {
      setPasskeyError(true);
    }
  };

  const renderAmount = (amount: number, customClass: string = '') => {
    if (hideBalances) {
      return <span className="font-mono tracking-wider select-none">••••••••</span>;
    }
    return <span className={`font-mono font-bold ${customClass}`}>{formatCurrency(amount, settings.currency)}</span>;
  };

  return (
    <div className="space-y-4">
      {/* Top Banner: Split Fedha Mkononi vs Madeni Nje */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-2xl shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Main Financial Split Display */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 flex-1">
            {/* Box 1: Fedha Taslimu Zilizopo (Cash Available) */}
            <div className="p-4 bg-slate-950/60 border border-emerald-500/30 rounded-2xl">
              <div className="flex items-center space-x-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <Landmark className="w-4 h-4" />
                <span>1. Fedha Taslimu Zilizopo (Mkononi / Benki)</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline space-x-2 mt-1">
                {renderAmount(totalCashInPockets, 'text-emerald-300')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Mtaji halisi uliopo tayari (Mama Ela + Ela Yangu + Matumizi).
              </p>
            </div>

            {/* Box 2: Madeni Yaliyo Nje (Outstanding Debt Receivable) */}
            <div className="p-4 bg-slate-950/60 border border-amber-500/30 rounded-2xl">
              <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">
                <BadgeAlert className="w-4 h-4" />
                <span>2. Madeni Yaliyopo Nje (Wateja Wanadaiwa)</span>
              </div>
              <div className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-baseline space-x-2 mt-1">
                {renderAmount(totalOutstandingLoans, 'text-amber-300')}
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                Madeni {activeLoansCount} ya wateja yanayosubiri kurejeshwa (Haitachanganywa na fedha taslimu).
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap lg:flex-col items-stretch justify-center gap-2.5 shrink-0">
            <button
              id="btn-toggle-balance-privacy"
              type="button"
              onClick={toggleHide}
              className="flex items-center justify-center space-x-1.5 px-4 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition"
              title={hideBalances ? 'Onyesha Salio' : 'Ficha Salio kwa Ulinzi'}
            >
              {hideBalances ? <Eye className="w-4 h-4 text-emerald-400" /> : <EyeOff className="w-4 h-4 text-slate-400" />}
              <span>{hideBalances ? 'Onyesha Salio' : 'Ficha Salio'}</span>
            </button>

            <button
              id="btn-open-fund-modal"
              type="button"
              onClick={onOpenFundModal}
              className="flex items-center justify-center space-x-1.5 px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs sm:text-sm font-bold rounded-xl shadow transition"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Weka / Hamisha Fedha</span>
            </button>
          </div>
        </div>

        {/* Real-Time Money Flow Bar (Ela Iliyotoka vs Ela Iliyoingia) */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs relative z-10">
          <div className="flex items-center space-x-2.5 bg-red-950/40 border border-red-500/20 px-3.5 py-2 rounded-xl text-red-200">
            <ArrowUpRight className="w-4 h-4 text-red-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jumla Iliyotolewa Kukopesha (Pesa Iliyotoka):</span>
              <span className="font-bold font-mono text-red-300">{renderAmount(totalPrincipalGiven)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2.5 bg-emerald-950/40 border border-emerald-500/20 px-3.5 py-2 rounded-xl text-emerald-200">
            <ArrowDownRight className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Jumla ya Marejesho Yaliyoingia (Pesa Iliyorudi):</span>
              <span className="font-bold font-mono text-emerald-300">{renderAmount(totalCollectedRepayments)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Password Prompt Modal for revealing balances */}
      {showPasskeyPrompt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-white rounded-2xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center space-x-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Weka Passkey Kufungua Salio</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Ili kulinda taarifa za kibenki, weka passkey yako ya ofisi:
            </p>

            <form onSubmit={handleRevealPasskey} className="space-y-3">
              <input
                id="input-reveal-passkey"
                type="password"
                value={passkeyInput}
                onChange={(e) => {
                  setPasskeyInput(e.target.value);
                  setPasskeyError(false);
                }}
                placeholder="Weka passkey..."
                autoFocus
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-center font-mono text-base focus:outline-none focus:border-amber-500"
              />

              {passkeyError && (
                <p className="text-xs text-red-600 font-medium text-center">Passkey sio sahihi.</p>
              )}

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasskeyPrompt(false)}
                  className="w-1/2 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl"
                >
                  Thibitisha
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4 Pockets Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Mama Ela (Mtaji Mkuu) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <PiggyBank className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              Mtaji Mkuu
            </span>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mama Ela</h4>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {renderAmount(balances.mamaEla, 'text-indigo-950')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Fedha taslimu tayari kwa kutoa mikopo
          </p>
        </div>

        {/* 2. Ela Yangu (Faida & Akiba) */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              Faida & Akiba
            </span>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ela Yangu</h4>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {renderAmount(balances.elaYangu, 'text-emerald-950')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Faida ya ada na mapato binafsi
          </p>
        </div>

        {/* 3. Ela ya Matumizi */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Receipt className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              Bajeti Ofisi
            </span>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ela ya Matumizi</h4>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {renderAmount(balances.elaYaMatumizi, 'text-amber-950')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Inalipia pango, umeme, usafiri na bili
          </p>
        </div>

        {/* 4. Madeni Yaliyopo Nje */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow transition relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full">
              Kwenye Wateja
            </span>
          </div>
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Madeni Yaliyo Nje</h4>
          <div className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {renderAmount(totalOutstandingLoans, 'text-purple-950')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Mikopo na ada zinazosubiri kurejeshwa
          </p>
        </div>
      </div>
    </div>
  );
};
