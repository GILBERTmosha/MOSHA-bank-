import { AccountBalances, Loan, Expense } from '../types';

export interface FundTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer' | 'loan_disbursed' | 'loan_repaid' | 'expense';
  pocket: 'mamaEla' | 'elaYangu' | 'elaYaMatumizi';
  targetPocket?: 'mamaEla' | 'elaYangu' | 'elaYaMatumizi';
  amount: number;
  description: string;
  timestamp: number;
  dateStr: string;
  referenceId?: string;
}

const TX_STORAGE_KEY = 'mfb_fund_transactions_v1';

export const transactionTracker = {
  getTransactions(): FundTransaction[] {
    try {
      const data = localStorage.getItem(TX_STORAGE_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Failed to parse fund transactions', e);
    }
    return [];
  },

  saveTransactions(transactions: FundTransaction[]): void {
    try {
      localStorage.setItem(TX_STORAGE_KEY, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save fund transactions', e);
    }
  },

  logTransaction(tx: Omit<FundTransaction, 'id' | 'timestamp' | 'dateStr'>): FundTransaction {
    const fullTx: FundTransaction = {
      ...tx,
      id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      timestamp: Date.now(),
      dateStr: new Date().toISOString(),
    };

    const current = this.getTransactions();
    const updated = [fullTx, ...current].slice(0, 300); // keep recent 300 logs
    this.saveTransactions(updated);
    return fullTx;
  },

  clearTransactions(): void {
    localStorage.removeItem(TX_STORAGE_KEY);
  }
};
