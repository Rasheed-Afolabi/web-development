import type { RecurringBill, IncomeStream } from '@/types';
import { addDays, format, parseISO, isSameDay, getDay } from 'date-fns';

export interface ForecastDay {
  date: string;
  income: number;
  expense: number;
  cumulative: number;
}

interface ForecastParams {
  days: number;
  recurringBills: RecurringBill[];
  weeklyIncomeTargets: Record<IncomeStream, number>;
  estimatedDailySpend: number; // in cents
  goalDailyContribution: number; // in cents
}

/**
 * Generate a forward-looking cash flow projection.
 * Income is spread across the week based on weekly targets (daily = weekly / 7).
 * Expenses come from recurring bills on due dates + estimated daily spend + goal contribution.
 */
export function generateForecast(params: ForecastParams): ForecastDay[] {
  const { days: numDays, recurringBills, weeklyIncomeTargets, estimatedDailySpend, goalDailyContribution } = params;

  const totalWeeklyIncome = Object.values(weeklyIncomeTargets).reduce((s, v) => s + v, 0);
  const dailyIncome = Math.round(totalWeeklyIncome / 7);

  const today = new Date();
  const forecast: ForecastDay[] = [];
  let cumulative = 0;

  for (let i = 0; i < numDays; i++) {
    const date = addDays(today, i);
    const dateStr = format(date, 'yyyy-MM-dd');

    let dayIncome = dailyIncome;
    let dayExpense = estimatedDailySpend + goalDailyContribution;

    // Add recurring bill expenses on their due dates
    for (const bill of recurringBills) {
      if (!bill.isActive) continue;
      // Check if bill is due on this date
      const dueDate = parseISO(bill.nextDueDate);
      if (bill.frequency === 'monthly') {
        if (dueDate.getDate() === date.getDate()) dayExpense += bill.amount;
      } else if (bill.frequency === 'weekly') {
        if (getDay(dueDate) === getDay(date)) dayExpense += bill.amount;
      } else if (isSameDay(dueDate, date)) {
        dayExpense += bill.amount;
      }
    }

    const net = dayIncome - dayExpense;
    cumulative += net;

    forecast.push({
      date: dateStr,
      income: dayIncome,
      expense: dayExpense,
      cumulative,
    });
  }

  return forecast;
}
