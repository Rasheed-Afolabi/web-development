import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Transaction, IncomeStream } from '@/types';
import { STORAGE_KEYS } from '@/data/constants';

interface TransactionInput {
  type: 'income' | 'expense';
  amount: number;
  category: string;
  incomeStream?: IncomeStream;
  date: string;
  note?: string;
}

interface TransactionState {
  transactions: Transaction[];
  addTransaction: (input: TransactionInput) => void;
  updateTransaction: (id: string, updates: Partial<TransactionInput>) => void;
  deleteTransaction: (id: string) => void;
  importTransactions: (transactions: Transaction[]) => void;
  clearAll: () => void;
}

export const useTransactionStore = create<TransactionState>()(
  persist(
    (set) => ({
      transactions: [],
      addTransaction: (input) =>
        set((state) => ({
          transactions: [
            {
              ...input,
              id: uuidv4(),
              createdAt: new Date().toISOString(),
            },
            ...state.transactions,
          ],
        })),
      updateTransaction: (id, updates) =>
        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, ...updates } : t,
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((t) => t.id !== id),
        })),
      importTransactions: (transactions) =>
        set((state) => ({
          transactions: [...transactions, ...state.transactions],
        })),
      clearAll: () => set({ transactions: [] }),
    }),
    { name: STORAGE_KEYS.TRANSACTIONS },
  ),
);
