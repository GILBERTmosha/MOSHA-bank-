import React, { useState } from 'react';
import { Expense, AccountBalances, AppSettings } from '../types';
import { formatCurrency } from '../services/notificationService';
import { 
  Plus, 
  Search, 
  Receipt, 
  Trash2, 
  Calendar, 
  Tag, 
  TrendingDown, 
  Wallet, 
  X,
  AlertCircle
} from 'lucide-react';

interface ExpensesManagerProps {
  expenses: Expense[];
  balances: AccountBalances;
  settings: AppSettings;
  onSaveExpense: (expense: Expense) => void;
  onDeleteExpense: (expenseId: string) => void;
}

const CATEGORIES: Array<Expense['category']> = [
  'Kodi ya Ofisi',
  'Umeme & Maji',
  'Mawasiliano & Vocha',
  'Usafiri',
  'Mishahara & Posho',
  'Vifaa vya Ofisi',
  'Chakula & Vinywaji',
  'Dharura',
  'Mengineyo',
];

export const ExpensesManager: React.FC<ExpensesManagerProps> = ({
  expenses,
  balances,
  settings,
  onSaveExpense,
  onDeleteExpense,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<Expense['category']>('Kodi ya Ofisi');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [pocket, setPocket] = useState<'matumizi' | 'mamaEla' | 'elaYangu'>('matumizi');
  const [notes, setNotes] = useState('');

  const totalSpent = expenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);

  const filteredExpenses = expenses.filter((exp) => {
    const matchesSearch =
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (exp.notes && exp.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'all' || exp.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = Number(amount);
    if (!title.trim() || isNaN(numAmount) || numAmount <= 0) return;

    const newExp: Expense = {
      id: 'exp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      title: title.trim(),
      category,
      amount: numAmount,
      date,
      pocket,
      receiptNumber: `EXP-${Math.floor(100 + Math.random() * 900)}`,
      notes: notes.trim() || undefined,
      createdAt: Date.now(),
    };

    onSaveExpense(newExp);
    setShowAddModal(false);
    setTitle('');
    setAmount('');
    setNotes('');
  };

  return (
    <div id="expenses-section-container" className="space-y-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-expenses-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tafuta matumizi, kitengo au maelezo..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-amber-500"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="all">Vitengo Vyote ({expenses.length})</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        <button
          id="btn-open-add-expense-modal"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Weka Matumizi Mapya</span>
        </button>
      </div>

      {/* Expenses Overview Banner */}
      <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-900">
              Jumla ya Matumizi Yaliyorekodiwa
            </h3>
            <div className="text-xl font-bold font-mono text-amber-950">
              {formatCurrency(totalSpent, settings.currency)}
            </div>
          </div>
        </div>

        <div className="text-xs text-amber-900">
          Salio Lililopo Kwenye Ela ya Matumizi:{' '}
          <strong className="font-mono">{formatCurrency(balances.elaYaMatumizi, settings.currency)}</strong>
        </div>
      </div>

      {/* Expenses List */}
      {filteredExpenses.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
            <Receipt className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Hakuna Rekodi za Matumizi</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {expenses.length === 0
              ? 'Haujaingiza matumizi yoyote bado. Bonyeza kitufe hapo juu kurekodi matumizi ya kwanza.'
              : 'Hakuna rekodi inayolingana na utafutaji wako.'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 text-[11px] uppercase font-bold">
                <th className="py-3 px-4">Maelezo ya Matumizi</th>
                <th className="py-3 px-4">Kitengo</th>
                <th className="py-3 px-4">Mfuko Uliotoa</th>
                <th className="py-3 px-4">Tarehe</th>
                <th className="py-3 px-4 text-right">Kiasi</th>
                <th className="py-3 px-4 text-center">Kitendo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-3 px-4">
                    <span className="font-semibold text-slate-900 block">{exp.title}</span>
                    {exp.notes && (
                      <span className="text-xs text-slate-400 block">{exp.notes}</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">
                      {exp.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-medium text-slate-600">
                    {exp.pocket === 'matumizi'
                      ? 'Ela ya Matumizi'
                      : exp.pocket === 'mamaEla'
                      ? 'Mama Ela'
                      : 'Ela Yangu'}
                  </td>
                  <td className="py-3 px-4 text-xs font-mono text-slate-500">{exp.date}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-red-600">
                    -{formatCurrency(exp.amount, settings.currency)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Una uhakika unataka kufuta matumizi haya ya "${exp.title}"?`)) {
                          onDeleteExpense(exp.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Futa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: Add Expense */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-amber-900 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold">Weka Rekodi ya Matumizi</h2>
                <p className="text-xs text-amber-200">Gharama za uendeshaji na ofisi</p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-amber-300 hover:text-white hover:bg-amber-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Jina / Kitu Kilicholipiwa *
                </label>
                <input
                  id="input-expense-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Mfano: Kodi ya pango mwezi huu, Vocha, Umeme..."
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Kiasi ({settings.currency}) *
                  </label>
                  <input
                    id="input-expense-amount"
                    type="number"
                    min="1"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Mfano: 50000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                    Kitengo:
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Pesa Hii Itolewe Kwenye Mfuko Gani:
                </label>
                <select
                  value={pocket}
                  onChange={(e) => setPocket(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="matumizi">Ela ya Matumizi (Salio: {formatCurrency(balances.elaYaMatumizi, settings.currency)})</option>
                  <option value="mamaEla">Mama Ela (Salio: {formatCurrency(balances.mamaEla, settings.currency)})</option>
                  <option value="elaYangu">Ela Yangu (Salio: {formatCurrency(balances.elaYangu, settings.currency)})</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tarehe ya Matumizi:
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Maelezo ya Ziada (Hiari):
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ufafanuzi wowote..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  id="btn-save-expense"
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Hifadhi Matumizi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
