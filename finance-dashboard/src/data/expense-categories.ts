import type { ExpenseCategory, CategoryGroupInfo } from '@/types';

export const EXPENSE_CATEGORIES: Record<string, ExpenseCategory> = {
  'rent-housing':      { label: 'Rent / Housing',      group: 'essentials',    icon: 'Home',              color: '#EF4444' },
  'groceries':         { label: 'Groceries',            group: 'essentials',    icon: 'ShoppingCart',      color: '#F97316' },
  'utilities':         { label: 'Utilities',            group: 'essentials',    icon: 'Zap',               color: '#EAB308' },
  'phone-data':        { label: 'Phone / Data Plan',    group: 'essentials',    icon: 'Smartphone',        color: '#84CC16' },
  'health':            { label: 'Health / Medical',     group: 'essentials',    icon: 'Heart',             color: '#EC4899' },

  'gas-fuel':          { label: 'Gas / Fuel',           group: 'earning-costs', icon: 'Fuel',              color: '#F59E0B' },
  'car-maintenance':   { label: 'Car Maintenance',      group: 'earning-costs', icon: 'Wrench',            color: '#D97706' },
  'platform-fees':     { label: 'Platform Fees',        group: 'earning-costs', icon: 'CreditCard',        color: '#B45309' },

  'dining-out':        { label: 'Dining Out',           group: 'lifestyle',     icon: 'UtensilsCrossed',   color: '#14B8A6' },
  'entertainment':     { label: 'Entertainment',        group: 'lifestyle',     icon: 'Film',              color: '#06B6D4' },
  'personal-care':     { label: 'Personal Care',        group: 'lifestyle',     icon: 'Sparkles',          color: '#8B5CF6' },
  'clothing':          { label: 'Clothing',             group: 'lifestyle',     icon: 'Shirt',             color: '#A855F7' },
  'subscriptions':     { label: 'Subscriptions',        group: 'lifestyle',     icon: 'Repeat',            color: '#7C3AED' },

  'certifications':    { label: 'Certifications',       group: 'growth',        icon: 'Award',             color: '#3B82F6' },
  'education':         { label: 'Education / Learning', group: 'growth',        icon: 'BookOpen',          color: '#2563EB' },
  'immigration-legal': { label: 'Immigration / Legal',  group: 'growth',        icon: 'Scale',             color: '#1D4ED8' },

  'tithe-giving':      { label: 'Tithe / Giving',       group: 'commitments',   icon: 'HandHeart',         color: '#059669' },
  'insurance':         { label: 'Insurance',            group: 'commitments',   icon: 'Shield',            color: '#047857' },
  'debt-payments':     { label: 'Debt Payments',        group: 'commitments',   icon: 'TrendingDown',      color: '#DC2626' },

  'miscellaneous':     { label: 'Miscellaneous',        group: 'lifestyle',     icon: 'MoreHorizontal',    color: '#6B7280' },
};

export const CATEGORY_GROUPS: CategoryGroupInfo[] = [
  { id: 'essentials',    label: 'Essentials',       description: 'You need these to live' },
  { id: 'earning-costs', label: 'Cost of Earning',  description: 'You spend this to make money' },
  { id: 'lifestyle',     label: 'Lifestyle',        description: 'You choose these' },
  { id: 'growth',        label: 'Growth',           description: 'You invest these in future-you' },
  { id: 'commitments',   label: 'Commitments',      description: 'These are promised to others' },
];

export const EXPENSE_CATEGORY_IDS = Object.keys(EXPENSE_CATEGORIES);
