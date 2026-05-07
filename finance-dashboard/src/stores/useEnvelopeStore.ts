import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { format } from 'date-fns';
import type { EnvelopeBucket } from '@/types';

interface EnvelopeState {
  buckets: EnvelopeBucket[];
  periodStart: string; // ISO date
  hydrateEnvelopes: (buckets: EnvelopeBucket[], periodStart: string) => void;
  addBucket: (bucket: Omit<EnvelopeBucket, 'id'>) => void;
  updateBucket: (id: string, updates: Partial<EnvelopeBucket>) => void;
  deleteBucket: (id: string) => void;
  resetPeriod: () => void;
}

export const useEnvelopeStore = create<EnvelopeState>()((set) => ({
  buckets: [],
  periodStart: format(new Date(), 'yyyy-MM-dd'),
  hydrateEnvelopes: (buckets, periodStart) =>
    set({ buckets, periodStart: periodStart || format(new Date(), 'yyyy-MM-dd') }),
  addBucket: (bucket) =>
    set((s) => ({ buckets: [...s.buckets, { ...bucket, id: uuidv4() }] })),
  updateBucket: (id, updates) =>
    set((s) => ({
      buckets: s.buckets.map((b) => (b.id === id ? { ...b, ...updates } : b)),
    })),
  deleteBucket: (id) =>
    set((s) => ({ buckets: s.buckets.filter((b) => b.id !== id) })),
  resetPeriod: () => set({ periodStart: format(new Date(), 'yyyy-MM-dd') }),
}));
