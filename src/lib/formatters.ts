import { format, parseISO } from 'date-fns';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(cents: number): string {
  return currencyFormatter.format(cents / 100);
}

export function formatCurrencyCompact(cents: number): string {
  const dollars = cents / 100;
  if (dollars >= 1000) {
    return `$${(dollars / 1000).toFixed(1)}K`;
  }
  return formatCurrency(cents);
}

export function formatDate(dateStr: string, fmt: string = 'MMM d, yyyy'): string {
  return format(parseISO(dateStr), fmt);
}

export function formatDateShort(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM d');
}

export function formatDayOfWeek(dateStr: string): string {
  return format(parseISO(dateStr), 'EEE');
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function parseDollarsToCents(dollars: string): number {
  const parsed = parseFloat(dollars);
  if (isNaN(parsed)) return 0;
  return Math.round(parsed * 100);
}

export function centsToDollars(cents: number): string {
  return (cents / 100).toFixed(2);
}
