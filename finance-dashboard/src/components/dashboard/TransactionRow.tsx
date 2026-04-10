import { Trash2 } from 'lucide-react';
import type { Transaction } from '@/types';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { CategoryBadge } from './CategoryBadge';
import { INCOME_STREAMS } from '@/data/income-streams';
import { useTransactionStore } from '@/stores/useTransactionStore';

interface TransactionRowProps {
  transaction: Transaction;
  showDate?: boolean;
}

export function TransactionRow({ transaction, showDate = false }: TransactionRowProps) {
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const isIncome = transaction.type === 'income';

  return (
    <div className="flex items-center justify-between py-3 px-2 group hover:bg-bg-tertiary/50 rounded-lg transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        {isIncome && transaction.incomeStream ? (
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: INCOME_STREAMS[transaction.incomeStream].color + '20' }}
          >
            <span className="text-xs font-bold" style={{ color: INCOME_STREAMS[transaction.incomeStream].color }}>
              {INCOME_STREAMS[transaction.incomeStream].label.charAt(0)}
            </span>
          </div>
        ) : (
          <div className="shrink-0">
            <CategoryBadge categoryId={transaction.category} />
          </div>
        )}
        <div className="min-w-0">
          {isIncome && transaction.incomeStream && (
            <p className="text-text-primary text-sm font-body truncate">
              {INCOME_STREAMS[transaction.incomeStream].label}
            </p>
          )}
          {transaction.note && (
            <p className="text-text-muted text-xs font-body truncate">{transaction.note}</p>
          )}
          {showDate && (
            <p className="text-text-muted text-xs font-body">{formatDate(transaction.date, 'MMM d')}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-mono text-sm font-semibold ${isIncome ? 'text-accent-green' : 'text-accent-red'}`}>
          {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
        </span>
        <button
          onClick={() => deleteTransaction(transaction.id)}
          className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-accent-red transition-all p-1"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
