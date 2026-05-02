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
}

export interface SavingsGoal {
  targetAmount: number; // in cents
  startDate: string; // ISO date
  endDate: string; // ISO date
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
