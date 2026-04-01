# Domain Model

## Income Streams

The user has three variable income sources. None are salaried — all fluctuate week to week.

```typescript
type IncomeStream = 'ai-projects' | 'delivery' | 'factory' | 'other';

const INCOME_STREAMS: Record<IncomeStream, { label: string; icon: string; color: string }> = {
  'ai-projects':  { label: 'AI & Online Projects', icon: 'Brain',       color: '#6366F1' },  // indigo
  'delivery':     { label: 'Delivery',             icon: 'Truck',       color: '#F59E0B' },  // amber
  'factory':      { label: 'Factory Work',         icon: 'Factory',     color: '#10B981' },  // emerald
  'other':        { label: 'Other Income',         icon: 'Wallet',      color: '#8B5CF6' },  // violet
};
```

### Variable Income Logic

- User sets **weekly income targets** per stream in Settings (e.g., "I expect $400/week from delivery").
- These targets are aspirational, not fixed. The dashboard compares actual vs. target.
- If actual income exceeds target → surplus gets highlighted in green.
- If actual income falls short → shortfall is shown, and the savings goal recalculates.

## Expense Categories

Pre-defined categories. User can add custom categories from Settings.

```typescript
type ExpenseCategoryGroup = 'essentials' | 'earning-costs' | 'lifestyle' | 'growth' | 'commitments';

const EXPENSE_CATEGORIES = {
  // ESSENTIALS — non-negotiable living costs
  'rent-housing':     { label: 'Rent / Housing',      group: 'essentials',    icon: 'Home',          color: '#EF4444' },
  'groceries':        { label: 'Groceries',            group: 'essentials',    icon: 'ShoppingCart',  color: '#F97316' },
  'utilities':        { label: 'Utilities',            group: 'essentials',    icon: 'Zap',           color: '#EAB308' },
  'phone-data':       { label: 'Phone / Data Plan',    group: 'essentials',    icon: 'Smartphone',    color: '#84CC16' },
  'health':           { label: 'Health / Medical',     group: 'essentials',    icon: 'Heart',         color: '#EC4899' },

  // COST OF EARNING — expenses directly tied to making money
  'gas-fuel':         { label: 'Gas / Fuel',           group: 'earning-costs', icon: 'Fuel',          color: '#F59E0B' },
  'car-maintenance':  { label: 'Car Maintenance',      group: 'earning-costs', icon: 'Wrench',        color: '#D97706' },
  'platform-fees':    { label: 'Platform Fees',        group: 'earning-costs', icon: 'CreditCard',    color: '#B45309' },

  // LIFESTYLE — discretionary spending
  'dining-out':       { label: 'Dining Out',           group: 'lifestyle',     icon: 'UtensilsCrossed', color: '#14B8A6' },
  'entertainment':    { label: 'Entertainment',        group: 'lifestyle',     icon: 'Film',          color: '#06B6D4' },
  'personal-care':    { label: 'Personal Care',        group: 'lifestyle',     icon: 'Sparkles',      color: '#8B5CF6' },
  'clothing':         { label: 'Clothing',             group: 'lifestyle',     icon: 'Shirt',         color: '#A855F7' },
  'subscriptions':    { label: 'Subscriptions',        group: 'lifestyle',     icon: 'Repeat',        color: '#7C3AED' },

  // GROWTH — investing in yourself
  'certifications':   { label: 'Certifications',       group: 'growth',        icon: 'Award',         color: '#3B82F6' },
  'education':        { label: 'Education / Learning', group: 'growth',        icon: 'BookOpen',      color: '#2563EB' },
  'immigration-legal':{ label: 'Immigration / Legal',  group: 'growth',        icon: 'Scale',         color: '#1D4ED8' },

  // COMMITMENTS — recurring obligations
  'tithe-giving':     { label: 'Tithe / Giving',       group: 'commitments',   icon: 'HandHeart',     color: '#059669' },
  'insurance':        { label: 'Insurance',            group: 'commitments',   icon: 'Shield',        color: '#047857' },
  'debt-payments':    { label: 'Debt Payments',        group: 'commitments',   icon: 'TrendingDown',  color: '#DC2626' },

  // CATCH-ALL
  'miscellaneous':    { label: 'Miscellaneous',        group: 'lifestyle',     icon: 'MoreHorizontal', color: '#6B7280' },
};
```

### Category Groups Purpose

The dashboard groups expenses by these meta-categories in visualizations:
- **Essentials** — "You need these to live"
- **Cost of Earning** — "You spend this to make money" (important for delivery drivers especially)
- **Lifestyle** — "You choose these"
- **Growth** — "You invest these in future-you"
- **Commitments** — "These are promised to others"

This grouping powers the "where is my money really going?" insight on the Weekly Review.

## Goal Calculation Engine

### The $30K / 6-Month Goal

```typescript
interface SavingsGoal {
  targetAmount: number;        // 3000000 (cents) = $30,000
  startDate: string;           // ISO date when tracking began
  endDate: string;             // 6 months from startDate
  currentSaved: number;        // sum of (income - expenses) since startDate
}

// Derived calculations
const totalDays = daysBetween(goal.startDate, goal.endDate);
const elapsedDays = daysBetween(goal.startDate, today);
const remainingDays = totalDays - elapsedDays;
const remainingAmount = goal.targetAmount - goal.currentSaved;

const requiredDailyRate = remainingAmount / remainingDays;
const requiredWeeklyRate = requiredDailyRate * 7;
const requiredMonthlyRate = requiredDailyRate * 30;

// Pace indicator
const expectedByNow = (goal.targetAmount / totalDays) * elapsedDays;
const paceStatus = goal.currentSaved >= expectedByNow ? 'on-track'
                 : goal.currentSaved >= expectedByNow * 0.85 ? 'off-track'
                 : 'danger';
```

### Status Indicators

| Status    | Condition                    | Visual                          |
|-----------|------------------------------|---------------------------------|
| On Track  | Saved ≥ expected pace        | Green glow, upward trend icon   |
| Off Track | Saved is 85-99% of pace     | Amber pulse, level trend icon   |
| Danger    | Saved < 85% of pace         | Red alert, downward trend icon  |

## Data Validation Rules

- Transaction amount must be > 0
- Transaction date cannot be in the future
- Every expense must have a category
- Every income must have an income stream
- Goal target amount must be > current saved amount
- Weekly income targets per stream must be ≥ 0
