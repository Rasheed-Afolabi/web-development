import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoalStore } from '@/stores/useGoalStore';
import { centsToDollars, parseDollarsToCents } from '@/lib/formatters';
import { addMonths, formatISO } from 'date-fns';
import { DEFAULT_GOAL_MONTHS } from '@/data/constants';
import type { SavingsGoal } from '@/types';

interface GoalFormProps {
  goal?: SavingsGoal;
  onSaved?: () => void;
}

export function GoalForm({ goal, onSaved }: GoalFormProps) {
  const { addGoal, updateGoal } = useGoalStore();
  const isEdit = Boolean(goal);

  const now = new Date();
  const [name, setName] = useState(goal?.name ?? '');
  const [target, setTarget] = useState(goal ? centsToDollars(goal.targetAmount) : '');
  const [startDate, setStartDate] = useState(
    goal?.startDate ?? formatISO(now, { representation: 'date' }),
  );
  const [endDate, setEndDate] = useState(
    goal?.endDate ?? formatISO(addMonths(now, DEFAULT_GOAL_MONTHS), { representation: 'date' }),
  );

  const handleSave = () => {
    const cents = parseDollarsToCents(target);
    if (!name.trim() || cents <= 0) return;

    if (isEdit && goal) {
      updateGoal(goal.id, {
        name: name.trim(),
        targetAmount: cents,
        startDate,
        endDate,
      });
    } else {
      addGoal({
        name: name.trim(),
        targetAmount: cents,
        startDate,
        endDate,
      });
    }
    onSaved?.();
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-text-secondary text-xs">Goal Name</Label>
        <Input
          type="text"
          placeholder="e.g. Emergency Fund, New Car..."
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
        />
      </div>
      <div>
        <Label className="text-text-secondary text-xs">Target Amount ($)</Label>
        <Input
          type="number"
          step="100"
          min="1"
          placeholder="30000"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary font-mono"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-text-secondary text-xs">Start Date</Label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
          />
        </div>
        <div>
          <Label className="text-text-secondary text-xs">End Date</Label>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary"
          />
        </div>
      </div>
      <Button
        onClick={handleSave}
        className="bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold hover:scale-[1.02] transition-transform"
      >
        {isEdit ? 'Update Goal' : 'Create Goal'}
      </Button>
    </div>
  );
}
