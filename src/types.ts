export type Currency = 'TZS' | 'USD' | 'KES';

export type PaymentMethod = 'M-Pesa' | 'A-Pesa / Airtel' | 'Tigo Pesa' | 'HaloPesa' | 'Benki (NMB/CRDB)' | 'Taslimu (Cash)' | 'Nyingine';

export type LoanStatus = 'active' | 'partial' | 'paid' | 'overdue';

export interface Repayment {
  id: string;
  loanId: string;
  amount: number;
  date: string;
  paymentMethod: PaymentMethod;
  notes?: string;
  receiptNumber: string;
  createdAt: number;
}

export interface Loan {
  id: string;
  clientName: string;
  clientPhone: string;
  clientEmail?: string;
  principalAmount: number; // Kiasi alichokopa
  feeAmount: number;       // Ada ya mkopo / riba
  totalAmount: number;     // Jumla (Principal + Fee)
  amountPaid: number;      // Kiasi kilicholipwa
  balanceRemaining: number;// Baki ya deni
  status: LoanStatus;
  loanDate: string;
  dueDate: string;
  collateral?: string;     // Dhamana
  notes?: string;
  repayments: Repayment[];
  receiptNumber: string;
  createdAt: number;
  sourcePocket?: 'mamaEla' | 'elaYangu' | 'general';
}

export interface Expense {
  id: string;
  title: string;
  category: 'Kodi ya Ofisi' | 'Umeme & Maji' | 'Mawasiliano & Vocha' | 'Usafiri' | 'Mishahara & Posho' | 'Vifaa vya Ofisi' | 'Chakula & Vinywaji' | 'Dharura' | 'Mengineyo';
  amount: number;
  date: string;
  pocket: 'matumizi' | 'mamaEla' | 'elaYangu';
  receiptNumber?: string;
  notes?: string;
  createdAt: number;
}

export interface AccountBalances {
  mamaEla: number;        // Mtaji Mkuu / Hifadhi ya Msingi (Main Capital)
  elaYangu: number;       // Faida & Hifadhi ya Binafsi (Owner's profit/Savings)
  elaYaMatumizi: number;  // Bajeti ya Matumizi ya Kila Siku (Operating Expenses)
}

export interface AppSettings {
  companyName: string;
  tagline: string;
  phone: string;
  email: string;
  address: string;
  logoUrl: string | null;
  currency: string;
  passkey: string;            // Default: 'MOSHA' or custom user password
  securitySign: string;       // Sign/Recovery phrase if passkey forgotten e.g. "MOSHA-SIGN-2026"
  authorizedGoogleEmail?: string | null; // Permanent bound Google Account email
  autoLockMinutes: number;    // 0 = never, 5 = 5 min, etc.
  hideBalancesByDefault: boolean;
  smsSenderName: string;
}

export interface NotificationPayload {
  recipientName: string;
  recipientPhone: string;
  recipientEmail?: string;
  type: 'new_loan' | 'repayment' | 'reminder';
  loan: Loan;
  repayment?: Repayment;
  receiptNumber: string;
}
