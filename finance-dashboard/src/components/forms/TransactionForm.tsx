import { useState, useMemo } from 'react';
import { format } from 'date-fns';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchableSelect } from '@/components/forms/SearchableSelect';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useCategoryStore } from '@/stores/useCategoryStore';
import { INCOME_STREAMS, INCOME_STREAM_IDS } from '@/data/income-streams';
import { EXPENSE_CATEGORIES, CATEGORY_GROUPS } from '@/data/expense-categories';
import { parseDollarsToCents } from '@/lib/formatters';
import type { IncomeStream } from '@/types';

interface TransactionFormProps {
  defaultType?: 'income' | 'expense';
  onSuccess?: () => void;
}

export function TransactionForm({ defaultType = 'expense', onSuccess }: TransactionFormProps) {
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const customCategories = useCategoryStore((s) => s.customCategories);
  const allExpenseCategories = { ...EXPENSE_CATEGORIES, ...customCategories };

  const [type, setType] = useState<'income' | 'expense'>(defaultType);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [incomeStream, setIncomeStream] = useState<IncomeStream | ''>('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [note, setNote] = useState('');
  const [customName, setCustomName] = useState('');
  const [error, setError] = useState('');
  const [splitSuggestion, setSplitSuggestion] = useState<{ amount: number } | null>(null);

  const showCustomName =
    (type === 'expense' && category === 'miscellaneous') ||
    (type === 'income' && incomeStream === 'other');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cents = parseDollarsToCents(amount);
    if (cents <= 0) {
      setError('Amount must be greater than 0');
      return;
    }
    if (new Date(date) > new Date()) {
      setError('Date cannot be in the future');
      return;
    }
    if (type === 'expense' && !category) {
      setError('Please select a category');
      return;
    }
    if (type === 'income' && !incomeStream) {
      setError('Please select an income stream');
      return;
    }
    if (showCustomName && !customName.trim()) {
      setError('Please enter a name for this item');
      return;
    }

    const finalNote = showCustomName
      ? (note ? `${customName.trim()} — ${note}` : customName.trim())
      : (note || undefined);

    addTransaction({
      type,
      amount: cents,
      category: type === 'income' ? (incomeStream || 'other') : category,
      incomeStream: type === 'income' ? (incomeStream as IncomeStream) : undefined,
      date,
      note: finalNote,
    });

    // Show split suggestion for income
    if (type === 'income' && cents >= 1000) {
      setSplitSuggestion({ amount: cents });
      setTimeout(() => setSplitSuggestion(null), 5000);
    }

    setAmount('');
    setCategory('');
    setIncomeStream('');
    setNote('');
    setCustomName('');
    onSuccess?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType('expense')}
          className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
            type === 'expense'
              ? 'bg-accent-red-dim text-accent-red border border-accent-red/30'
              : 'bg-bg-tertiary text-text-secondary border border-transparent'
          }`}
        >
          Expense
        </button>
        <button
          type="button"
          onClick={() => setType('income')}
          className={`flex-1 py-2 rounded-lg text-sm font-body font-medium transition-all ${
            type === 'income'
              ? 'bg-accent-green-dim text-accent-green border border-accent-green/30'
              : 'bg-bg-tertiary text-text-secondary border border-transparent'
          }`}
        >
          Income
        </button>
      </div>

      <div>
        <Label className="text-text-secondary text-xs">Amount ($)</Label>
        <Input
          type="number"
          step="0.01"
          min="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary font-mono"
          required
        />
      </div>

      {type === 'expense' ? (
        <SearchableSelect
          label="Category"
          options={categoryOptions}
          value={category}
          onChange={setCategory}
          placeholder="Search categories..."
          groupLabels={categoryGroupLabels}
        />
      ) : (
        <SearchableSelect
          label="Income Stream"
          options={incomeOptions}
          value={incomeStream}
          onChange={(v) => setIncomeStream(v as IncomeStream | '')}
          placeholder="Search income streams..."
        />
      )}

      {showCustomName && (
        <div>
          <Label className="text-text-secondary text-xs">What is it?</Label>
          <Input
            type="text"
            placeholder="e.g. Freelance gig, Gift, Side hustle..."
            value={customName}
            onChange={(e) => setCustomName(e.target.value)}
            className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
            required
          />
        </div>
      )}

      <div>
        <Label className="text-text-secondary text-xs">Date</Label>
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          max={format(new Date(), 'yyyy-MM-dd')}
          className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
          required
        />
      </div>

      <div>
        <Label className="text-text-secondary text-xs">Note (optional)</Label>
        <Input
          type="text"
          placeholder="What was this for?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
        />
      </div>

      {error && <p className="text-accent-red text-xs font-body">{error}</p>}

      <Button
        type="submit"
        className="w-full bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold hover:scale-[1.02] transition-transform"
      >
        <Plus size={16} className="mr-1" />
        Add {type === 'income' ? 'Income' : 'Expense'}
      </Button>

      {splitSuggestion && (
        <div className="rounded-lg border border-[#1E3A6B] bg-[#0F1F36] p-3 space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
          <p className="text-[11px] font-semibold text-[#60A5FA] uppercase tracking-wider">Income Split Suggestion</p>
          <div className="flex gap-1.5">
            {[
              { label: 'Save', pct: 20, color: '#34D399' },
              { label: 'Bills', pct: 30, color: '#FBBF24' },
              { label: 'Spend', pct: 50, color: '#60A5FA' },
            ].map((seg) => (
              <div key={seg.label} className="flex-1">
                <div
                  className="h-2 rounded-full"
                  style={{ background: seg.color }}
                />
                <p className="text-[10px] font-mono mt-1 text-center" style={{ color: seg.color }}>
                  {seg.label} · ${((splitSuggestion.amount * seg.pct) / 10000).toFixed(0)}
                </p>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSplitSuggestion(null)}
            className="text-[10px] text-[#7A8BA0] hover:text-[#9898B0] transition-colors"
          >
            Got it
          </button>
        </div>
      )}
    </form>
  );
}
