import type { IncomeStream, IncomeStreamConfig } from '@/types';

export const INCOME_STREAMS: Record<IncomeStream, IncomeStreamConfig> = {
  'ai-projects': { label: 'AI & Online Projects', icon: 'Brain', color: '#6366F1' },
  'delivery': { label: 'Delivery', icon: 'Truck', color: '#F59E0B' },
  'factory': { label: 'Factory Work', icon: 'Factory', color: '#10B981' },
  'other': { label: 'Other Income', icon: 'Wallet', color: '#8B5CF6' },
};

export const INCOME_STREAM_IDS = Object.keys(INCOME_STREAMS) as IncomeStream[];
