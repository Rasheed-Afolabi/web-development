import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useEnvelopeStore } from '@/stores/useEnvelopeStore';
import { EXPENSE_CATEGORIES } from '@/data/expense-categories';
import { fmtUSD } from '@/components/dashboard/RFDPrimitives';

const ENVELOPE_COLORS = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#14B8A6', '#EAB308', '#F97316', '#0EA5E9'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ZeroBasedPlannerDialog({ open, onOpenChange }: Props) {
  const addBucket = useEnvelopeStore((s) => s.addBucket);
  const resetPeriod = useEnvelopeStore((s) => s.resetPeriod);

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [income, setIncome] = useState('');
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const incomeCents = Math.round((parseFloat(income) || 0) * 100);

  const categories = useMemo(
    () => Object.entries(EXPENSE_CATEGORIES).slice(0, 10),
    [],
  );

  const totalAssigned = Object.values(assignments).reduce(
    (s, v) => s + Math.round((parseFloat(v) || 0) * 100), 0,
  );
  const remaining = incomeCents - totalAssigned;

  const handleConfirm = () => {
    resetPeriod();
    let colorIdx = 0;
    for (const [catId, amt] of Object.entries(assignments)) {
      const cents = Math.round((parseFloat(amt) || 0) * 100);
      if (cents <= 0) continue;
      addBucket({
        name: EXPENSE_CATEGORIES[catId]?.label || catId,
        allocated: cents,
        color: ENVELOPE_COLORS[colorIdx++ % ENVELOPE_COLORS.length],
        category: catId,
      });
    }
    onOpenChange(false);
    setStep(1);
    setIncome('');
    setAssignments({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0D1117] border-[#1F2937] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-[#F0F0F5] font-display">
            Zero-Based Planner — Step {step}/3
          </DialogTitle>
        </DialogHeader>

        {step === 1 && (
          <div className="space-y-4">
            <p className="text-sm text-[#9898B0]">How much income do you want to budget this period?</p>
            <Input
              type="number"
              step="0.01"
              placeholder="Total income ($)"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              className="bg-[#080B14] border-[#1F2937] text-[#F0F0F5] font-mono"
            />
            <DialogFooter>
              <Button
                disabled={incomeCents <= 0}
                onClick={() => setStep(2)}
                className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-[#0A0A12]"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-3">
            <p className="text-sm text-[#9898B0]">
              Assign amounts to categories. Remaining: <span className={remaining === 0 ? 'text-[#34D399]' : remaining < 0 ? 'text-[#F87171]' : 'text-[#FBBF24]'}>{fmtUSD(remaining)}</span>
            </p>
            <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
              {categories.map(([id, cat]) => (
                <div key={id} className="flex items-center gap-3">
                  <span className="h-2 w-2 rounded-sm" style={{ background: cat.color }} />
                  <span className="text-sm text-[#F0F0F5] w-36 truncate">{cat.label}</span>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="$0"
                    value={assignments[id] || ''}
                    onChange={(e) => setAssignments({ ...assignments, [id]: e.target.value })}
                    className="bg-[#080B14] border-[#1F2937] text-[#F0F0F5] font-mono h-8 text-sm"
                  />
                </div>
              ))}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(1)} className="border-[#1F2937] text-[#F0F0F5]">Back</Button>
              <Button
                disabled={remaining !== 0}
                onClick={() => setStep(3)}
                className="bg-[#60A5FA] hover:bg-[#60A5FA]/90 text-[#0A0A12]"
              >
                Next
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-[#9898B0]">Review your envelopes:</p>
            <div className="space-y-1">
              {categories
                .filter(([id]) => parseFloat(assignments[id] || '0') > 0)
                .map(([id, cat]) => (
                  <div key={id} className="flex justify-between px-3 py-1.5 rounded bg-[#080B14]">
                    <span className="text-sm text-[#F0F0F5]">{cat.label}</span>
                    <span className="font-mono text-sm text-[#34D399]">${assignments[id]}</span>
                  </div>
                ))}
            </div>
            <p className="text-[11px] text-[#34D399] font-mono">Remaining: {fmtUSD(remaining)} (should be $0.00)</p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep(2)} className="border-[#1F2937] text-[#F0F0F5]">Back</Button>
              <Button onClick={handleConfirm} className="bg-[#34D399] hover:bg-[#34D399]/90 text-[#0A0A12]">
                Apply Envelopes
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
