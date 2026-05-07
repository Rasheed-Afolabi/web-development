import type { DebtEntry } from '@/types';

export interface PayoffResult {
  totalMonths: number;
  totalInterestPaid: number;
  order: { id: string; name: string; paidOffMonth: number }[];
}

/**
 * Snowball method: pay off smallest balance first.
 */
export function calculateSnowball(debts: DebtEntry[], extraMonthly: number = 0): PayoffResult {
  return simulate([...debts].sort((a, b) => a.balance - b.balance), extraMonthly);
}

/**
 * Avalanche method: pay off highest APR first.
 */
export function calculateAvalanche(debts: DebtEntry[], extraMonthly: number = 0): PayoffResult {
  return simulate([...debts].sort((a, b) => b.apr - a.apr), extraMonthly);
}

function simulate(sorted: DebtEntry[], extraMonthly: number): PayoffResult {
  if (sorted.length === 0) return { totalMonths: 0, totalInterestPaid: 0, order: [] };

  // Working balances in cents
  const balances = new Map(sorted.map((d) => [d.id, d.balance]));
  const order: PayoffResult['order'] = [];
  let totalInterest = 0;
  let month = 0;
  const MAX_MONTHS = 360;

  while (month < MAX_MONTHS) {
    const remaining = sorted.filter((d) => (balances.get(d.id) || 0) > 0);
    if (remaining.length === 0) break;
    month++;

    // Accrue interest
    for (const d of remaining) {
      const bal = balances.get(d.id) || 0;
      const monthlyRate = d.apr / 100 / 12;
      const interest = Math.round(bal * monthlyRate);
      totalInterest += interest;
      balances.set(d.id, bal + interest);
    }

    // Pay minimums
    let surplus = extraMonthly;
    for (const d of remaining) {
      const bal = balances.get(d.id) || 0;
      const payment = Math.min(bal, d.minimumPayment);
      balances.set(d.id, bal - payment);
    }

    // Apply extra payment to first remaining (snowball/avalanche target)
    for (const d of remaining) {
      if (surplus <= 0) break;
      const bal = balances.get(d.id) || 0;
      if (bal <= 0) continue;
      const extra = Math.min(bal, surplus);
      balances.set(d.id, bal - extra);
      surplus -= extra;
    }

    // Check for newly paid off debts
    for (const d of remaining) {
      if ((balances.get(d.id) || 0) <= 0 && !order.find((o) => o.id === d.id)) {
        order.push({ id: d.id, name: d.name, paidOffMonth: month });
      }
    }
  }

  return { totalMonths: month, totalInterestPaid: totalInterest, order };
}

/**
 * Compare with and without extra payment.
 */
export function calculateSavings(
  debts: DebtEntry[],
  extraMonthly: number,
  method: 'snowball' | 'avalanche',
): { monthsSaved: number; interestSaved: number } {
  const calcFn = method === 'snowball' ? calculateSnowball : calculateAvalanche;
  const base = calcFn(debts, 0);
  const withExtra = calcFn(debts, extraMonthly);
  return {
    monthsSaved: base.totalMonths - withExtra.totalMonths,
    interestSaved: base.totalInterestPaid - withExtra.totalInterestPaid,
  };
}
