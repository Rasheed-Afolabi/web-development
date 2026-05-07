import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { NetWorthEntry, NetWorthSnapshot } from '@/types';

interface NetWorthState {
  snapshots: NetWorthSnapshot[];
  currentEntries: NetWorthEntry[];
  hydrateNetWorth: (snapshots: NetWorthSnapshot[], entries: NetWorthEntry[]) => void;
  addEntry: (entry: Omit<NetWorthEntry, 'id'>) => void;
  updateEntry: (id: string, updates: Partial<NetWorthEntry>) => void;
  deleteEntry: (id: string) => void;
  saveSnapshot: () => void;
}

export const useNetWorthStore = create<NetWorthState>()((set, get) => ({
  snapshots: [],
  currentEntries: [],
  hydrateNetWorth: (snapshots, currentEntries) => set({ snapshots, currentEntries }),
  addEntry: (entry) =>
    set((s) => ({
      currentEntries: [...s.currentEntries, { ...entry, id: uuidv4() }],
    })),
  updateEntry: (id, updates) =>
    set((s) => ({
      currentEntries: s.currentEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  deleteEntry: (id) =>
    set((s) => ({ currentEntries: s.currentEntries.filter((e) => e.id !== id) })),
  saveSnapshot: () => {
    const { currentEntries, snapshots } = get();
    const totalAssets = currentEntries.filter((e) => e.side === 'asset').reduce((s, e) => s + e.balance, 0);
    const totalLiabilities = currentEntries.filter((e) => e.side === 'liability').reduce((s, e) => s + e.balance, 0);
    const snapshot: NetWorthSnapshot = {
      id: uuidv4(),
      date: new Date().toISOString().split('T')[0],
      totalAssets,
      totalLiabilities,
      netWorth: totalAssets - totalLiabilities,
      entries: [...currentEntries],
    };
    set({ snapshots: [...snapshots, snapshot] });
  },
}));
