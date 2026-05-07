import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { RecurringBill } from '@/types';

interface RecurringState {
  bills: RecurringBill[];
  hydrateRecurring: (bills: RecurringBill[]) => void;
  addBill: (bill: Omit<RecurringBill, 'id'>) => void;
  updateBill: (id: string, updates: Partial<RecurringBill>) => void;
  deleteBill: (id: string) => void;
  toggleActive: (id: string) => void;
}

export const useRecurringStore = create<RecurringState>()((set) => ({
  bills: [],
  hydrateRecurring: (bills) => set({ bills }),
  addBill: (bill) =>
    set((s) => ({
      bills: [{ ...bill, id: uuidv4() }, ...s.bills],
    })),
  updateBill: (id, updates) =>
    set((s) => ({
      bills: s.bills.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  deleteBill: (id) =>
    set((s) => ({ bills: s.bills.filter((b) => b.id !== id) })),
  toggleActive: (id) =>
    set((s) => ({
      bills: s.bills.map((b) => (b.id === id ? { ...b, isActive: !b.isActive } : b)),
    })),
}));
