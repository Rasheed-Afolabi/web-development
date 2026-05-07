export const DEFAULT_GOAL_TARGET = 3000000; // $30,000 in cents
export const DEFAULT_GOAL_MONTHS = 6;

export const MILESTONES = [500000, 1000000, 1500000, 2000000, 2500000, 3000000]; // in cents

export function generateMilestones(targetAmount: number, count: number = 6): number[] {
  if (targetAmount <= 0) return [];
  const step = Math.ceil(targetAmount / count);
  const milestones: number[] = [];
  for (let i = 1; i <= count; i++) {
    milestones.push(Math.min(step * i, targetAmount));
  }
  // Ensure the final milestone is exactly the target
  if (milestones[milestones.length - 1] !== targetAmount) {
    milestones[milestones.length - 1] = targetAmount;
  }
  return milestones;
}

export const STORAGE_KEYS = {
  TRANSACTIONS: 'rasko-transactions',
  GOAL: 'rasko-goal',
  SETTINGS: 'rasko-settings',
  CATEGORIES: 'rasko-categories',
  BACKUP: 'rasko-finance-backup',
} as const;
