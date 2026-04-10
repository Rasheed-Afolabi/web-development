export const DEFAULT_GOAL_TARGET = 3000000; // $30,000 in cents
export const DEFAULT_GOAL_MONTHS = 6;

export const MILESTONES = [500000, 1000000, 1500000, 2000000, 2500000, 3000000]; // in cents

export const STORAGE_KEYS = {
  TRANSACTIONS: 'rasko-transactions',
  GOAL: 'rasko-goal',
  SETTINGS: 'rasko-settings',
  CATEGORIES: 'rasko-categories',
  BACKUP: 'rasko-finance-backup',
} as const;
