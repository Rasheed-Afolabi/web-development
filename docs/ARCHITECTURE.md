# Architecture

## Overview

Single-page application with four main views accessible via a sidebar/tab navigation. All data persists in localStorage as structured JSON. No backend, no authentication, no server — this runs entirely in the browser.

## Views

### 1. Daily Snapshot (`/daily`)
- Today's total spend vs. daily budget allowance
- Quick-add transaction form (always visible)
- Mini category breakdown for today
- "Remaining today" counter that updates live

### 2. Weekly Review (`/weekly`) — THE PRIMARY VIEW
- This is the Sunday ritual screen. It should feel like opening a financial magazine about your own life.
- 7-day spending bar chart (each bar split by category)
- Income vs. Expenses comparison (side-by-side or overlaid)
- Category pie/donut chart for the week
- Savings progress for the week vs. weekly target
- "On Track / Off Track / Danger" status indicator with visual weight
- Top 3 spending categories highlighted
- Week-over-week trend arrow (up/down/flat)

### 3. Monthly Overview (`/monthly`)
- 30-day trend line (cumulative spend)
- Month-over-month comparison bars
- Category breakdown (expandable)
- Income stream breakdown (which stream contributed most)
- Net savings for the month
- Projected month-end balance based on current pace

### 4. Goal Tracker (`/goal`)
- The $30K thermometer — large, animated, center-stage
- Projected completion date based on current savings rate
- "Gap to Goal" — how much more per week/month to hit target
- Monthly savings waterfall chart (showing each month's contribution)
- Milestone markers ($5K, $10K, $15K, $20K, $25K, $30K)
- Streak counter — consecutive weeks meeting savings target

## State Management (Zustand)

```
stores/
├── useTransactionStore.ts   # All income & expense transactions
├── useGoalStore.ts          # Savings goals, targets, milestones
├── useCategoryStore.ts      # Category definitions (extensible)
└── useSettingsStore.ts      # User preferences, income targets per stream
```

### Transaction Store Shape
```typescript
interface Transaction {
  id: string;                    // uuid
  type: 'income' | 'expense';
  amount: number;                // in cents
  category: string;              // category id
  incomeStream?: IncomeStream;   // only for income type
  date: string;                  // ISO date string
  note?: string;
  createdAt: string;
}
```

## Data Persistence

- All Zustand stores use `persist` middleware with localStorage.
- On every state change, a debounced (500ms) JSON snapshot is saved under `rasko-finance-backup`.
- CSV export function available from settings — exports all transactions as downloadable file.
- CSV import parses columns: date, type, amount, category, note.

## Component Hierarchy

```
App
├── Layout
│   ├── Sidebar (navigation + quick stats)
│   └── MainContent
│       ├── DailyView
│       │   ├── DailyBudgetMeter
│       │   ├── QuickAddForm
│       │   └── TodayTransactionList
│       ├── WeeklyView
│       │   ├── WeeklyIncomeExpenseChart
│       │   ├── CategoryDonutChart
│       │   ├── SavingsProgressCard
│       │   ├── StatusIndicator
│       │   └── WeeklyInsights
│       ├── MonthlyView
│       │   ├── MonthlyTrendLine
│       │   ├── MonthComparisonBars
│       │   ├── IncomeStreamBreakdown
│       │   └── CategoryDetailPanel
│       └── GoalView
│           ├── SavingsThermometer
│           ├── ProjectionCard
│           ├── MilestoneTracker
│           └── WaterfallChart
└── Modals
    ├── AddTransactionModal
    ├── EditTransactionModal
    ├── DataExportModal
    └── SettingsModal
```

## Routing

Use React Router v6 with these routes:
- `/` → redirects to `/weekly` (Sunday is the default experience)
- `/daily` → DailyView
- `/weekly` → WeeklyView
- `/monthly` → MonthlyView
- `/goal` → GoalView
- `/settings` → SettingsView (income targets, categories, data management)
