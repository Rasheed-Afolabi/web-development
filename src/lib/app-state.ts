import type { ExpenseCategory, IncomeStream, SavingsGoal, Transaction } from '@/types';
import { STORAGE_KEYS } from '@/data/constants';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

export interface AppSnapshot {
  schemaVersion: number;
  instanceId: string;
  updatedAt: string;
  transactions: Transaction[];
  goal: SavingsGoal;
  weeklyIncomeTargets: Record<IncomeStream, number>;
  customCategories: Record<string, ExpenseCategory>;
}

function parseJson<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export function buildSnapshotFromStores(instanceId: string): AppSnapshot {
  const transactions = useTransactionStore.getState().transactions;
  const goalState = useGoalStore.getState();
  const settingsState = useSettingsStore.getState();
  const categoryState = useCategoryStore.getState();

  return {
    schemaVersion: 1,
    instanceId,
    updatedAt: new Date().toISOString(),
    transactions,
    goal: {
      targetAmount: goalState.targetAmount,
      startDate: goalState.startDate,
      endDate: goalState.endDate,
    },
    weeklyIncomeTargets: settingsState.weeklyIncomeTargets,
    customCategories: categoryState.customCategories,
  };
}

export function applySnapshotToStores(snapshot: AppSnapshot) {
  useTransactionStore.getState().hydrateTransactions(snapshot.transactions ?? []);
  useGoalStore.getState().hydrateGoal(snapshot.goal);
  useSettingsStore.getState().hydrateSettings(snapshot.weeklyIncomeTargets);
  useCategoryStore.getState().hydrateCategories(snapshot.customCategories ?? {});
}

export function readLegacySnapshot(instanceId: string): AppSnapshot | null {
  const transactions = parseJson<Transaction[]>(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS));
  const goal = parseJson<SavingsGoal>(localStorage.getItem(STORAGE_KEYS.GOAL));
  const weeklyIncomeTargets = parseJson<Record<IncomeStream, number>>(
    localStorage.getItem(STORAGE_KEYS.SETTINGS),
  );
  const customCategories = parseJson<Record<string, ExpenseCategory>>(
    localStorage.getItem(STORAGE_KEYS.CATEGORIES),
  );

  const hasLegacyData =
    Boolean(transactions?.length) ||
    Boolean(goal) ||
    Boolean(weeklyIncomeTargets) ||
    Boolean(customCategories && Object.keys(customCategories).length > 0);

  if (!hasLegacyData) return null;

  const fallback = buildSnapshotFromStores(instanceId);

  return {
    ...fallback,
    transactions: transactions ?? fallback.transactions,
    goal: goal ?? fallback.goal,
    weeklyIncomeTargets: weeklyIncomeTargets ?? fallback.weeklyIncomeTargets,
    customCategories: customCategories ?? fallback.customCategories,
  };
}

export function serializeSnapshot(snapshot: AppSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}