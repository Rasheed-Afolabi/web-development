import type { CurrencyCode, ExchangeRateCache } from '@/types';

const CACHE_KEY = 'rasko-exchange-rates';
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000; // 24 hours

export const CURRENCY_LABELS: Record<CurrencyCode, string> = {
  USD: 'US Dollar',
  EUR: 'Euro',
  GBP: 'British Pound',
  CAD: 'Canadian Dollar',
  AUD: 'Australian Dollar',
  NGN: 'Nigerian Naira',
  JPY: 'Japanese Yen',
  INR: 'Indian Rupee',
  BRL: 'Brazilian Real',
  MXN: 'Mexican Peso',
};

export const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = {
  USD: '$', EUR: '\u20AC', GBP: '\u00A3', CAD: 'C$', AUD: 'A$',
  NGN: '\u20A6', JPY: '\u00A5', INR: '\u20B9', BRL: 'R$', MXN: 'MX$',
};

function getCachedRates(): ExchangeRateCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const cache = JSON.parse(raw) as ExchangeRateCache;
    const age = Date.now() - new Date(cache.fetchedAt).getTime();
    if (age > CACHE_DURATION_MS) return null;
    return cache;
  } catch {
    return null;
  }
}

export async function fetchExchangeRates(base: CurrencyCode = 'USD'): Promise<ExchangeRateCache> {
  const cached = getCachedRates();
  if (cached && cached.base === base) return cached;

  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const data = await res.json();
    const cache: ExchangeRateCache = {
      base,
      rates: data.rates || {},
      fetchedAt: new Date().toISOString(),
    };
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    return cache;
  } catch {
    // Return stale cache or empty
    const stale = getCachedRates();
    return stale || { base, rates: {}, fetchedAt: new Date().toISOString() };
  }
}

/**
 * Convert an amount from one currency to USD (or target currency).
 * Returns amount in minor units (cents).
 */
export function convertToBase(
  amount: number, // in minor units of source currency
  fromCurrency: CurrencyCode,
  rates: Record<string, number>,
  baseCurrency: CurrencyCode = 'USD',
): { convertedAmount: number; exchangeRate: number } {
  if (fromCurrency === baseCurrency) {
    return { convertedAmount: amount, exchangeRate: 1 };
  }

  const fromRate = rates[fromCurrency] || 1;
  const toRate = rates[baseCurrency] || 1;
  const exchangeRate = toRate / fromRate;
  const convertedAmount = Math.round(amount * exchangeRate);

  return { convertedAmount, exchangeRate };
}
