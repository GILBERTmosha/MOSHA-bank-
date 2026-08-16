import React, { useState } from 'react';
import { AccountBalances } from '../types';
import { formatCurrency } from '../services/notificationService';
import { transactionTracker } from '../services/transactionTracker';
import { 
  ArrowRightLeft, 
  PlusCircle, 
  Wallet, 
  PiggyBank, 
  Receipt, 
  X, 
  CheckCircle2, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

interface FundModalProps {
  isOpen: boolean;
  onClose: () => void;
  balances: AccountBalances;
  currency: string;
  onSaveBalances: (newBalances: AccountBalances) => void;
}

export const FundModal: React.FC<FundModalProps> = ({
  isOpen,
  onClose,
  balances,
  currency,
  onSaveBalances,
}) => {
  const [actionType, setActionType] = useState<'deposit' | 'withdraw' | 'transfer' | 'adjust'>('deposit');
  const [targetPocket, setTargetPocket] = useState<'mamaEla' | 'elaYangu' | 'elaYaMatumizi'>('mamaEla');
  const [withdrawPocket, setWithdrawPocket] = useState<'mamaEla' | 'elaYangu' | 'elaYaMatumizi'>('mamaEla');
  const [fromPocket, setFromPocket] = useState<'mamaEla' | 'elaYangu' | 'elaYaMatumizi'>('mamaEla');
  const [toPocket, setToPocket] = useState<'mamaEla' | 'elaYangu' | 'elaYaMatumizi'>('elaYaMatumizi');
  const [amountInput, setAmountInput] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Direct adjust states
  const [adjMamaEla, setAdjMamaEla] = useState(balances.mamaEla.toString());
  const [adjElaYangu, setAdjElaYangu] = useState(balances.elaYangu.toString());
  const [adjMatumizi, setAdjMatumizi] = useState(balances.elaYaMatumizi.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (actionType === 'adjust') {
      const mama = Number(adjMamaEla) || 0;
      const yangu = Number(adjElaYangu) || 0;
      const matumizi = Number(adjMatumizi) || 0;
      
      transactionTracker.logTransaction({
        type: 'deposit',
        pocket: 'mamaEla',
        amount: mama,
        description: `Marekebisho ya salio: Mama Ela=${mama}, Ela Yangu=${yangu}, Matumizi=${matumizi}`,
      });

      onSaveBalances({
        mamaEla: mama,
        elaYangu: yangu,
        elaYaMatumizi: matumizi,
      });
      onClose();
      return;
    }

    const amount = Number(amountInput);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Tafadhali weka kiasi sahihi cha fedha.');
      return;
    }

    if (actionType === 'deposit') {
      const updated = { ...balances };
      updated[targetPocket] = (updated[targetPocket] || 0) + amount;

      transactionTracker.logTransaction({
        type: 'deposit',
        pocket: targetPocket,
        amount,
        description: notes.trim() || `Kuweka fedha mfuko wa ${targetPocket}`,
      });

      onSaveBalances(updated);
      onClose();
    } else if (actionType === 'withdraw') {
      if (balances[withdrawPocket] < amount) {
        setErrorMsg(`Salio halitoshi kwenye mfuko wa kutoa (${formatCurrency(balances[withdrawPocket], currency)}).`);
        return;
      }
      const updated = { ...balances };
      updated[withdrawPocket] -= amount;

      transactionTracker.logTransaction({
        type: 'withdrawal',
        pocket: withdrawPocket,
        amount,
        description: notes.trim() || `Kutoa fedha kutoka mfuko wa ${withdrawPocket}`,
      });

      onSaveBalances(updated);
      onClose();
    } else if (actionType === 'transfer') {
      if (fromPocket === toPocket) {
        setErrorMsg('Huwezi kuhamisha fedha kwenda kwenye akaunti ile ile.');
        return;
      }
      if (balances[fromPocket] < amount) {
        setErrorMsg(`Salio halitoshi kwenye akaunti ya kutoa (${formatCurrency(balances[fromPocket], currency)}).`);
        return;
      }

      const updated = { ...balances };
      updated[fromPocket] -= amount;
      updated[toPocket] += amount;

      transactionTracker.logTransaction({
        type: 'transfer',
        pocket: fromPocket,
        targetPocket: toPocket,
        amount,
        description: notes.trim() || `Uhamisho kutoka ${fromPocket} kwenda ${toPocket}`,
      });

      onSaveBalances(updated);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Usimamizi wa Mfuko wa Fedha</h2>
              <p className="text-xs text-slate-400">Mama Ela, Ela Yangu & Ela ya Matumizi</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => { setActionType('deposit'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition border-b-2 whitespace-nowrap ${
              actionType === 'deposit'
                ? 'border-emerald-600 text-emerald-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            + Weka Fedha (In)
          </button>
          <button
            type="button"
            onClick={() => { setActionType('withdraw'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition border-b-2 whitespace-nowrap ${
              actionType === 'withdraw'
                ? 'border-red-600 text-red-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            - Toa Fedha (Out)
          </button>
          <button
            type="button"
            onClick={() => { setActionType('transfer'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition border-b-2 whitespace-nowrap ${
              actionType === 'transfer'
                ? 'border-indigo-600 text-indigo-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ⇄ Hamisha
          </button>
          <button
            type="button"
            onClick={() => { setActionType('adjust'); setErrorMsg(''); }}
            className={`flex-1 py-3 px-3 text-center transition border-b-2 whitespace-nowrap ${
              actionType === 'adjust'
                ? 'border-amber-600 text-amber-700 bg-white'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ⚙ Salio Moja kwa Moja
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {actionType === 'deposit' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Chagua Mfuko wa Kuweka Fedha:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTargetPocket('mamaEla')}
                    className={`p-3 rounded-xl border text-center transition ${
                      targetPocket === 'mamaEla'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <PiggyBank className="w-4 h-4 mx-auto mb-1 text-indigo-600" />
                    <span>Mama Ela</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Mtaji Mkuu</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPocket('elaYangu')}
                    className={`p-3 rounded-xl border text-center transition ${
                      targetPocket === 'elaYangu'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                    <span>Ela Yangu</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Faida/Akiba</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setTargetPocket('elaYaMatumizi')}
                    className={`p-3 rounded-xl border text-center transition ${
                      targetPocket === 'elaYaMatumizi'
                        ? 'border-amber-600 bg-amber-50 text-amber-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Receipt className="w-4 h-4 mx-auto mb-1 text-amber-600" />
                    <span>Ela ya Matumizi</span>
                    <span className="block text-[10px] text-slate-500 font-normal">Bajeti Ofisi</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Kiasi cha Kuweka ({currency}):
                </label>
                <input
                  id="input-deposit-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Mfano: 1000000"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Maelezo / Chanzo cha Pesa (Hiari):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mfano: Mtaji wa kuanzia, Benki NMB, Mauzo..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>
            </>
          )}

          {actionType === 'withdraw' && (
            <>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Toa Fedha Kutoka Mfuko:
                </label>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setWithdrawPocket('mamaEla')}
                    className={`p-3 rounded-xl border text-center transition ${
                      withdrawPocket === 'mamaEla'
                        ? 'border-red-600 bg-red-50 text-red-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <PiggyBank className="w-4 h-4 mx-auto mb-1 text-red-600" />
                    <span>Mama Ela</span>
                    <span className="block text-[10px] text-slate-500 font-normal">{formatCurrency(balances.mamaEla, currency)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawPocket('elaYangu')}
                    className={`p-3 rounded-xl border text-center transition ${
                      withdrawPocket === 'elaYangu'
                        ? 'border-red-600 bg-red-50 text-red-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Wallet className="w-4 h-4 mx-auto mb-1 text-red-600" />
                    <span>Ela Yangu</span>
                    <span className="block text-[10px] text-slate-500 font-normal">{formatCurrency(balances.elaYangu, currency)}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWithdrawPocket('elaYaMatumizi')}
                    className={`p-3 rounded-xl border text-center transition ${
                      withdrawPocket === 'elaYaMatumizi'
                        ? 'border-red-600 bg-red-50 text-red-950 font-bold'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Receipt className="w-4 h-4 mx-auto mb-1 text-red-600" />
                    <span>Ela ya Matumizi</span>
                    <span className="block text-[10px] text-slate-500 font-normal">{formatCurrency(balances.elaYaMatumizi, currency)}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Kiasi cha Kutoa ({currency}):
                </label>
                <input
                  id="input-withdraw-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Mfano: 50000"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Sababu ya Kutoa Fedha:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Mfano: Kuchukua taslimu, kuweka benki..."
                  className="w-full px-4 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-red-500 focus:bg-white"
                />
              </div>
            </>
          )}

          {actionType === 'transfer' && (
            <>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Toa Kutoka Mfuko:
                  </label>
                  <select
                    value={fromPocket}
                    onChange={(e) => setFromPocket(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="mamaEla">Mama Ela ({formatCurrency(balances.mamaEla, currency)})</option>
                    <option value="elaYangu">Ela Yangu ({formatCurrency(balances.elaYangu, currency)})</option>
                    <option value="elaYaMatumizi">Ela ya Matumizi ({formatCurrency(balances.elaYaMatumizi, currency)})</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase text-slate-600 mb-1">
                    Peleka Kwenye Mfuko:
                  </label>
                  <select
                    value={toPocket}
                    onChange={(e) => setToPocket(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
                  >
                    <option value="elaYaMatumizi">Ela ya Matumizi ({formatCurrency(balances.elaYaMatumizi, currency)})</option>
                    <option value="mamaEla">Mama Ela ({formatCurrency(balances.mamaEla, currency)})</option>
                    <option value="elaYangu">Ela Yangu ({formatCurrency(balances.elaYangu, currency)})</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1.5">
                  Kiasi cha Kuhamisha ({currency}):
                </label>
                <input
                  id="input-transfer-amount"
                  type="number"
                  min="1"
                  step="any"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value)}
                  placeholder="Mfano: 200000"
                  required
                  autoFocus
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white"
                />
              </div>
            </>
          )}

          {actionType === 'adjust' && (
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-amber-50 text-amber-900 border border-amber-200 rounded-xl">
                <span>Weka salio la sasa unalotaka kwenye kila mfuko:</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  1. Mfuko wa Mama Ela (Mtaji Mkuu):
                </label>
                <input
                  type="number"
                  value={adjMamaEla}
                  onChange={(e) => setAdjMamaEla(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Mfuko wa Ela Yangu (Faida & Akiba):
                </label>
                <input
                  type="number"
                  value={adjElaYangu}
                  onChange={(e) => setAdjElaYangu(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  3. Mfuko wa Ela ya Matumizi (Gharama za Ofisi):
                </label>
                <input
                  type="number"
                  value={adjMatumizi}
                  onChange={(e) => setAdjMatumizi(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-semibold"
                />
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
            >
              Ghairi
            </button>
            <button
              id="btn-confirm-fund-action"
              type="submit"
              className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition shadow"
            >
              Hifadhi Mabadiliko
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
