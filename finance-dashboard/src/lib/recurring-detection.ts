import type { Transaction, RecurringBill } from '@/types';
import { parseISO, differenceInDays } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';

interface CandidateGroup {
  category: string;
  transactions: Transaction[];
}

/**
 * Detect recurring expenses from transaction history.
 * Groups expenses by category, finds monthly repeats (2+ occurrences,
 * +/-5 day tolerance, +/-15% amount variance).
 */
export function detectRecurringBills(
  transactions: Transaction[],
  _existingBillIds: Set<string>,
): RecurringBill[] {
  const expenses = transactions.filter((t) => t.type === 'expense');

  // Group by category
  const groups: Record<string, CandidateGroup> = {};
  for (const tx of expenses) {
    if (!groups[tx.category]) groups[tx.category] = { category: tx.category, transactions: [] };
    groups[tx.category].transactions.push(tx);
  }

  const candidates: RecurringBill[] = [];

  for (const group of Object.values(groups)) {
    if (group.transactions.length < 2) continue;

    // Sort by date
    const sorted = [...group.transactions].sort((a, b) => a.date.localeCompare(b.date));

    // Check if the amounts are consistent (within 15% of median)
    const amounts = sorted.map((t) => t.amount);
    const median = amounts.sort((a, b) => a - b)[Math.floor(amounts.length / 2)];
    const consistent = amounts.every(
      (a) => Math.abs(a - median) / median <= 0.15,
    );
    if (!consistent) continue;

    // Check if intervals are roughly monthly (25-35 days)
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      intervals.push(differenceInDays(parseISO(sorted[i].date), parseISO(sorted[i - 1].date)));
    }
    const avgInterval = intervals.reduce((s, v) => s + v, 0) / intervals.length;
    const isMonthly = intervals.every((d) => d >= 25 && d <= 35);
    const isWeekly = intervals.every((d) => d >= 5 && d <= 9);

    if (!isMonthly && !isWeekly) continue;

    // Estimate next due date
    const lastDate = parseISO(sorted[sorted.length - 1].date);
    const nextDue = new Date(lastDate);
    nextDue.setDate(nextDue.getDate() + Math.round(avgInterval));

    const bill: RecurringBill = {
      id: uuidv4(),
      name: group.category,
      amount: median,
      frequency: isWeekly ? 'weekly' : 'monthly',
      category: group.category,
      nextDueDate: nextDue.toISOString().split('T')[0],
      isActive: true,
      isAutoDetected: true,
    };

    candidates.push(bill);
  }

  return candidates;
}

/**
 * Calculate monthly burn rate from active recurring bills.
 */
export function calculateMonthlyBurnRate(bills: RecurringBill[]): number {
  return bills
    .filter((b) => b.isActive)
    .reduce((total, b) => {
      switch (b.frequency) {
        case 'weekly': return total + b.amount * 4.33;
        case 'biweekly': return total + b.amount * 2.17;
        case 'monthly': return total + b.amount;
        case 'quarterly': return total + b.amount / 3;
        case 'yearly': return total + b.amount / 12;
        default: return total + b.amount;
      }
    }, 0);
}
