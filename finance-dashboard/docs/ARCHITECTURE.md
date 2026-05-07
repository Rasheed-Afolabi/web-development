# Architecture

## Overview

Single-page application with three main views accessible via a sidebar/tab navigation. All data persists in localStorage as structured JSON. No backend, no authentication, no server — this runs entirely in the browser.

## Views

### 1. Dashboard (`/dashboard`) — THE PRIMARY VIEW
The single rich dashboard that answers "where is my money going and coming back?" with time-range filter pills.

**Time Range Filters**: Today, This Week, This Month, Last Month, All Time, Custom

**Widgets (in order):**
1. **KPI Row** — Total Income, Total Expenses, Net Saved, Savings Rate
2. **Cash Flow Bar Chart** — Income vs expense bars (auto-aggregates to weeks for ranges > 14 days)
3. **Category Donut** — Click a slice to drill into that category's transactions
4. **Income Streams Breakdown** — Horizontal bars per income source
5. **Insight Cards** — Auto-generated text: top expense, savings rate, top earner, transaction count
6. **Spending Heatmap** — GitHub-style calendar grid, last 6 months, colored by spend intensity
7. **Cumulative Spending Trend** — Area chart showing spend accumulation over time
8. **Category Treemap** — Rectangles sized by spend amount
9. **Money Flow Sankey** — Income sources → Total Income → expense groups
10. **Recent Transactions** — Expandable list with edit/delete
11. **Floating "Add" Button** — Opens transaction form in a dialog

### 2. Goals (`/goals`)
Flexible multi-goal tracker:
- Create multiple goals with custom names ("Emergency Fund", "New Car", etc.)
- Tab between goals when multiple exist
- Each goal has: savings thermometer, stats column, gap-to-goal rates, projected completion
- Monthly savings waterfall chart
- Dynamic milestones (auto-calculated from target amount, not hardcoded)
- Add/edit/delete goals via dialogs

### 3. Settings (`/settings`)
- Weekly income targets per stream
- "Manage Goals" link (redirects to Goals page)
- Data management: Export CSV, Export JSON, Import CSV, Clear All Data
- Data summary stats

## State Management (Zustand)

```
stores/
├── useTransactionStore.ts   # All income & expense transactions
├── useGoalStore.ts          # Multiple savings goals (array) + activeGoalId
├── useCategoryStore.ts      # Category definitions (extensible)
└── useSettingsStore.ts      # User preferences, income targets per stream
```

### Goal Store Shape (v2)
```typescript
interface GoalState {
  goals: SavingsGoal[];        // Array of goals
  activeGoalId: string | null; // Currently viewed goal
  addGoal, updateGoal, deleteGoal, setActiveGoal
  hydrateGoal()                // Legacy v1 migration support
}
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

## Custom Hooks

```
hooks/
├── useTransactions.ts       # Filter & aggregate transactions by date range
├── useGoalProgress.ts       # Goal progress calculation (reads active goal by ID)
├── useDashboardFilter.ts    # Time range preset state + date calculation
└── useAnimatedNumber.ts     # Smooth number counting animation
```

## Data Persistence

- All Zustand stores use `persist` middleware with localStorage.
- On every state change, a debounced (500ms) JSON snapshot is saved under `rasko-finance-backup`.
- Schema version 2: multi-goal format with auto-migration from v1 (single goal).
- CSV export function available from settings — exports all transactions as downloadable file.
- CSV import parses columns: date, type, amount, category, note.

## Component Hierarchy

```
App
├── Layout
│   ├── Sidebar (3 nav items + QuickStats)
│   └── MainContent
│       ├── DashboardView
│       │   ├── TimeRangeFilter (pill row + custom date inputs)
│       │   ├── KPI Row (4 DataCards with animated numbers)
│       │   ├── IncomeExpenseBarChart (daily or weekly aggregation)
│       │   ├── CategoryDonutChart (with drill-down on click)
│       │   ├── IncomeStreamBreakdown
│       │   ├── InsightCard (auto-generated text insights)
│       │   ├── SpendingHeatmap (GitHub-style grid)
│       │   ├── MonthlyTrendLine (cumulative spending)
│       │   ├── CategoryTreemap
│       │   ├── SankeyFlowChart (income → expenses)
│       │   ├── TransactionList (expandable)
│       │   └── AddTransactionDialog (floating button)
│       ├── GoalView
│       │   ├── Goal Tabs (when multiple goals)
│       │   ├── SavingsThermometer
│       │   ├── Stats Column (saved, remaining, gap-to-goal, projected)
│       │   ├── WaterfallChart (monthly savings)
│       │   └── Dynamic Milestones
│       └── SettingsView
│           ├── IncomeTargetForm
│           ├── Manage Goals Link
│           └── Data Management (import/export/clear)
└── Dialogs
    ├── AddTransactionDialog
    ├── EditTransactionDialog
    ├── GoalForm Dialog (create/edit)
    └── Delete Confirmation Dialog
```

## Routing

React Router v6 (HashRouter):
- `/` → redirects to `/dashboard`
- `/dashboard` → DashboardView
- `/goals` → GoalView
- `/settings` → SettingsView
- `/daily`, `/weekly`, `/monthly`, `/goal` → legacy redirects to new routes

## Key Calculations

### Dashboard Time Filtering
```typescript
// Auto-aggregation: if range > 14 days, aggregate bars by week
const barData = rangeDays > 14
  ? aggregateByWeek(transactions, start, end)
  : dailyTotals;
```

### Sankey Data Flow
```typescript
// Builds: income sources → "Total Income" → expense category groups
buildSankeyData(byIncomeStream, byCategoryGroup)
```

### Dynamic Milestones
```typescript
// Auto-calculates N evenly-spaced milestones from target amount
generateMilestones(targetAmount, count = 6)
```
