import { useState, useMemo } from 'react';
import { format, eachMonthOfInterval, parseISO, startOfMonth, endOfMonth } from 'date-fns';
import { useGoalProgress } from '@/hooks/useGoalProgress';
import { useGoalStore } from '@/stores/useGoalStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { DataCard } from '@/components/dashboard/DataCard';
import { StatDisplay } from '@/components/dashboard/StatDisplay';
import { StatusBadge } from '@/components/layout/StatusBadge';
import { SavingsThermometer } from '@/components/charts/SavingsThermometer';
import { WaterfallChart } from '@/components/charts/WaterfallChart';
import { GoalForm } from '@/components/forms/GoalForm';
import { formatCurrency, formatDate } from '@/lib/formatters';
import { filterTransactionsByDateRange, sumTransactions } from '@/lib/calculations';
import { generateMilestones } from '@/data/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Circle, Plus, Pencil, Trash2 } from 'lucide-react';

export function GoalView() {
  const goals = useGoalStore((s) => s.goals);
  const activeGoalId = useGoalStore((s) => s.activeGoalId);
  const setActiveGoal = useGoalStore((s) => s.setActiveGoal);
  const deleteGoal = useGoalStore((s) => s.deleteGoal);
  const transactions = useTransactionStore((s) => s.transactions);

  const [showForm, setShowForm] = useState(false);
  const [editGoal, setEditGoal] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  const activeGoal = goals.find((g) => g.id === activeGoalId) ?? goals[0] ?? null;
  const progress = useGoalProgress(activeGoal?.id);

  // Dynamic milestones
  const milestones = useMemo(() => {
    if (!activeGoal) return [];
    return generateMilestones(activeGoal.targetAmount);
  }, [activeGoal]);

  // Waterfall data: net savings per month
  const waterfallData = useMemo(() => {
    if (!activeGoal) return [];
    const start = parseISO(activeGoal.startDate);
    const end = new Date() < parseISO(activeGoal.endDate) ? new Date() : parseISO(activeGoal.endDate);
    if (start > end) return [];

    const months = eachMonthOfInterval({ start, end });
    return months.map((month) => {
      const mStart = startOfMonth(month);
      const mEnd = endOfMonth(month);
      const txns = filterTransactionsByDateRange(transactions, mStart, mEnd);
      const income = sumTransactions(txns, 'income');
      const expenses = sumTransactions(txns, 'expense');
      return {
        month: format(month, 'MMM'),
        savings: income - expenses,
      };
    });
  }, [activeGoal, transactions]);

  // Projected completion based on current rate
  const projectedDate = useMemo(() => {
    if (!activeGoal || progress.elapsedDays === 0 || progress.currentSaved <= 0) return null;
    const dailyRate = progress.currentSaved / progress.elapsedDays;
    if (dailyRate <= 0) return null;
    const daysNeeded = progress.targetAmount / dailyRate;
    const projected = new Date(parseISO(activeGoal.startDate));
    projected.setDate(projected.getDate() + Math.ceil(daysNeeded));
    return projected;
  }, [progress, activeGoal]);

  const goalBeingEdited = editGoal ? goals.find((g) => g.id === editGoal) : undefined;

  const handleDelete = (id: string) => {
    deleteGoal(id);
    setShowDeleteConfirm(null);
  };

  if (!activeGoal) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-heading font-bold text-2xl text-text-primary">Goals</h2>
          <Button
            onClick={() => setShowForm(true)}
            className="bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold"
          >
            <Plus size={16} className="mr-1" /> New Goal
          </Button>
        </div>
        <DataCard>
          <p className="text-text-muted text-sm font-body text-center py-8">
            No goals yet. Create your first savings goal!
          </p>
        </DataCard>
        <Dialog open={showForm} onOpenChange={setShowForm}>
          <DialogContent className="bg-bg-elevated border-border-subtle max-w-md">
            <DialogHeader>
              <DialogTitle className="text-text-primary font-heading">New Goal</DialogTitle>
            </DialogHeader>
            <GoalForm onSaved={() => setShowForm(false)} />
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <h2 className="font-heading font-bold text-2xl text-text-primary">Goals</h2>
          <StatusBadge status={progress.paceStatus} />
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold"
        >
          <Plus size={16} className="mr-1" /> New Goal
        </Button>
      </div>

      {/* Goal tabs */}
      {goals.length > 1 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {goals.map((g) => (
            <button
              key={g.id}
              onClick={() => setActiveGoal(g.id)}
              className={`px-4 py-2 rounded-lg text-sm font-body font-medium transition-all flex items-center gap-2 ${
                g.id === activeGoalId
                  ? 'bg-accent-blue text-bg-primary'
                  : 'bg-bg-tertiary text-text-secondary hover:bg-bg-elevated hover:text-text-primary border border-border-subtle'
              }`}
            >
              {g.name}
              <button
                onClick={(e) => { e.stopPropagation(); setEditGoal(g.id); }}
                className="opacity-60 hover:opacity-100"
              >
                <Pencil size={12} />
              </button>
              {goals.length > 1 && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(g.id); }}
                  className="opacity-60 hover:opacity-100 text-accent-red"
                >
                  <Trash2 size={12} />
                </button>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Active goal header info */}
      <p className="text-text-secondary text-sm font-body mb-6">
        {activeGoal.name} — {formatDate(activeGoal.startDate)} to {formatDate(activeGoal.endDate)}
        {goals.length === 1 && (
          <button
            onClick={() => setEditGoal(activeGoal.id)}
            className="ml-3 text-accent-blue hover:underline text-xs"
          >
            Edit
          </button>
        )}
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Thermometer */}
        <div className="lg:col-span-2">
          <DataCard index={0} className="flex justify-center">
            <SavingsThermometer
              currentSaved={progress.currentSaved}
              targetAmount={progress.targetAmount}
              paceStatus={progress.paceStatus}
            />
          </DataCard>
        </div>

        {/* Stats column */}
        <div className="space-y-4">
          <DataCard index={1}>
            <StatDisplay label="Saved So Far" value={progress.currentSaved} size="lg" colorClass="text-accent-green" />
          </DataCard>
          <DataCard index={2}>
            <StatDisplay label="Remaining" value={progress.remainingAmount} size="md" colorClass="text-accent-amber" />
          </DataCard>
          <DataCard index={3}>
            <div>
              <p className="text-text-secondary text-xs font-body mb-1">Gap to Goal</p>
              <div className="space-y-2 mt-2">
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per day</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredDailyRate))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per week</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredWeeklyRate))}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-muted text-xs font-body">Per month</span>
                  <span className="font-mono text-sm text-accent-blue">{formatCurrency(Math.round(progress.requiredMonthlyRate))}</span>
                </div>
              </div>
            </div>
          </DataCard>
          <DataCard index={4}>
            <p className="text-text-secondary text-xs font-body mb-1">Projected Completion</p>
            {projectedDate ? (
              <p className="font-heading font-semibold text-lg text-text-primary">
                {format(projectedDate, 'MMM d, yyyy')}
              </p>
            ) : (
              <p className="text-text-muted text-sm font-body">Not enough data yet</p>
            )}
            <p className="text-text-muted text-xs font-body mt-1">
              {progress.remainingDays} days remaining
            </p>
          </DataCard>
        </div>
      </div>

      {/* Waterfall + Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <DataCard index={5}>
          <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Monthly Savings</h3>
          {waterfallData.length > 0 ? (
            <WaterfallChart data={waterfallData} />
          ) : (
            <p className="text-text-muted text-sm font-body">Savings data will appear here as months pass.</p>
          )}
        </DataCard>

        <DataCard index={6}>
          <h3 className="text-text-secondary text-sm font-heading font-semibold mb-4">Milestones</h3>
          <div className="space-y-3">
            {milestones.map((milestone) => {
              const reached = progress.currentSaved >= milestone;
              return (
                <div key={milestone} className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                    reached ? 'bg-accent-green-dim' : 'bg-bg-tertiary'
                  }`}>
                    {reached ? (
                      <Check size={14} className="text-accent-green" />
                    ) : (
                      <Circle size={14} className="text-text-muted" />
                    )}
                  </div>
                  <span className={`font-mono text-sm ${reached ? 'text-accent-green' : 'text-text-muted'}`}>
                    {formatCurrency(milestone)}
                  </span>
                  {reached && (
                    <span className="text-accent-green text-xs font-body">Reached!</span>
                  )}
                </div>
              );
            })}
          </div>
        </DataCard>
      </div>

      {/* New Goal Dialog */}
      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="bg-bg-elevated border-border-subtle max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">New Goal</DialogTitle>
          </DialogHeader>
          <GoalForm onSaved={() => setShowForm(false)} />
        </DialogContent>
      </Dialog>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editGoal} onOpenChange={(open) => !open && setEditGoal(null)}>
        <DialogContent className="bg-bg-elevated border-border-subtle max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Edit Goal</DialogTitle>
          </DialogHeader>
          {goalBeingEdited && (
            <GoalForm goal={goalBeingEdited} onSaved={() => setEditGoal(null)} />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!showDeleteConfirm} onOpenChange={(open) => !open && setShowDeleteConfirm(null)}>
        <DialogContent className="bg-bg-elevated border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Delete Goal?</DialogTitle>
          </DialogHeader>
          <p className="text-text-secondary text-sm font-body">
            This will permanently remove this goal. Your transactions are not affected.
          </p>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteConfirm(null)}
              className="border-border-subtle text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="bg-accent-red hover:bg-accent-red/90 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
