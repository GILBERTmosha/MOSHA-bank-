import { Loan, Expense, AccountBalances, AppSettings } from '../types';
import moshaLogo from '../assets/images/mosha_bank_logo_1786905642948.jpg';

const STORAGE_KEYS = {
  LOANS: 'mfb_loans_v1',
  EXPENSES: 'mfb_expenses_v1',
  BALANCES: 'mfb_balances_v1',
  SETTINGS: 'mfb_settings_v1',
  SESSION_AUTH: 'mfb_is_authenticated_session',
  LAST_ACTIVITY: 'mfb_last_activity_time',
};

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'MOSHA FOUNDATION BANK',
  tagline: 'Mfumo wa Hifadhi ya Fedha, Madeni & Matumizi',
  phone: '+255 754 000 000',
  email: 'moshaproject@gmail.com',
  address: 'Ofisi Kuu, Tanzania',
  logoUrl: moshaLogo,
  currency: 'TZS',
  passkey: 'MOSHA', // Nenosiri la msingi lililowekwa: MOSHA
  securitySign: 'MOSHA-SIGN-2026', // Sahihi ya Uokozi (Recovery Sign)
  authorizedGoogleEmail: null, // Locked permanent Google Account
  autoLockMinutes: 15,
  hideBalancesByDefault: false,
  smsSenderName: 'MOSHA BANK',
};

export const DEFAULT_BALANCES: AccountBalances = {
  mamaEla: 0, // Clean start: 0
  elaYangu: 0,
  elaYaMatumizi: 0,
};

export const storageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading settings', e);
    }
    return DEFAULT_SETTINGS;
  },

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  },

  getBalances(): AccountBalances {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BALANCES);
      if (data) return { ...DEFAULT_BALANCES, ...JSON.parse(data) };
    } catch (e) {
      console.error('Error loading balances', e);
    }
    return DEFAULT_BALANCES;
  },

  saveBalances(balances: AccountBalances): void {
    localStorage.setItem(STORAGE_KEYS.BALANCES, JSON.stringify(balances));
  },

  getLoans(): Loan[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.LOANS);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading loans', e);
    }
    return []; // Clean empty start as requested
  },

  saveLoans(loans: Loan[]): void {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  },

  getExpenses(): Expense[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.EXPENSES);
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error('Error loading expenses', e);
    }
    return []; // Clean empty start
  },

  saveExpenses(expenses: Expense[]): void {
    localStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  exportAllData(): string {
    const bundle = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      settings: this.getSettings(),
      balances: this.getBalances(),
      loans: this.getLoans(),
      expenses: this.getExpenses(),
    };
    return JSON.stringify(bundle, null, 2);
  },

  importAllData(jsonString: string): boolean {
    try {
      const bundle = JSON.parse(jsonString);
      if (bundle.settings) this.saveSettings(bundle.settings);
      if (bundle.balances) this.saveBalances(bundle.balances);
      if (Array.isArray(bundle.loans)) this.saveLoans(bundle.loans);
      if (Array.isArray(bundle.expenses)) this.saveExpenses(bundle.expenses);
      return true;
    } catch (e) {
      console.error('Import failed', e);
      return false;
    }
  },

  clearAllData(): void {
    localStorage.removeItem(STORAGE_KEYS.LOANS);
    localStorage.removeItem(STORAGE_KEYS.EXPENSES);
    localStorage.removeItem(STORAGE_KEYS.BALANCES);
    // Keep settings or reset
    this.saveBalances(DEFAULT_BALANCES);
    this.saveLoans([]);
    this.saveExpenses([]);
  },

  seedDemoData(): void {
    const demoBalances: AccountBalances = {
      mamaEla: 5000000,
      elaYangu: 850000,
      elaYaMatumizi: 350000,
    };
    const now = new Date();
    const demoLoans: Loan[] = [
      {
        id: 'loan_' + Date.now() + '_1',
        clientName: 'Juma Hassan Rashidi',
        clientPhone: '+255712345678',
        clientEmail: 'juma.rashidi@gmail.com',
        principalAmount: 500000,
        feeAmount: 50000,
        totalAmount: 550000,
        amountPaid: 200000,
        balanceRemaining: 350000,
        status: 'partial',
        loanDate: new Date(now.getTime() - 10 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(now.getTime() + 20 * 86400000).toISOString().split('T')[0],
        collateral: 'Kadi ya Pikipiki TVS (MC-4452)',
        notes: 'Alilipa awamu ya kwanza vizuri.',
        receiptNumber: 'MFB-REC-8901',
        createdAt: Date.now() - 10 * 86400000,
        sourcePocket: 'mamaEla',
        repayments: [
          {
            id: 'rep_' + Date.now() + '_1',
            loanId: 'loan_' + Date.now() + '_1',
            amount: 200000,
            date: new Date(now.getTime() - 2 * 86400000).toISOString().split('T')[0],
            paymentMethod: 'M-Pesa',
            notes: 'Malipo ya awamu ya kwanza',
            receiptNumber: 'MFB-PAY-1001',
            createdAt: Date.now() - 2 * 86400000,
          },
        ],
      },
      {
        id: 'loan_' + Date.now() + '_2',
        clientName: 'Amina Selemani Mgaya',
        clientPhone: '+255768990011',
        clientEmail: 'amina.mgaya@yahoo.com',
        principalAmount: 300000,
        feeAmount: 30000,
        totalAmount: 330000,
        amountPaid: 0,
        balanceRemaining: 330000,
        status: 'active',
        loanDate: new Date(now.getTime() - 3 * 86400000).toISOString().split('T')[0],
        dueDate: new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0],
        collateral: 'Hati ya Kiwanja No. 41B',
        notes: 'Mteja mpya wa ofisi.',
        receiptNumber: 'MFB-REC-8902',
        createdAt: Date.now() - 3 * 86400000,
        sourcePocket: 'mamaEla',
        repayments: [],
      },
    ];

    const demoExpenses: Expense[] = [
      {
        id: 'exp_' + Date.now() + '_1',
        title: 'Kodi ya Ofisi Mwezi Huu',
        category: 'Kodi ya Ofisi',
        amount: 150000,
        date: new Date().toISOString().split('T')[0],
        pocket: 'matumizi',
        notes: 'Malipo ya pango la ofisi',
        receiptNumber: 'EXP-401',
        createdAt: Date.now(),
      },
      {
        id: 'exp_' + Date.now() + '_2',
        title: 'Vocha & LUKU ya Ofisi',
        category: 'Umeme & Maji',
        amount: 30000,
        date: new Date().toISOString().split('T')[0],
        pocket: 'matumizi',
        notes: 'Umeme wa ofisi na vifurushi vya mtandao',
        receiptNumber: 'EXP-402',
        createdAt: Date.now(),
      },
    ];

    this.saveBalances(demoBalances);
    this.saveLoans(demoLoans);
    this.saveExpenses(demoExpenses);
  },
};
