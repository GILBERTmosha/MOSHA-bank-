import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  onSnapshot,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Loan, Expense, AccountBalances, AppSettings } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
}

/**
 * Strips all `undefined` values recursively so Firestore setDoc / updateDoc
 * never throws "Unsupported field value: undefined".
 */
export function sanitizeForFirestore<T>(data: T): T {
  if (data === undefined) {
    return null as unknown as T;
  }
  if (data === null || typeof data !== 'object') {
    return data;
  }
  try {
    // JSON stringify automatically removes undefined fields from objects
    // and converts undefined in arrays to null
    return JSON.parse(
      JSON.stringify(data, (key, value) => {
        if (value === undefined) {
          return null;
        }
        return value;
      })
    );
  } catch (e) {
    console.error('Error sanitizing data for Firestore:', e);
    return data;
  }
}

export const firebaseSyncService = {
  // Sync Balances to Firestore
  async saveBalances(userId: string, balances: AccountBalances): Promise<void> {
    const path = `users/${userId}/officeData/balances`;
    try {
      const ref = doc(db, 'users', userId, 'officeData', 'balances');
      const cleanData = sanitizeForFirestore({
        ...balances,
        updatedAt: Date.now(),
      });
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Sync Settings to Firestore
  async saveSettings(userId: string, settings: AppSettings): Promise<void> {
    const path = `users/${userId}/officeData/settings`;
    try {
      const ref = doc(db, 'users', userId, 'officeData', 'settings');
      const cleanData = sanitizeForFirestore({
        ...settings,
        updatedAt: Date.now(),
      });
      await setDoc(ref, cleanData, { merge: true });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Sync Loans to Firestore
  async saveLoans(userId: string, loans: Loan[]): Promise<void> {
    const path = `users/${userId}/officeData/loans_bundle`;
    try {
      const ref = doc(db, 'users', userId, 'officeData', 'loans_bundle');
      const cleanData = sanitizeForFirestore({
        loans,
        updatedAt: Date.now(),
      });
      await setDoc(ref, cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Sync Expenses to Firestore
  async saveExpenses(userId: string, expenses: Expense[]): Promise<void> {
    const path = `users/${userId}/officeData/expenses_bundle`;
    try {
      const ref = doc(db, 'users', userId, 'officeData', 'expenses_bundle');
      const cleanData = sanitizeForFirestore({
        expenses,
        updatedAt: Date.now(),
      });
      await setDoc(ref, cleanData);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
    }
  },

  // Load all cloud data for authenticated user
  async loadAllUserData(userId: string): Promise<{
    balances: AccountBalances | null;
    settings: AppSettings | null;
    loans: Loan[] | null;
    expenses: Expense[] | null;
  }> {
    const basePath = `users/${userId}/officeData`;
    try {
      const balancesRef = doc(db, 'users', userId, 'officeData', 'balances');
      const settingsRef = doc(db, 'users', userId, 'officeData', 'settings');
      const loansRef = doc(db, 'users', userId, 'officeData', 'loans_bundle');
      const expensesRef = doc(db, 'users', userId, 'officeData', 'expenses_bundle');

      const [balSnap, setSnap, loanSnap, expSnap] = await Promise.all([
        getDoc(balancesRef),
        getDoc(settingsRef),
        getDoc(loansRef),
        getDoc(expensesRef),
      ]);

      return {
        balances: balSnap.exists() ? (balSnap.data() as AccountBalances) : null,
        settings: setSnap.exists() ? (setSnap.data() as AppSettings) : null,
        loans: loanSnap.exists() && loanSnap.data().loans ? (loanSnap.data().loans as Loan[]) : null,
        expenses: expSnap.exists() && expSnap.data().expenses ? (expSnap.data().expenses as Expense[]) : null,
      };
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, basePath);
      return { balances: null, settings: null, loans: null, expenses: null };
    }
  },
};
