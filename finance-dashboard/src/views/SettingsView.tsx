import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataCard } from '@/components/dashboard/DataCard';
import { IncomeTargetForm } from '@/components/forms/IncomeTargetForm';
import { ZeroBasedPlannerDialog } from '@/components/forms/ZeroBasedPlannerDialog';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { useSettingsStore } from '@/stores/useSettingsStore';
import { useRecurringStore } from '@/stores/useRecurringStore';
import { exportTransactionsToCSV, parseCSVToTransactions, downloadCSV } from '@/lib/csv';
import { CURRENCY_LABELS } from '@/lib/currency';
// RFDPrimitives available if needed
import { Download, Upload, Trash2, Database, Target, Users, DollarSign } from 'lucide-react';
import { format, addDays, startOfWeek, eachDayOfInterval } from 'date-fns';
import { getBackupJson } from '@/lib/backup';
import { v4 as uuidv4 } from 'uuid';
import type { BudgetMode, CurrencyCode } from '@/types';

export function SettingsView() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const importTransactions = useTransactionStore((s) => s.importTransactions);
  const clearAll = useTransactionStore((s) => s.clearAll);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Budget mode
  const budgetMode = useSettingsStore((s) => s.budgetMode);
  const setBudgetMode = useSettingsStore((s) => s.setBudgetMode);
  const [showPlanner, setShowPlanner] = useState(false);

  // Household
  const members = useSettingsStore((s) => s.householdMembers);
  const addMember = useSettingsStore((s) => s.addHouseholdMember);
  const removeMember = useSettingsStore((s) => s.removeHouseholdMember);
  const [newMemberName, setNewMemberName] = useState('');

  // Currency
  const defaultCurrency = useSettingsStore((s) => s.defaultCurrency);
  const setDefaultCurrency = useSettingsStore((s) => s.setDefaultCurrency);

  // Bills for calendar
  const bills = useRecurringStore((s) => s.bills);

  const handleExportCSV = () => {
    const csv = exportTransactionsToCSV(transactions);
    const filename = `rasko-finance-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    downloadCSV(csv, filename);
  };

  const handleExportJSON = () => {
    const backup = getBackupJson();
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `rasko-finance-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const csv = ev.target?.result as string;
        const imported = parseCSVToTransactions(csv);
        importTransactions(imported);
        setImportStatus(`Imported ${imported.length} transactions`);
        setTimeout(() => setImportStatus(''), 3000);
      } catch (err) {
        setImportStatus(`Error: ${err instanceof Error ? err.message : 'Invalid CSV'}`);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClearAll = () => {
    clearAll();
    setShowClearDialog(false);
  };

  const handleAddMember = () => {
    if (!newMemberName.trim()) return;
    const colors = ['#6366F1', '#F59E0B', '#10B981', '#EC4899', '#14B8A6', '#EAB308'];
    addMember({
      id: uuidv4(),
      name: newMemberName.trim(),
      color: colors[members.length % colors.length],
    });
    setNewMemberName('');
  };

  // B3 — Bill Calendar (4-week grid)
  const calendarWeeks = useMemo(() => {
    const today = new Date();
    const start = startOfWeek(today, { weekStartsOn: 0 });
    const end = addDays(start, 27);
    const days = eachDayOfInterval({ start, end });
    const weeks: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, []);

  const billDueDates = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const bill of bills) {
      if (!bill.isActive) continue;
      // Simple: mark the due date
      const dateKey = bill.nextDueDate;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(bill.name);
    }
    return map;
  }, [bills]);

  return (
    <div className="p-8 max-w-3xl">
      <h2 className="font-heading font-bold text-2xl text-text-primary mb-8">Settings</h2>

      <div className="space-y-8">
        {/* Income Targets */}
        <DataCard index={0}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Weekly Income Targets</h3>
          <p className="text-text-secondary text-sm font-body mb-4">
            Set your expected weekly income per stream. These are aspirational targets to measure against.
          </p>
          <IncomeTargetForm />
        </DataCard>

        {/* Goals Link */}
        <DataCard index={1}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Savings Goals</h3>
          <p className="text-text-secondary text-sm font-body mb-4">
            Create and manage multiple savings goals with custom targets and timelines.
          </p>
          <Button
            onClick={() => navigate('/goals')}
            variant="outline"
            className="border-border-subtle text-text-primary hover:bg-bg-tertiary"
          >
            <Target size={16} className="mr-2" />
            Manage Goals
          </Button>
        </DataCard>

        {/* B3 — Bill Calendar */}
        {bills.length > 0 && (
          <DataCard index={2}>
            <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Bill Calendar</h3>
            <div className="grid grid-cols-7 gap-1 text-center">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="text-[10px] font-mono text-[#7A8BA0] py-1">{d}</div>
              ))}
              {calendarWeeks.flat().map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const isToday = dateStr === format(new Date(), 'yyyy-MM-dd');
                const dueBills = billDueDates[dateStr] || [];
                return (
                  <div
                    key={i}
                    className={`relative p-1.5 rounded-lg text-[11px] font-mono min-h-[40px] ${
                      isToday
                        ? 'bg-[#1E3A6B] border border-[#60A5FA] text-[#F0F0F5]'
                        : 'bg-[#080B14] text-[#9898B0]'
                    }`}
                    title={dueBills.join(', ')}
                  >
                    {format(day, 'd')}
                    {dueBills.length > 0 && (
                      <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {dueBills.slice(0, 3).map((_, j) => (
                          <span key={j} className="h-1 w-1 rounded-full bg-[#F87171]" />
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </DataCard>
        )}

        {/* D1 — Budget Mode Toggle */}
        <DataCard index={3}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Budget Mode</h3>
          <p className="text-text-secondary text-sm font-body mb-4">
            Choose how you track spending: daily allowance or envelope budgets.
          </p>
          <div className="flex gap-2 mb-4">
            {([
              { mode: 'allowance' as BudgetMode, label: 'Daily Allowance', desc: 'Auto-calculated daily budget from income targets' },
              { mode: 'envelope' as BudgetMode, label: 'Envelope', desc: 'Assign income to specific categories' },
            ]).map((opt) => (
              <button
                key={opt.mode}
                onClick={() => setBudgetMode(opt.mode)}
                className={`flex-1 p-3 rounded-lg border text-left transition-all ${
                  budgetMode === opt.mode
                    ? 'border-[#60A5FA] bg-[#0F1F36]'
                    : 'border-[#1F2937] bg-[#080B14] hover:border-[#2A3441]'
                }`}
              >
                <p className={`text-sm font-medium ${budgetMode === opt.mode ? 'text-[#60A5FA]' : 'text-[#F0F0F5]'}`}>{opt.label}</p>
                <p className="text-[11px] text-[#7A8BA0] mt-0.5">{opt.desc}</p>
              </button>
            ))}
          </div>
          {budgetMode === 'envelope' && (
            <Button
              onClick={() => setShowPlanner(true)}
              variant="outline"
              className="border-border-subtle text-text-primary hover:bg-bg-tertiary"
            >
              Open Zero-Based Planner
            </Button>
          )}
        </DataCard>

        {/* E1 — Household Members */}
        <DataCard index={4}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
            <Users size={18} />
            Household Members
          </h3>
          <p className="text-text-secondary text-sm font-body mb-4">
            Add family members to track per-person income and expenses.
          </p>
          <div className="space-y-2 mb-3">
            {members.map((m) => (
              <div key={m.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-[#080B14] border border-[#1F2937]">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full" style={{ background: m.color }} />
                  <span className="text-sm text-[#F0F0F5]">{m.name}</span>
                </div>
                <button onClick={() => removeMember(m.id)} className="text-[10px] text-[#F87171] hover:text-[#FCA5A5]">Remove</button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              className="flex-1 bg-[#080B14] border border-[#1F2937] rounded px-3 py-1.5 text-sm text-[#F0F0F5]"
              placeholder="Member name"
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAddMember()}
            />
            <Button onClick={handleAddMember} variant="outline" className="border-border-subtle text-text-primary hover:bg-bg-tertiary text-sm">
              Add
            </Button>
          </div>
        </DataCard>

        {/* E2 — Currency */}
        <DataCard index={5}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4 flex items-center gap-2">
            <DollarSign size={18} />
            Default Currency
          </h3>
          <p className="text-text-secondary text-sm font-body mb-4">
            All amounts are stored in this currency. Other currencies are converted at entry time.
          </p>
          <select
            value={defaultCurrency}
            onChange={(e) => setDefaultCurrency(e.target.value as CurrencyCode)}
            className="bg-[#080B14] border border-[#1F2937] rounded px-3 py-2 text-sm text-[#F0F0F5]"
          >
            {(Object.entries(CURRENCY_LABELS) as [CurrencyCode, string][]).map(([code, label]) => (
              <option key={code} value={code}>{code} — {label}</option>
            ))}
          </select>
        </DataCard>

        <Separator className="bg-border-subtle" />

        {/* Data Management */}
        <DataCard index={6}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Data Management</h3>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button
                onClick={handleExportCSV}
                variant="outline"
                className="border-border-subtle text-text-primary hover:bg-bg-tertiary"
              >
                <Download size={16} className="mr-2" />
                Export CSV
              </Button>
              <Button
                onClick={handleExportJSON}
                variant="outline"
                className="border-border-subtle text-text-primary hover:bg-bg-tertiary"
              >
                <Database size={16} className="mr-2" />
                Export JSON Backup
              </Button>
            </div>

            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleImportCSV}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="outline"
                className="border-border-subtle text-text-primary hover:bg-bg-tertiary"
              >
                <Upload size={16} className="mr-2" />
                Import CSV
              </Button>
              {importStatus && (
                <p className={`text-sm font-body mt-2 ${importStatus.startsWith('Error') ? 'text-accent-red' : 'text-accent-green'}`}>
                  {importStatus}
                </p>
              )}
            </div>

            <Separator className="bg-border-subtle" />

            <div>
              <Button
                onClick={() => setShowClearDialog(true)}
                variant="outline"
                className="border-accent-red/30 text-accent-red hover:bg-accent-red-dim"
              >
                <Trash2 size={16} className="mr-2" />
                Clear All Data
              </Button>
              <p className="text-text-muted text-xs font-body mt-2">
                This will permanently delete all transactions. Export a backup first.
              </p>
            </div>
          </div>
        </DataCard>

        {/* Stats */}
        <DataCard index={7}>
          <h3 className="font-heading font-semibold text-lg text-text-primary mb-4">Data Summary</h3>
          <div className="space-y-2 text-sm font-body">
            <div className="flex justify-between">
              <span className="text-text-secondary">Total Transactions</span>
              <span className="font-mono text-text-primary">{transactions.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Income Entries</span>
              <span className="font-mono text-text-primary">{transactions.filter((t) => t.type === 'income').length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">Expense Entries</span>
              <span className="font-mono text-text-primary">{transactions.filter((t) => t.type === 'expense').length}</span>
            </div>
          </div>
        </DataCard>
      </div>

      {/* Clear confirmation dialog */}
      <Dialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <DialogContent className="bg-bg-elevated border-border-subtle">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Clear All Data?</DialogTitle>
          </DialogHeader>
          <p className="text-text-secondary text-sm font-body">
            This will permanently delete all transactions. This action cannot be undone.
            Make sure you&apos;ve exported a backup first.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowClearDialog(false)}
              className="border-border-subtle text-text-primary"
            >
              Cancel
            </Button>
            <Button
              onClick={handleClearAll}
              className="bg-accent-red hover:bg-accent-red/90 text-white"
            >
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zero-Based Planner */}
      <ZeroBasedPlannerDialog open={showPlanner} onOpenChange={setShowPlanner} />
    </div>
  );
}
