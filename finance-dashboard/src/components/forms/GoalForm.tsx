import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGoalStore } from '@/stores/useGoalStore';
import { centsToDollars, parseDollarsToCents } from '@/lib/formatters';

export function GoalForm() {
  const goal = useGoalStore();
  const [target, setTarget] = useState(centsToDollars(goal.targetAmount));
  const [startDate, setStartDate] = useState(goal.startDate);
  const [endDate, setEndDate] = useState(goal.endDate);

  const handleSave = () => {
    goal.updateGoal({
      targetAmount: parseDollarsToCents(target),
      startDate,
      endDate,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label className="text-text-secondary text-xs">Target Amount ($)</Label>
        <Input
          type="number"
          step="100"
          min="1"
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
        Save Goal
      </Button>
    </div>
  );
}
