# Domain Model

## Income Streams

The user has multiple variable income sources. None are salaried — all fluctuate week to week.

```typescript
type IncomeStream = 'ai-projects' | 'delivery' | 'factory' | 'freelance' | 'tutoring' | 'rideshare' | 'tips' | 'investments' | 'rental-income' | 'reselling' | 'other';

const INCOME_STREAMS: Record<IncomeStream, { label: string; icon: string; color: string }> = {
  'ai-projects':   { label: 'AI & Online Projects', icon: 'Brain',          color: '#6366F1' },
  'delivery':      { label: 'Delivery',             icon: 'Truck',          color: '#F59E0B' },
  'factory':       { label: 'Factory Work',         icon: 'Factory',        color: '#10B981' },
  'freelance':     { label: 'Freelance / Contract', icon: 'PenTool',        color: '#EC4899' },
  'tutoring':      { label: 'Tutoring / Teaching',  icon: 'GraduationCap',  color: '#14B8A6' },
  'rideshare':     { label: 'Rideshare',            icon: 'Car',            color: '#EAB308' },
  'tips':          { label: 'Tips',                 icon: 'HandCoins',      color: '#F97316' },
  'investments':   { label: 'Investments / Returns',icon: 'TrendingUp',     color: '#22C55E' },
  'rental-income': { label: 'Rental Income',        icon: 'Building',       color: '#0EA5E9' },
  'reselling':     { label: 'Reselling / Flipping', icon: 'RefreshCw',      color: '#A855F7' },
  'other':         { label: 'Other Income',         icon: 'Wallet',         color: '#8B5CF6' },
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
```

### Category Groups Purpose

The dashboard groups expenses by these meta-categories in visualizations:
- **Essentials** — "You need these to live"
- **Cost of Earning** — "You spend this to make money" (important for delivery drivers especially)
- **Lifestyle** — "You choose these"
- **Growth** — "You invest these in future-you"
- **Commitments** — "These are promised to others"

This grouping powers the Sankey flow chart and insight cards on the Dashboard.

## Goal System — Flexible Multi-Goal

Goals are no longer locked to a single $30K/6-month target. Users can create multiple goals with custom names and targets.

### SavingsGoal Type
```typescript
interface SavingsGoal {
  id: string;                    // uuid
  name: string;                  // e.g. "Emergency Fund", "New Car"
  targetAmount: number;          // in cents
  startDate: string;             // ISO date when tracking began
  endDate: string;               // target completion date
}
```

### Multi-Goal Store
```typescript
// Goals stored as array with active selection
goals: SavingsGoal[]
activeGoalId: string | null

// Operations
addGoal(goal)      // Create new goal, auto-selects it
updateGoal(id)     // Edit name, target, dates
deleteGoal(id)     // Remove goal, auto-selects next
setActiveGoal(id)  // Switch between goals
```

### Dynamic Milestones
```typescript
// Auto-calculates evenly-spaced milestones from any target amount
generateMilestones(targetAmount: number, count: number = 6): number[]
// e.g. $30,000 → [$5K, $10K, $15K, $20K, $25K, $30K]
// e.g. $8,000  → [$1.3K, $2.7K, $4K, $5.3K, $6.7K, $8K]
```

### Goal Progress Calculation
```typescript
const totalDays = daysBetween(goal.startDate, goal.endDate);
const elapsedDays = daysBetween(goal.startDate, today);
const remainingDays = totalDays - elapsedDays;
const currentSaved = totalIncome - totalExpenses; // since goal start date
const remainingAmount = goal.targetAmount - currentSaved;

const requiredDailyRate = remainingAmount / remainingDays;
const requiredWeeklyRate = requiredDailyRate * 7;
const requiredMonthlyRate = requiredDailyRate * 30;

// Pace indicator
const expectedByNow = (goal.targetAmount / totalDays) * elapsedDays;
const paceStatus = currentSaved >= expectedByNow ? 'on-track'
                 : currentSaved >= expectedByNow * 0.85 ? 'off-track'
                 : 'danger';
```

### Status Indicators

| Status    | Condition                    | Visual                          |
|-----------|------------------------------|---------------------------------|
| On Track  | Saved ≥ expected pace        | Green glow, upward trend icon   |
| Off Track | Saved is 85-99% of pace     | Amber pulse, level trend icon   |
| Danger    | Saved < 85% of pace         | Red alert, downward trend icon  |

### Data Schema Migration (v1 → v2)

Old v1 format (single goal):
```json
{ "goal": { "targetAmount": 3000000, "startDate": "...", "endDate": "..." } }
```

New v2 format (multi-goal):
```json
{
  "goals": [{ "id": "...", "name": "Savings Goal", "targetAmount": 3000000, ... }],
  "activeGoalId": "..."
}
```

Migration is automatic: when v1 data is loaded, it's converted to v2 with a generated ID and default name "Savings Goal".

## Data Validation Rules

- Transaction amount must be > 0
- Transaction date cannot be in the future
- Every expense must have a category
- Every income must have an income stream
- Goal name must not be empty
- Goal target amount must be > 0
- Weekly income targets per stream must be ≥ 0
