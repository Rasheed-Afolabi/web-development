import { v4 as uuidv4 } from 'uuid';
import type { Transaction } from '@/types';
import { parseDollarsToCents } from './formatters';

export function exportTransactionsToCSV(transactions: Transaction[]): string {
  const headers = ['date', 'type', 'amount', 'category', 'income_stream', 'note'];
  const rows = transactions.map((t) => [
    t.date,
    t.type,
    (t.amount / 100).toFixed(2),
    t.category,
    t.incomeStream || '',
    (t.note || '').replace(/,/g, ';'),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

export function parseCSVToTransactions(csv: string): Transaction[] {
  const lines = csv.trim().split('\n');
  if (lines.length < 2) return [];

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const dateIdx = headers.indexOf('date');
  const typeIdx = headers.indexOf('type');
  const amountIdx = headers.indexOf('amount');
  const categoryIdx = headers.indexOf('category');
  const streamIdx = headers.indexOf('income_stream');
  const noteIdx = headers.indexOf('note');

  if (dateIdx === -1 || typeIdx === -1 || amountIdx === -1 || categoryIdx === -1) {
    throw new Error('CSV must have columns: date, type, amount, category');
  }

  return lines.slice(1).filter(Boolean).map((line) => {
    const cols = line.split(',').map((c) => c.trim());
    const type = cols[typeIdx] as 'income' | 'expense';
    return {
      id: uuidv4(),
      type,
      amount: parseDollarsToCents(cols[amountIdx]),
      category: cols[categoryIdx],
      incomeStream: streamIdx !== -1 && cols[streamIdx] ? cols[streamIdx] as Transaction['incomeStream'] : undefined,
      date: cols[dateIdx],
      note: noteIdx !== -1 ? cols[noteIdx] : undefined,
      createdAt: new Date().toISOString(),
    };
  });
}

export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
