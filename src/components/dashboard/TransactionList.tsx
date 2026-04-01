import type { Transaction } from '@/types';
import { TransactionRow } from './TransactionRow';
import { formatDate } from '@/lib/formatters';
import { groupByDate } from '@/lib/calculations';
import { useMemo } from 'react';

interface TransactionListProps {
  transactions: Transaction[];
  groupDates?: boolean;
}

export function TransactionList({ transactions, groupDates = true }: TransactionListProps) {
  const grouped = useMemo(() => {
    if (!groupDates) return null;
    const byDate = groupByDate(transactions);
    return Object.entries(byDate).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions, groupDates]);

  if (transactions.length === 0) return null;

  if (!groupDates) {
    return (
      <div className="space-y-0.5">
        {transactions.map((t) => (
          <TransactionRow key={t.id} transaction={t} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {grouped!.map(([date, txns]) => (
        <div key={date}>
          <p className="text-text-muted text-xs font-body mb-2 px-2">
            {formatDate(date, 'EEEE, MMM d')}
          </p>
          <div className="space-y-0.5">
            {txns.map((t) => (
              <TransactionRow key={t.id} transaction={t} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
