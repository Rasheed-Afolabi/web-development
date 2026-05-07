import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { DebtEntry } from '@/types';

interface DebtState {
  debts: DebtEntry[];
  hydrateDebts: (debts: DebtEntry[]) => void;
  addDebt: (debt: Omit<DebtEntry, 'id'>) => void;
  updateDebt: (id: string, updates: Partial<DebtEntry>) => void;
  deleteDebt: (id: string) => void;
}

export const useDebtStore = create<DebtState>()((set) => ({
  debts: [],
  hydrateDebts: (debts) => set({ debts }),
  addDebt: (debt) =>
    set((s) => ({ debts: [...s.debts, { ...debt, id: uuidv4() }] })),
  updateDebt: (id, updates) =>
    set((s) => ({
      debts: s.debts.map((d) => (d.id === id ? { ...d, ...updates } : d)),
    })),
  deleteDebt: (id) =>
    set((s) => ({ debts: s.debts.filter((d) => d.id !== id) })),
}));
