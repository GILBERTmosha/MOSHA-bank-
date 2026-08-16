import React, { useState, useEffect, useCallback } from 'react';
import { Loan, Expense, AccountBalances, AppSettings, Repayment } from './types';
import { storageService, DEFAULT_SETTINGS, DEFAULT_BALANCES } from './services/storage';
import { auth, signInWithGoogle, logoutUser } from './firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { firebaseSyncService } from './services/firebaseSync';
import { transactionTracker } from './services/transactionTracker';
import { LockScreen } from './components/LockScreen';
import { Navbar } from './components/Navbar';
import { FinancialSummary } from './components/FinancialSummary';
import { LoansManager } from './components/LoansManager';
import { ExpensesManager } from './components/ExpensesManager';
import { FundModal } from './components/FundModal';
import { SettingsModal } from './components/SettingsModal';
import { NotificationModal } from './components/NotificationModal';
import { ReceiptModal } from './components/ReceiptModal';
import confetti from 'canvas-confetti';
import { 
  Building2, 
  ShieldCheck, 
  Sparkles, 
  FileText, 
  Receipt, 
  Wallet,
  Phone,
  Mail,
  MapPin,
  Lock,
  Cloud
} from 'lucide-react';

export default function App() {
  // State: Starts locked by default on fresh visit
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [settings, setSettings] = useState<AppSettings>(() => storageService.getSettings());
  const [balances, setBalances] = useState<AccountBalances>(() => storageService.getBalances());
  const [loans, setLoans] = useState<Loan[]>(() => storageService.getLoans());
  const [expenses, setExpenses] = useState<Expense[]>(() => storageService.getExpenses());

  const [activeTab, setActiveTab] = useState<'loans' | 'expenses' | 'vault'>('loans');

  // Modals
  const [showFundModal, setShowFundModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  
  // Notification Modal State (1-Minute countdown)
  const [notificationState, setNotificationState] = useState<{
    isOpen: boolean;
    loan: Loan | null;
    repayment?: Repayment;
  }>({
    isOpen: false,
    loan: null,
  });

  // Receipt Modal State
  const [receiptState, setReceiptState] = useState<{
    isOpen: boolean;
    loan: Loan | null;
    repayment?: Repayment | null;
  }>({
    isOpen: false,
    loan: null,
    repayment: null,
  });

  // Firebase Auth State Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Load user's cloud data from Firestore if available
        const cloudData = await firebaseSyncService.loadAllUserData(user.uid);
        if (cloudData.balances) {
          setBalances(cloudData.balances);
          storageService.saveBalances(cloudData.balances);
        }
        if (cloudData.settings) {
          setSettings(cloudData.settings);
          storageService.saveSettings(cloudData.settings);
        }
        if (cloudData.loans) {
          setLoans(cloudData.loans);
          storageService.saveLoans(cloudData.loans);
        }
        if (cloudData.expenses) {
          setExpenses(cloudData.expenses);
          storageService.saveExpenses(cloudData.expenses);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Refresh all state from localStorage
  const refreshAllData = useCallback(() => {
    setSettings(storageService.getSettings());
    setBalances(storageService.getBalances());
    setLoans(storageService.getLoans());
    setExpenses(storageService.getExpenses());
  }, []);

  // Authentication Handlers
  const handleAuthenticate = () => {
    setIsAuthenticated(true);
  };

  const handleLock = () => {
    setIsAuthenticated(false);
  };

  const handleGoogleSignIn = async () => {
    try {
      const user = await signInWithGoogle();
      if (user && user.email) {
        if (settings.authorizedGoogleEmail && settings.authorizedGoogleEmail.trim() !== '') {
          if (user.email.toLowerCase() !== settings.authorizedGoogleEmail.toLowerCase()) {
            await logoutUser();
            alert(`Akaunti hii ya Google (${user.email}) hairuhusiwi. Ofisi hii imefungwa kwa akaunti rasmi ya: ${settings.authorizedGoogleEmail}`);
            return;
          }
        } else {
          // Bind this Google account as permanent authorized account
          const updatedSettings = {
            ...settings,
            authorizedGoogleEmail: user.email,
          };
          setSettings(updatedSettings);
          storageService.saveSettings(updatedSettings);
          firebaseSyncService.saveSettings(user.uid, updatedSettings);
        }
        setCurrentUser(user);
        setIsAuthenticated(true);
      }
    } catch (e) {
      console.error('Google sign in error:', e);
    }
  };

  const handleGoogleSignOut = async () => {
    await logoutUser();
    setCurrentUser(null);
  };

  // Update Settings
  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);
    storageService.saveSettings(newSettings);
    if (currentUser) {
      firebaseSyncService.saveSettings(currentUser.uid, newSettings);
    }
  };

  // Update Balances
  const handleSaveBalances = (newBalances: AccountBalances) => {
    setBalances(newBalances);
    storageService.saveBalances(newBalances);
    if (currentUser) {
      firebaseSyncService.saveBalances(currentUser.uid, newBalances);
    }
  };

  // Loan Creation
  const handleSaveLoan = (newLoan: Loan, deductFromMamaEla: boolean) => {
    const updatedLoans = [newLoan, ...loans];
    setLoans(updatedLoans);
    storageService.saveLoans(updatedLoans);
    if (currentUser) {
      firebaseSyncService.saveLoans(currentUser.uid, updatedLoans);
    }

    if (deductFromMamaEla) {
      const updatedBalances = {
        ...balances,
        mamaEla: Math.max(0, balances.mamaEla - newLoan.principalAmount),
      };
      setBalances(updatedBalances);
      storageService.saveBalances(updatedBalances);
      if (currentUser) {
        firebaseSyncService.saveBalances(currentUser.uid, updatedBalances);
      }
    }

    transactionTracker.logTransaction({
      type: 'loan_disbursed',
      pocket: 'mamaEla',
      amount: newLoan.principalAmount,
      description: `Kutoa mkopo kwa ${newLoan.clientName} (Ada: ${newLoan.feeAmount})`,
      referenceId: newLoan.id,
    });
  };

  // Repayment Recording
  const handleRecordRepayment = (
    loanId: string,
    repayment: Repayment,
    addBackToPocket: 'mamaEla' | 'elaYangu'
  ) => {
    let clientName = '';
    const updatedLoans = loans.map((loan) => {
      if (loan.id === loanId) {
        clientName = loan.clientName;
        const newPaid = (loan.amountPaid || 0) + repayment.amount;
        const newBal = Math.max(0, loan.totalAmount - newPaid);
        const newStatus: Loan['status'] = newBal <= 0 ? 'paid' : 'partial';

        if (newBal <= 0) {
          try {
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 },
            });
          } catch (e) {}
        }

        return {
          ...loan,
          amountPaid: newPaid,
          balanceRemaining: newBal,
          status: newStatus,
          repayments: [repayment, ...loan.repayments],
        };
      }
      return loan;
    });

    setLoans(updatedLoans);
    storageService.saveLoans(updatedLoans);
    if (currentUser) {
      firebaseSyncService.saveLoans(currentUser.uid, updatedLoans);
    }

    // Update balances
    const updatedBalances = { ...balances };
    if (addBackToPocket === 'mamaEla') {
      updatedBalances.mamaEla += repayment.amount;
    } else {
      updatedBalances.elaYangu += repayment.amount;
    }
    setBalances(updatedBalances);
    storageService.saveBalances(updatedBalances);
    if (currentUser) {
      firebaseSyncService.saveBalances(currentUser.uid, updatedBalances);
    }

    transactionTracker.logTransaction({
      type: 'loan_repaid',
      pocket: addBackToPocket,
      amount: repayment.amount,
      description: `Marejesho ya mkopo kutoka kwa ${clientName || 'Mteja'} (${repayment.paymentMethod})`,
      referenceId: loanId,
    });
  };

  // Delete Loan
  const handleDeleteLoan = (loanId: string) => {
    const updated = loans.filter((l) => l.id !== loanId);
    setLoans(updated);
    storageService.saveLoans(updated);
    if (currentUser) {
      firebaseSyncService.saveLoans(currentUser.uid, updated);
    }
  };

  // Expense Creation
  const handleSaveExpense = (newExp: Expense) => {
    const updated = [newExp, ...expenses];
    setExpenses(updated);
    storageService.saveExpenses(updated);
    if (currentUser) {
      firebaseSyncService.saveExpenses(currentUser.uid, updated);
    }

    // Deduct from appropriate pocket
    const updatedBalances = { ...balances };
    if (newExp.pocket === 'matumizi') {
      updatedBalances.elaYaMatumizi = Math.max(0, updatedBalances.elaYaMatumizi - newExp.amount);
    } else if (newExp.pocket === 'mamaEla') {
      updatedBalances.mamaEla = Math.max(0, updatedBalances.mamaEla - newExp.amount);
    } else if (newExp.pocket === 'elaYangu') {
      updatedBalances.elaYangu = Math.max(0, updatedBalances.elaYangu - newExp.amount);
    }
    setBalances(updatedBalances);
    storageService.saveBalances(updatedBalances);
    if (currentUser) {
      firebaseSyncService.saveBalances(currentUser.uid, updatedBalances);
    }
  };

  // Delete Expense
  const handleDeleteExpense = (expId: string) => {
    const updated = expenses.filter((e) => e.id !== expId);
    setExpenses(updated);
    storageService.saveExpenses(updated);
    if (currentUser) {
      firebaseSyncService.saveExpenses(currentUser.uid, updated);
    }
  };

  // Trigger 1-Minute Notification Modal
  const handleTriggerNotification = (loan: Loan, repayment?: Repayment) => {
    setNotificationState({
      isOpen: true,
      loan,
      repayment,
    });
  };

  // Trigger Receipt Viewer Modal
  const handleOpenReceipt = (loan: Loan, repayment?: Repayment) => {
    setReceiptState({
      isOpen: true,
      loan,
      repayment: repayment || null,
    });
  };

  // If Not Authenticated, show Banker Passkey & Sign Lock Screen
  if (!isAuthenticated) {
    return (
      <LockScreen
        settings={settings}
        onAuthenticate={handleAuthenticate}
        onUpdateSettings={handleSaveSettings}
        onGoogleSignInSuccess={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans">
      {/* Header & Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        settings={settings}
        loans={loans}
        currentUser={currentUser}
        onLock={handleLock}
        onOpenSettings={() => setShowSettingsModal(true)}
        onGoogleSignIn={handleGoogleSignIn}
        onGoogleSignOut={handleGoogleSignOut}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Financial Wealth Summary (Mama Ela, Ela Yangu, Ela ya Matumizi, Madeni Nje) */}
        <FinancialSummary
          balances={balances}
          loans={loans}
          settings={settings}
          onOpenFundModal={() => setShowFundModal(true)}
        />

        {/* Fresh Start Welcome Card when no records exist */}
        {balances.mamaEla === 0 && balances.elaYangu === 0 && balances.elaYaMatumizi === 0 && loans.length === 0 && (
          <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white p-5 rounded-2xl border border-indigo-700/50 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-amber-300">
                  Mwanzo Mpya: Weka Mtaji Wako & Chagua Mfuko
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Mfumo wako umeanza bila rekodi yoyote. Weka kiasi cha fedha na uchague unaweka kwenye <strong>Mama Ela</strong>, <strong>Ela Yangu</strong>, au <strong>Ela ya Matumizi</strong>.
                </p>
              </div>
            </div>

            <button
              id="btn-quick-start-deposit"
              type="button"
              onClick={() => setShowFundModal(true)}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs sm:text-sm rounded-xl shadow-lg transition shrink-0 flex items-center space-x-2"
            >
              <Wallet className="w-4 h-4" />
              <span>Weka Mtaji Sasa</span>
            </button>
          </div>
        )}

        {/* Dynamic Content View */}
        {activeTab === 'loans' && (
          <LoansManager
            loans={loans}
            balances={balances}
            settings={settings}
            onSaveLoan={handleSaveLoan}
            onRecordRepayment={handleRecordRepayment}
            onDeleteLoan={handleDeleteLoan}
            onTriggerNotification={handleTriggerNotification}
            onOpenReceipt={handleOpenReceipt}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesManager
            expenses={expenses}
            balances={balances}
            settings={settings}
            onSaveExpense={handleSaveExpense}
            onDeleteExpense={handleDeleteExpense}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <Building2 className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800 uppercase">{settings.companyName}</span>
            <span>• Mfumo Salama wa Hifadhi</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowSettingsModal(true)}
              className="text-slate-600 hover:text-indigo-600 transition"
            >
              Mipangilio & Backup
            </button>
            <span>|</span>
            <button
              type="button"
              onClick={handleLock}
              className="text-red-600 hover:underline"
            >
              Funga Mfumo (Lock)
            </button>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <FundModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        balances={balances}
        currency={settings.currency}
        onSaveBalances={handleSaveBalances}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        onSaveSettings={handleSaveSettings}
        onRefreshData={refreshAllData}
      />

      {notificationState.isOpen && notificationState.loan && (
        <NotificationModal
          isOpen={notificationState.isOpen}
          onClose={() => setNotificationState({ isOpen: false, loan: null })}
          loan={notificationState.loan}
          repayment={notificationState.repayment}
          settings={settings}
          onViewReceipt={() => {
            if (notificationState.loan) {
              handleOpenReceipt(notificationState.loan, notificationState.repayment);
            }
          }}
        />
      )}

      {receiptState.isOpen && receiptState.loan && (
        <ReceiptModal
          isOpen={receiptState.isOpen}
          onClose={() => setReceiptState({ isOpen: false, loan: null, repayment: null })}
          loan={receiptState.loan}
          repayment={receiptState.repayment}
          settings={settings}
        />
      )}
    </div>
  );
}

