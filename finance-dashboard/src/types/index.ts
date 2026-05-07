export type IncomeStream = 'ai-projects' | 'delivery' | 'factory' | 'freelance' | 'tutoring' | 'rideshare' | 'tips' | 'investments' | 'rental-income' | 'reselling' | 'other';

export type ExpenseCategoryGroup = 'essentials' | 'earning-costs' | 'lifestyle' | 'growth' | 'commitments';

export type PaceStatus = 'on-track' | 'off-track' | 'danger';

export interface IncomeStreamConfig {
  label: string;
  icon: string;
  color: string;
}

export interface ExpenseCategory {
  label: string;
  group: ExpenseCategoryGroup;
  icon: string;
  color: string;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number; // in cents
  category: string;
  incomeStream?: IncomeStream;
  date: string; // ISO date string YYYY-MM-DD
  note?: string;
  createdAt: string;
  // Phase E — Collaboration & Multi-Currency
  memberId?: string;
  currency?: CurrencyCode;
  originalAmount?: number; // in minor units of original currency
  exchangeRate?: number;
}

// ---------- Phase B — Recurring & Forecasting ----------

export type RecurrenceFrequency = 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';

export interface RecurringBill {
  id: string;
  name: string;
  amount: number; // in cents
  frequency: RecurrenceFrequency;
  category: string;
  nextDueDate: string; // ISO date
  isActive: boolean;
  isAutoDetected?: boolean;
}

// ---------- Phase C — Net Worth & Debt ----------

export type AssetType = 'cash' | 'investment' | 'property' | 'vehicle' | 'other-asset';
export type LiabilityType = 'credit-card' | 'student-loan' | 'mortgage' | 'auto-loan' | 'personal-loan' | 'other-liability';

export interface NetWorthEntry {
  id: string;
  name: string;
  type: AssetType | LiabilityType;
  side: 'asset' | 'liability';
  balance: number; // in cents (positive)
}

export interface NetWorthSnapshot {
  id: string;
  date: string; // ISO date
  totalAssets: number;
  totalLiabilities: number;
  netWorth: number;
  entries: NetWorthEntry[];
}

export interface DebtEntry {
  id: string;
  name: string;
  type: LiabilityType;
  balance: number; // in cents
  apr: number; // annual percentage rate, e.g. 19.99
  minimumPayment: number; // in cents
}

// ---------- Phase D — Budgeting Modes ----------

export type BudgetMode = 'allowance' | 'envelope';

export interface EnvelopeBucket {
  id: string;
  name: string;
  allocated: number; // in cents per period
  color: string;
  category?: string; // optional link to expense category
}

// ---------- Phase E — Collaboration & Multi-Currency ----------

export interface HouseholdMember {
  id: string;
  name: string;
  color: string;
  avatarEmoji?: string;
}

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'NGN' | 'JPY' | 'INR' | 'BRL' | 'MXN';

export interface ExchangeRateCache {
  base: CurrencyCode;
  rates: Record<string, number>;
  fetchedAt: string; // ISO datetime
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number; // in cents
  startDate: string; // ISO date
  endDate: string; // ISO date
}

export type TimeRangePreset = 'today' | 'this-week' | 'this-month' | 'last-month' | 'all-time' | 'custom';

export type ComparisonMode = 'none' | 'previous-period';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface WeeklyIncomeTarget {
  stream: IncomeStream;
  amount: number; // in cents
}

export interface GoalProgress {
  currentSaved: number;
  targetAmount: number;
  totalDays: number;
  elapsedDays: number;
  remainingDays: number;
  remainingAmount: number;
  requiredDailyRate: number;
  requiredWeeklyRate: number;
  requiredMonthlyRate: number;
  expectedByNow: number;
  paceStatus: PaceStatus;
  percentComplete: number;
}

export interface CategoryGroupInfo {
  id: ExpenseCategoryGroup;
  label: string;
  description: string;
}
