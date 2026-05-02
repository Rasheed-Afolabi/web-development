import { useState, useMemo } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import type { Transaction, IncomeStream } from '@/types';
import { formatCurrency, formatDate, parseDollarsToCents, centsToDollars } from '@/lib/formatters';
import { CategoryBadge } from './CategoryBadge';
import { INCOME_STREAMS, INCOME_STREAM_IDS } from '@/data/income-streams';
import { EXPENSE_CATEGORIES, CATEGORY_GROUPS } from '@/data/expense-categories';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { format } from 'date-fns';

interface TransactionRowProps {
  transaction: Transaction;
  showDate?: boolean;
}

export function TransactionRow({ transaction, showDate = false }: TransactionRowProps) {
  const deleteTransaction = useTransactionStore((s) => s.deleteTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allExpenseCategories = { ...EXPENSE_CATEGORIES, ...customCategories };
  const isIncome = transaction.type === 'income';

  const categoryOptions = useMemo(
    () =>
      Object.entries(allExpenseCategories).map(([id, cat]) => ({
        value: id,
        label: cat.label,
        group: cat.group,
      })),
    [allExpenseCategories],
  );

  const categoryGroupLabels = useMemo(
    () =>
      CATEGORY_GROUPS.reduce<Record<string, string>>((acc, g) => {
        acc[g.id] = g.label;
        return acc;
      }, {}),
    [],
  );

  const incomeOptions = useMemo(
    () =>
      INCOME_STREAM_IDS.map((id) => ({
        value: id,
        label: INCOME_STREAMS[id].label,
      })),
    [],
  );

  const [showEdit, setShowEdit] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Edit form state
  const [editAmount, setEditAmount] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editIncomeStream, setEditIncomeStream] = useState<IncomeStream | ''>('');
  const [editDate, setEditDate] = useState('');
  const [editNote, setEditNote] = useState('');
  const [editError, setEditError] = useState('');

  const openEdit = () => {
    setEditAmount(centsToDollars(transaction.amount));
    setEditCategory(transaction.category);
    setEditIncomeStream(transaction.incomeStream ?? '');
    setEditDate(transaction.date);
    setEditNote(transaction.note ?? '');
    setEditError('');
    setShowEdit(true);
  };

  const handleSaveEdit = () => {
    setEditError('');
    const cents = parseDollarsToCents(editAmount);
    if (cents <= 0) {
      setEditError('Amount must be greater than 0');
      return;
    }
    if (new Date(editDate) > new Date()) {
      setEditError('Date cannot be in the future');
      return;
    }
    if (transaction.type === 'expense' && !editCategory) {
      setEditError('Please select a category');
      return;
    }
    if (transaction.type === 'income' && !editIncomeStream) {
      setEditError('Please select an income stream');
      return;
    }

    updateTransaction(transaction.id, {
      amount: cents,
      category: transaction.type === 'income' ? (editIncomeStream || 'other') : editCategory,
      incomeStream: transaction.type === 'income' ? (editIncomeStream as IncomeStream) : undefined,
      date: editDate,
      note: editNote || undefined,
    });
    setShowEdit(false);
  };

  const handleDelete = () => {
    deleteTransaction(transaction.id);
    setShowDeleteConfirm(false);
  };

  return (
    <>
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
        <div className="flex items-center gap-2">
          <span className={`font-mono text-sm font-semibold ${isIncome ? 'text-accent-green' : 'text-accent-red'}`}>
            {isIncome ? '+' : '-'}{formatCurrency(transaction.amount)}
          </span>
          <button
            onClick={openEdit}
            className="md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-accent-blue transition-all p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="md:opacity-0 md:group-hover:opacity-100 text-text-muted hover:text-accent-red transition-all p-1.5 min-w-[28px] min-h-[28px] flex items-center justify-center"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="bg-bg-elevated border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Edit Transaction</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide border-border-subtle text-text-secondary">
              {transaction.type === 'income' ? 'Income' : 'Expense'}
            </div>

            <div>
              <Label className="text-text-secondary text-xs">Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0.01"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary font-mono"
              />
            </div>

            {transaction.type === 'expense' ? (
              <SearchableSelect
                label="Category"
                options={categoryOptions}
                value={editCategory}
                onChange={setEditCategory}
                placeholder="Search categories..."
                groupLabels={categoryGroupLabels}
              />
            ) : (
              <SearchableSelect
                label="Income Stream"
                options={incomeOptions}
                value={editIncomeStream}
                onChange={(v) => setEditIncomeStream(v as IncomeStream | '')}
                placeholder="Search income streams..."
              />
            )}

            <div>
              <Label className="text-text-secondary text-xs">Date</Label>
              <Input
                type="date"
                value={editDate}
                onChange={(e) => setEditDate(e.target.value)}
                max={format(new Date(), 'yyyy-MM-dd')}
                className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
              />
            </div>

            <div>
              <Label className="text-text-secondary text-xs">Note (optional)</Label>
              <Input
                type="text"
                placeholder="What was this for?"
                value={editNote}
                onChange={(e) => setEditNote(e.target.value)}
                className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
              />
            </div>

            {editError && <p className="text-accent-red text-xs font-body">{editError}</p>}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowEdit(false)}
              className="border-border-subtle text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              className="bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-semibold"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <DialogContent className="bg-bg-elevated border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Delete Transaction?</DialogTitle>
          </DialogHeader>
          <p className="text-text-secondary text-sm font-body">
            This will permanently delete this {isIncome ? 'income' : 'expense'} of{' '}
            <span className="font-mono font-semibold text-text-primary">{formatCurrency(transaction.amount)}</span>.
            This cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(false)}
              className="border-border-subtle text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className="bg-accent-red hover:bg-accent-red/90 text-white"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
