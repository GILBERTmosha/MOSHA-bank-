import React, { useState } from 'react';
import { Loan, Repayment, AccountBalances, AppSettings, PaymentMethod } from '../types';
import { formatCurrency } from '../services/notificationService';
import { 
  Plus, 
  Search, 
  Filter, 
  MessageSquare, 
  FileText, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  User, 
  Phone, 
  CreditCard, 
  Calendar, 
  Share2, 
  Trash2, 
  Eye,
  Send,
  X,
  ShieldAlert,
  ArrowDownCircle,
  PiggyBank
} from 'lucide-react';

interface LoansManagerProps {
  loans: Loan[];
  balances: AccountBalances;
  settings: AppSettings;
  onSaveLoan: (loan: Loan, deductFromMamaEla: boolean) => void;
  onRecordRepayment: (loanId: string, repayment: Repayment, addBackToPocket: 'mamaEla' | 'elaYangu') => void;
  onDeleteLoan: (loanId: string) => void;
  onTriggerNotification: (loan: Loan, repayment?: Repayment) => void;
  onOpenReceipt: (loan: Loan, repayment?: Repayment) => void;
}

export const LoansManager: React.FC<LoansManagerProps> = ({
  loans,
  balances,
  settings,
  onSaveLoan,
  onRecordRepayment,
  onDeleteLoan,
  onTriggerNotification,
  onOpenReceipt,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'partial' | 'paid' | 'overdue'>('all');
  
  // Add Loan Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [clientName, setClientName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [principalAmount, setPrincipalAmount] = useState('');
  const [feeAmount, setFeeAmount] = useState('0');
  const [loanDate, setLoanDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );
  const [collateral, setCollateral] = useState('');
  const [notes, setNotes] = useState('');
  const [deductFromMamaEla, setDeductFromMamaEla] = useState(true);

  // Repayment Modal
  const [repaymentLoan, setRepaymentLoan] = useState<Loan | null>(null);
  const [repAmount, setRepAmount] = useState('');
  const [repMethod, setRepMethod] = useState<PaymentMethod>('M-Pesa');
  const [repDate, setRepDate] = useState(new Date().toISOString().split('T')[0]);
  const [repNotes, setRepNotes] = useState('');
  const [repTargetPocket, setRepTargetPocket] = useState<'mamaEla' | 'elaYangu'>('mamaEla');

  // Filtered Loans
  const filteredLoans = loans.filter((loan) => {
    const matchesSearch =
      loan.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      loan.clientPhone.includes(searchTerm) ||
      loan.receiptNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const isOverdue =
      loan.balanceRemaining > 0 &&
      new Date(loan.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

    if (filterStatus === 'all') return matchesSearch;
    if (filterStatus === 'overdue') return matchesSearch && isOverdue;
    if (filterStatus === 'paid') return matchesSearch && loan.balanceRemaining <= 0;
    if (filterStatus === 'active') return matchesSearch && loan.amountPaid === 0 && loan.balanceRemaining > 0;
    if (filterStatus === 'partial') return matchesSearch && loan.amountPaid > 0 && loan.balanceRemaining > 0;
    return matchesSearch;
  });

  // Calculate live total when adding loan
  const numPrincipal = Number(principalAmount) || 0;
  const numFee = Number(feeAmount) || 0;
  const computedTotal = numPrincipal + numFee;

  const handleAddLoanSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientName.trim() || !clientPhone.trim() || numPrincipal <= 0) return;

    const receiptNum = `MFB-REC-${Math.floor(1000 + Math.random() * 9000)}`;
    const newLoan: Loan = {
      id: 'loan_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      clientName: clientName.trim(),
      clientPhone: clientPhone.trim(),
      clientEmail: clientEmail.trim() || undefined,
      principalAmount: numPrincipal,
      feeAmount: numFee,
      totalAmount: computedTotal,
      amountPaid: 0,
      balanceRemaining: computedTotal,
      status: 'active',
      loanDate,
      dueDate,
      collateral: collateral.trim() || undefined,
      notes: notes.trim() || undefined,
      repayments: [],
      receiptNumber: receiptNum,
      createdAt: Date.now(),
      sourcePocket: deductFromMamaEla ? 'mamaEla' : undefined,
    };

    onSaveLoan(newLoan, deductFromMamaEla);
    setShowAddModal(false);

    // Reset Form
    setClientName('');
    setClientPhone('');
    setClientEmail('');
    setPrincipalAmount('');
    setFeeAmount('0');
    setCollateral('');
    setNotes('');

    // Trigger 1-minute notice modal right away
    onTriggerNotification(newLoan);
  };

  const handleRepaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!repaymentLoan) return;

    const amount = Number(repAmount);
    if (isNaN(amount) || amount <= 0) return;

    const repReceipt = `MFB-PAY-${Math.floor(1000 + Math.random() * 9000)}`;
    const repayment: Repayment = {
      id: 'rep_' + Date.now(),
      loanId: repaymentLoan.id,
      amount,
      date: repDate,
      paymentMethod: repMethod,
      notes: repNotes.trim() || undefined,
      receiptNumber: repReceipt,
      createdAt: Date.now(),
    };

    onRecordRepayment(repaymentLoan.id, repayment, repTargetPocket);
    
    // Create updated preview loan object for the receipt/notif
    const newPaid = repaymentLoan.amountPaid + amount;
    const newBal = Math.max(0, repaymentLoan.totalAmount - newPaid);
    const updatedLoanPreview: Loan = {
      ...repaymentLoan,
      amountPaid: newPaid,
      balanceRemaining: newBal,
      status: newBal <= 0 ? 'paid' : 'partial',
      repayments: [repayment, ...repaymentLoan.repayments],
    };

    setRepaymentLoan(null);
    setRepAmount('');
    setRepNotes('');

    // Trigger notice for repayment
    onTriggerNotification(updatedLoanPreview, repayment);
  };

  return (
    <div id="loans-section-container" className="space-y-4">
      {/* Top Header & Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="search-loans-input"
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tafuta jina la mteja, namba ya simu au risiti..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition"
            />
          </div>

          {/* Status Filter Chips */}
          <div className="flex items-center space-x-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {[
              { id: 'all', label: 'Yote' },
              { id: 'active', label: 'Hai (Bila Malipo)' },
              { id: 'partial', label: 'Awamu (Inalipwa)' },
              { id: 'paid', label: 'Imekamilika' },
              { id: 'overdue', label: 'Iliyochelewa' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilterStatus(tab.id as any)}
                className={`px-3 py-2 rounded-xl whitespace-nowrap font-medium transition ${
                  filterStatus === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <button
          id="btn-open-add-loan-modal"
          type="button"
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm rounded-xl shadow transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Sajili Deni / Mkopo Mpya</span>
        </button>
      </div>

      {/* Loans List Table / Cards */}
      {filteredLoans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center space-y-3">
          <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-base font-bold text-slate-800">Hakuna Rekodi za Madeni Zilizopatikana</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {loans.length === 0
              ? 'Hifadhi yako haina madeni kwa sasa. Bonyeza kitufe hapo juu kuanza kusajili mkopo wa kwanza.'
              : 'Hakuna mkopo unaolingana na utafutaji wako au chujio uliyochagua.'}
          </p>
          {loans.length === 0 && (
            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow mt-2"
            >
              <Plus className="w-4 h-4" />
              <span>Sajili Mkopo wa Kwanza</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredLoans.map((loan) => {
            const isFullPaid = loan.balanceRemaining <= 0;
            const isOverdue =
              !isFullPaid && new Date(loan.dueDate).getTime() < new Date().setHours(0, 0, 0, 0);

            const progressPct =
              loan.totalAmount > 0
                ? Math.min(100, Math.round((loan.amountPaid / loan.totalAmount) * 100))
                : 0;

            return (
              <div
                key={loan.id}
                id={`loan-card-${loan.id}`}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition space-y-4 relative overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-sm">
                      {loan.clientName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900">{loan.clientName}</h3>
                      <div className="flex items-center space-x-2 text-xs text-slate-500 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span className="font-mono">{loan.clientPhone}</span>
                      </div>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div>
                    {isFullPaid ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-full">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Imelipwa Yote</span>
                      </span>
                    ) : isOverdue ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-red-100 text-red-800 font-bold text-[11px] rounded-full animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Imechelewa</span>
                      </span>
                    ) : loan.amountPaid > 0 ? (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-blue-100 text-blue-800 font-bold text-[11px] rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Inalipwa ({progressPct}%)</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center space-x-1 px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-[11px] rounded-full">
                        <Clock className="w-3 h-3" />
                        <span>Inasubiri Malipo</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Amount Matrix */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kiasi + Ada</span>
                    <span className="font-mono font-bold text-slate-800">
                      {formatCurrency(loan.totalAmount, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">
                      (Ada: {formatCurrency(loan.feeAmount, settings.currency)})
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Kimelipwa</span>
                    <span className="font-mono font-bold text-emerald-600">
                      {formatCurrency(loan.amountPaid, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">{progressPct}%</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Baki Inayodaiwa</span>
                    <span className="font-mono font-bold text-red-600">
                      {formatCurrency(loan.balanceRemaining, settings.currency)}
                    </span>
                    <span className="text-[10px] text-slate-400 block">Mwisho: {loan.dueDate}</span>
                  </div>
                </div>

                {/* Repayment Progress Bar */}
                <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>

                {/* Collateral & Reference */}
                <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
                  <div className="flex items-center space-x-1 font-mono">
                    <span>Risiti: #{loan.receiptNumber}</span>
                  </div>
                  {loan.collateral && (
                    <div className="text-slate-600 truncate max-w-[200px]" title={loan.collateral}>
                      🔒 Dhamana: {loan.collateral}
                    </div>
                  )}
                </div>

                {/* Action Controls */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center space-x-1.5">
                    {/* View Receipt */}
                    <button
                      type="button"
                      onClick={() => onOpenReceipt(loan)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                      title="Fungua Risiti ya PDF/Picha"
                    >
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Risiti</span>
                    </button>

                    {/* Send 1-Min Notification */}
                    <button
                      type="button"
                      onClick={() => onTriggerNotification(loan)}
                      className="flex items-center space-x-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold rounded-lg border border-emerald-200 transition"
                      title="Tuma Taarifa kwa WhatsApp/SMS"
                    >
                      <Send className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Tuma Taarifa (1dk)</span>
                    </button>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {/* Pay Button */}
                    {!isFullPaid && (
                      <button
                        type="button"
                        onClick={() => {
                          setRepaymentLoan(loan);
                          setRepAmount(loan.balanceRemaining.toString());
                        }}
                        className="flex items-center space-x-1 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
                      >
                        <ArrowDownCircle className="w-3.5 h-3.5" />
                        <span>Rekodi Malipo</span>
                      </button>
                    )}

                    {/* Delete button */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm(`Una uhakika unataka kufuta rekodi ya mkopo wa ${loan.clientName}?`)) {
                          onDeleteLoan(loan.id);
                        }
                      }}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Futa Rekodi"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* History of Repayments if any */}
                {loan.repayments.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-100 bg-slate-50/60 p-2.5 rounded-lg text-xs space-y-1.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Historia ya Malipo ({loan.repayments.length}):
                    </span>
                    {loan.repayments.slice(0, 3).map((rep) => (
                      <div key={rep.id} className="flex items-center justify-between text-slate-700">
                        <div className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>{rep.date} ({rep.paymentMethod})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono font-bold text-emerald-700">
                            +{formatCurrency(rep.amount, settings.currency)}
                          </span>
                          <button
                            type="button"
                            onClick={() => onOpenReceipt(loan, rep)}
                            className="text-[11px] text-indigo-600 hover:underline"
                          >
                            Risiti #{rep.receiptNumber}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add New Loan */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold">Sajili Deni / Mkopo Mpya</h2>
                  <p className="text-xs text-slate-400">Weka kiasi, ada na taarifa za mteja</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLoanSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Client Name */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Jina Kamili la Mteja / Mkopaji *
                  </label>
                  <input
                    id="input-client-name"
                    type="text"
                    required
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Mfano: Juma Hassan Rashidi"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                {/* Client Phone */}
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Namba ya Simu (WhatsApp / SMS) *
                  </label>
                  <input
                    id="input-client-phone"
                    type="tel"
                    required
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    placeholder="Mfano: 0712345678 au +255..."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-sm font-mono focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Barua Pepe / Email (Hiari)
                </label>
                <input
                  id="input-client-email"
                  type="email"
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="mteja@gmail.com"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 text-xs focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Financial Calculation Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Principal */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Kiasi Alichokopa ({settings.currency}) *
                    </label>
                    <input
                      id="input-principal-amount"
                      type="number"
                      min="1"
                      required
                      value={principalAmount}
                      onChange={(e) => setPrincipalAmount(e.target.value)}
                      placeholder="Mfano: 500000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  {/* Fee */}
                  <div>
                    <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                      Ada ya Huduma / Ofisi ({settings.currency})
                    </label>
                    <input
                      id="input-fee-amount"
                      type="number"
                      min="0"
                      value={feeAmount}
                      onChange={(e) => setFeeAmount(e.target.value)}
                      placeholder="Mfano: 50000"
                      className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-xl text-slate-900 font-bold font-mono text-sm focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Auto Calculated Total Banner */}
                <div className="p-3 bg-indigo-900 text-white rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-indigo-300 block">
                      JUMLA KUU INAYODAIWA (Kiasi + Ada)
                    </span>
                    <span className="text-lg font-black font-mono text-amber-300">
                      {formatCurrency(computedTotal, settings.currency)}
                    </span>
                  </div>
                  <span className="text-xs text-indigo-200 bg-indigo-800/80 px-2.5 py-1 rounded-lg">
                    Itaingia kwenye Risiti
                  </span>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Tarehe ya Mkopo
                  </label>
                  <input
                    type="date"
                    required
                    value={loanDate}
                    onChange={(e) => setLoanDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                    Tarehe ya Mwisho wa Kulipa (Due Date)
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Collateral & Notes */}
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Dhamana Iliyowekwa (Collateral)
                </label>
                <input
                  type="text"
                  value={collateral}
                  onChange={(e) => setCollateral(e.target.value)}
                  placeholder="Mfano: Kadi ya Gari, Pikipiki, Hati ya Kiwanja, Simu..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-1">
                  Maelezo ya Ziada (Hiari)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Maelezo mengine muhimu kuhusu mteja au makubaliano..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800"
                />
              </div>

              {/* Deduct from Mama Ela checkbox */}
              <div className="p-3 bg-slate-100 rounded-xl flex items-center space-x-2.5">
                <input
                  id="chk-deduct-mama-ela"
                  type="checkbox"
                  checked={deductFromMamaEla}
                  onChange={(e) => setDeductFromMamaEla(e.target.checked)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <label htmlFor="chk-deduct-mama-ela" className="text-xs text-slate-700 font-medium">
                  Toa kiasi hiki ({formatCurrency(numPrincipal, settings.currency)}) kutoka kwenye mfuko wa <strong>Mama Ela</strong>
                </label>
              </div>

              {/* Actions */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  Ghairi
                </button>
                <button
                  id="btn-save-new-loan"
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow"
                >
                  Hifadhi & Andaa Risiti (1dk)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Repayment */}
      {repaymentLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-emerald-900 text-white p-5 flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-bold">Kurekodi Malipo ya Deni</h2>
                <p className="text-xs text-emerald-200">Mteja: {repaymentLoan.clientName}</p>
              </div>
              <button
                type="button"
                onClick={() => setRepaymentLoan(null)}
                className="p-1.5 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRepaymentSubmit} className="p-5 space-y-4 overflow-y-auto">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Jumla ya Deni:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(repaymentLoan.totalAmount, settings.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Baki Inayodaiwa:</span>
                  <span className="font-bold text-red-600">{formatCurrency(repaymentLoan.balanceRemaining, settings.currency)}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Kiasi Anacholipa Sasa ({settings.currency}) *
                </label>
                <input
                  id="input-repayment-amount"
                  type="number"
                  min="1"
                  max={repaymentLoan.balanceRemaining}
                  required
                  value={repAmount}
                  onChange={(e) => setRepAmount(e.target.value)}
                  placeholder="Mfano: 200000"
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-900 font-bold font-mono text-base focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Njia ya Malipo:
                </label>
                <select
                  value={repMethod}
                  onChange={(e) => setRepMethod(e.target.value as PaymentMethod)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-800"
                >
                  <option value="M-Pesa">M-Pesa</option>
                  <option value="A-Pesa / Airtel">Airtel Money</option>
                  <option value="Tigo Pesa">Tigo Pesa</option>
                  <option value="HaloPesa">HaloPesa</option>
                  <option value="Benki (NMB/CRDB)">Benki (NMB / CRDB / Nyingine)</option>
                  <option value="Taslimu (Cash)">Taslimu (Cash)</option>
                  <option value="Nyingine">Njia Nyingine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Pesa Hii Iingie Kwenye Mfuko Gani:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setRepTargetPocket('mamaEla')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      repTargetPocket === 'mamaEla'
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-950 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Mama Ela</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Rejesha Mtaji</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRepTargetPocket('elaYangu')}
                    className={`p-2.5 rounded-xl border text-center transition ${
                      repTargetPocket === 'elaYangu'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    <span>Ela Yangu</span>
                    <span className="block text-[10px] text-slate-400 font-normal">Hifadhi/Faida</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Tarehe ya Malipo:
                </label>
                <input
                  type="date"
                  required
                  value={repDate}
                  onChange={(e) => setRepDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-700 mb-1">
                  Maelezo ya Malipo (Hiari):
                </label>
                <input
                  type="text"
                  value={repNotes}
                  onChange={(e) => setRepNotes(e.target.value)}
                  placeholder="Mfano: Malipo ya awamu ya kwanza..."
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRepaymentLoan(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl"
                >
                  Ghairi
                </button>
                <button
                  id="btn-confirm-repayment"
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow"
                >
                  Kamilisha & Tuma Risiti (1dk)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
