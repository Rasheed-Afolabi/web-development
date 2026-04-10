import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ExpenseCategory } from '@/types';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { STORAGE_KEYS } from '@/data/constants';

interface CategoryState {
  customCategories: Record<string, ExpenseCategory>;
  addCategory: (id: string, category: ExpenseCategory) => void;
  removeCategory: (id: string) => void;
  getAllCategories: () => Record<string, ExpenseCategory>;
}

export const useCategoryStore = create<CategoryState>()(
  persist(
    (set, get) => ({
      customCategories: {},
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
    }),
    { name: STORAGE_KEYS.CATEGORIES },
  ),
);
