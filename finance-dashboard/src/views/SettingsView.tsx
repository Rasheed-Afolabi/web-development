import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { DataCard } from '@/components/dashboard/DataCard';
import { IncomeTargetForm } from '@/components/forms/IncomeTargetForm';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { exportTransactionsToCSV, parseCSVToTransactions, downloadCSV } from '@/lib/csv';
import { Download, Upload, Trash2, Database, Target } from 'lucide-react';
import { format } from 'date-fns';
import { getBackupJson } from '@/lib/backup';

export function SettingsView() {
  const navigate = useNavigate();
  const transactions = useTransactionStore((s) => s.transactions);
  const importTransactions = useTransactionStore((s) => s.importTransactions);
  const clearAll = useTransactionStore((s) => s.clearAll);
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [importStatus, setImportStatus] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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

        <Separator className="bg-border-subtle" />

        {/* Data Management */}
        <DataCard index={2}>
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
        <DataCard index={3}>
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
    </div>
  );
}
