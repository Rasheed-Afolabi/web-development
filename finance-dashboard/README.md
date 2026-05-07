# Rasko Finance Command Center

A personal finance dashboard built to track variable income across multiple streams, manage categorized expenses, and track progress toward multiple custom savings goals — all from a single rich dashboard.

## What This Is

A single-page React app with a dashboard-first design. One main page shows your complete financial picture through 11 interactive widgets — where money went, where it came from, spending patterns over time, and how you're tracking against your goals. Time-period views (daily/weekly/monthly) are replaced by filter pills on the dashboard.

## Features

- **Dashboard-First Design** — Single rich page with KPI row, cash flow bars, category donut, income breakdown, heatmap, treemap, Sankey flow, and more
- **Time Range Filters** — Today, This Week, This Month, Last Month, All Time, or Custom date range
- **Variable Income Tracking** — 11 income streams with target vs. actual comparison
- **Categorized Expenses** — 50+ pre-defined categories grouped into Essentials, Cost of Earning, Lifestyle, Growth, and Commitments
- **Multi-Goal System** — Create multiple savings goals with custom names, targets, and timelines
- **Interactive Charts** — Click donut slices to drill into transactions, expandable transaction lists
- **Spending Heatmap** — GitHub-style calendar showing 6 months of spending intensity
- **Money Flow Sankey** — Visualize how income flows into expense categories
- **CSV Import/Export** — Backup your data and import bank statements
- **Dark Luxury Aesthetic** — Rich visuals, animated charts, and a financial-magazine feel

## Tech Stack

- React 19 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Recharts
- Zustand (state management)
- localStorage (data persistence)
- Optional Supabase sync

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Navigation

| Route | Page | Purpose |
|-------|------|---------|
| `/dashboard` | Dashboard | Main page with all financial widgets |
| `/goals` | Goals | Multi-goal tracker with thermometer and milestones |
| `/settings` | Settings | Income targets, data management |

## Built With Claude Code

This project uses a `CLAUDE.md` file and supporting docs (`docs/ARCHITECTURE.md`, `docs/DOMAIN.md`, `docs/DESIGN.md`, `docs/WORKFLOW.md`) to maintain consistent development with Claude Code in VS Code. See `docs/WORKFLOW.md` for the full development and maintenance guide.
