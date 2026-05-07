import type {
  BudgetMode,
  CurrencyCode,
  DebtEntry,
  EnvelopeBucket,
  ExpenseCategory,
  HouseholdMember,
  IncomeStream,
  NetWorthEntry,
  NetWorthSnapshot,
  RecurringBill,
  SavingsGoal,
  Transaction,
} from '@/types';
import { STORAGE_KEYS } from '@/data/constants';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { useGoalStore } from '@/stores/useGoalStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { useNetWorthStore } from '@/stores/useNetWorthStore';
import { useDebtStore } from '@/stores/useDebtStore';
import { useEnvelopeStore } from '@/stores/useEnvelopeStore';
import { v4 as uuidv4 } from 'uuid';

export interface AppSnapshot {
  schemaVersion: number;
  instanceId: string;
  updatedAt: string;
  transactions: Transaction[];
  goal?: { targetAmount: number; startDate: string; endDate: string };
  goals?: SavingsGoal[];
  activeGoalId?: string | null;
  weeklyIncomeTargets: Record<IncomeStream, number>;
  customCategories: Record<string, ExpenseCategory>;
  // v3 fields — all optional for backward compat
  recurringBills?: RecurringBill[];
  netWorthSnapshots?: NetWorthSnapshot[];
  netWorthEntries?: NetWorthEntry[];
  debtEntries?: DebtEntry[];
  envelopeBuckets?: EnvelopeBucket[];
  budgetMode?: BudgetMode;
  envelopePeriodStart?: string;
  householdMembers?: HouseholdMember[];
  currentMemberId?: string;
  defaultCurrency?: CurrencyCode;
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
  const recurringState = useRecurringStore.getState();
  const netWorthState = useNetWorthStore.getState();
  const debtState = useDebtStore.getState();
  const envelopeState = useEnvelopeStore.getState();

  return {
    schemaVersion: 3,
    instanceId,
    updatedAt: new Date().toISOString(),
    transactions,
    goals: goalState.goals,
    activeGoalId: goalState.activeGoalId,
    weeklyIncomeTargets: settingsState.weeklyIncomeTargets,
    customCategories: categoryState.customCategories,
    // v3 fields
    budgetMode: settingsState.budgetMode,
    householdMembers: settingsState.householdMembers,
    currentMemberId: settingsState.currentMemberId,
    defaultCurrency: settingsState.defaultCurrency,
    recurringBills: recurringState.bills,
    netWorthSnapshots: netWorthState.snapshots,
    netWorthEntries: netWorthState.currentEntries,
    debtEntries: debtState.debts,
    envelopeBuckets: envelopeState.buckets,
    envelopePeriodStart: envelopeState.periodStart,
  };
}

export function applySnapshotToStores(snapshot: AppSnapshot) {
  useTransactionStore.getState().hydrateTransactions(snapshot.transactions ?? []);

  // Handle v1 → v2 migration (single goal → array)
  if (snapshot.goals && snapshot.goals.length > 0) {
    const goals = snapshot.goals.map((g) => ({
      ...g,
      id: g.id || uuidv4(),
      name: g.name || 'Savings Goal',
    }));
    useGoalStore.getState().hydrateGoals(goals, snapshot.activeGoalId ?? goals[0]?.id ?? null);
  } else if (snapshot.goal) {
    useGoalStore.getState().hydrateGoal(snapshot.goal);
  }

  useSettingsStore.getState().hydrateSettings(snapshot.weeklyIncomeTargets);
  useCategoryStore.getState().hydrateCategories(snapshot.customCategories ?? {});

  // v3 — Settings store extended fields
  useSettingsStore.getState().hydrateSettingsV3({
    budgetMode: snapshot.budgetMode,
    householdMembers: snapshot.householdMembers,
    currentMemberId: snapshot.currentMemberId,
    defaultCurrency: snapshot.defaultCurrency,
  });

  // v3 — New stores
  useRecurringStore.getState().hydrateRecurring(snapshot.recurringBills ?? []);
  useNetWorthStore.getState().hydrateNetWorth(snapshot.netWorthSnapshots ?? [], snapshot.netWorthEntries ?? []);
  useDebtStore.getState().hydrateDebts(snapshot.debtEntries ?? []);
  useEnvelopeStore.getState().hydrateEnvelopes(snapshot.envelopeBuckets ?? [], snapshot.envelopePeriodStart ?? '');
}

export function readLegacySnapshot(instanceId: string): AppSnapshot | null {
  const transactions = parseJson<Transaction[]>(localStorage.getItem(STORAGE_KEYS.TRANSACTIONS));
  const goal = parseJson<{ targetAmount: number; startDate: string; endDate: string }>(localStorage.getItem(STORAGE_KEYS.GOAL));
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
    goal: goal ?? undefined,
    goals: fallback.goals,
    activeGoalId: fallback.activeGoalId,
    weeklyIncomeTargets: weeklyIncomeTargets ?? fallback.weeklyIncomeTargets,
    customCategories: customCategories ?? fallback.customCategories,
  };
}

export function serializeSnapshot(snapshot: AppSnapshot) {
  return JSON.stringify(snapshot, null, 2);
}
