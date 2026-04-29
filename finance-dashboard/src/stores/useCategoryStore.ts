import { create } from 'zustand';
import type { ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';

interface CategoryState {
  customCategories: Record<string, ExpenseCategory>;
  hydrateCategories: (categories: Record<string, ExpenseCategory>) => void;
  addCategory: (id: string, category: ExpenseCategory) => void;
  removeCategory: (id: string) => void;
  getAllCategories: () => Record<string, ExpenseCategory>;
}

export const useCategoryStore = create<CategoryState>()((set, get) => ({
  customCategories: {},
  hydrateCategories: (categories) => set({ customCategories: categories }),
  addCategory: (id, category) =>
    set((state) => ({
      customCategories: { ...state.customCategories, [id]: category },
    })),
  removeCategory: (id) =>
    set((state) => {
      const { [id]: _, ...rest } = state.customCategories;
      return { customCategories: rest };
    }),
  getAllCategories: () => ({
    ...EXPENSE_CATEGORIES,
    ...get().customCategories,
  }),
}));
