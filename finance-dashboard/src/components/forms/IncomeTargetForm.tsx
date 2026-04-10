import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { INCOME_STREAMS, INCOME_STREAM_IDS } from '@/data/income-streams';
import { centsToDollars, parseDollarsToCents } from '@/lib/formatters';
import type { IncomeStream } from '@/types';

export function IncomeTargetForm() {
  const { weeklyIncomeTargets, setAllWeeklyIncomeTargets } = useSettingsStore();
  const [targets, setTargets] = useState<Record<IncomeStream, string>>(
    INCOME_STREAM_IDS.reduce((acc, id) => ({
      ...acc,
      [id]: centsToDollars(weeklyIncomeTargets[id]),
    }), {} as Record<IncomeStream, string>),
  );

  const handleSave = () => {
    const cents = INCOME_STREAM_IDS.reduce((acc, id) => ({
      ...acc,
      [id]: parseDollarsToCents(targets[id]),
    }), {} as Record<IncomeStream, number>);
    setAllWeeklyIncomeTargets(cents);
  };

  return (
    <div className="space-y-4">
      {INCOME_STREAM_IDS.map((id) => (
        <div key={id}>
          <Label className="text-text-secondary text-xs">
            {INCOME_STREAMS[id].label} — Weekly Target ($)
          </Label>
          <Input
            type="number"
            step="10"
            min="0"
            value={targets[id]}
            onChange={(e) => setTargets((prev) => ({ ...prev, [id]: e.target.value }))}
            className="mt-1 bg-bg-tertiary border-border-subtle text-text-primary font-mono"
          />
        </div>
      ))}
      <Button
        onClick={handleSave}
        className="bg-accent-blue hover:bg-accent-blue/90 text-bg-primary font-body font-semibold hover:scale-[1.02] transition-transform"
      >
        Save Targets
      </Button>
    </div>
  );
}
