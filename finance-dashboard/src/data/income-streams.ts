import type { IncomeStream, IncomeStreamConfig } from '@/types';

export const INCOME_STREAMS: Record<IncomeStream, IncomeStreamConfig> = {
  'ai-projects':   { label: 'AI & Online Projects', icon: 'Brain',          color: '#6366F1' },
  'delivery':      { label: 'Delivery',             icon: 'Truck',          color: '#F59E0B' },
  'factory':       { label: 'Factory Work',         icon: 'Factory',        color: '#10B981' },
  'freelance':     { label: 'Freelance / Contract',  icon: 'PenTool',       color: '#EC4899' },
  'tutoring':      { label: 'Tutoring / Teaching',   icon: 'GraduationCap', color: '#14B8A6' },
  'rideshare':     { label: 'Rideshare',             icon: 'Car',           color: '#EAB308' },
  'tips':          { label: 'Tips',                  icon: 'HandCoins',     color: '#F97316' },
  'investments':   { label: 'Investments / Returns', icon: 'TrendingUp',    color: '#22C55E' },
  'rental-income': { label: 'Rental Income',         icon: 'Building',      color: '#0EA5E9' },
  'reselling':     { label: 'Reselling / Flipping',  icon: 'RefreshCw',     color: '#A855F7' },
  'other':         { label: 'Other Income',          icon: 'Wallet',        color: '#8B5CF6' },
};

export const INCOME_STREAM_IDS = Object.keys(INCOME_STREAMS) as IncomeStream[];
