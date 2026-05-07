import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TransactionForm } from '@/components/forms/TransactionForm';

export function AddTransactionDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-24 md:bottom-8 right-6 z-40 w-14 h-14 rounded-full bg-accent-blue text-bg-primary shadow-lg hover:bg-accent-blue/90 hover:scale-105 transition-all flex items-center justify-center"
        aria-label="Add transaction"
      >
        <Plus size={24} />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-bg-elevated border-border-subtle max-w-md">
          <DialogHeader>
            <DialogTitle className="text-text-primary font-heading">Add Transaction</DialogTitle>
          </DialogHeader>
          <TransactionForm onSuccess={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
