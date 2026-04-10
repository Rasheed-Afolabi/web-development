# Rasko Finance Command Center

A personal finance dashboard for tracking variable income across multiple streams, managing daily/weekly expenses by category, and hitting a 6-month $30K savings goal. Built for one user (Rasko) who reviews finances every Sunday.

## Tech Stack

- **Framework**: React 18+ with TypeScript (strict mode)
- **Build**: Vite
- **Styling**: Tailwind CSS + shadcn/ui components
- **Charts**: Recharts (all visual data representations)
- **Storage**: localStorage with JSON (no backend — runs locally in browser)
- **Data Export**: CSV import/export for backup and bank statement ingestion

## Project Structure

```
src/
├── components/
│   ├── layout/          # Shell, sidebar, navigation
│   ├── dashboard/       # Main dashboard widgets and cards
│   ├── charts/          # All Recharts visual components
│   ├── forms/           # Transaction entry, income logging
│   └── ui/              # shadcn/ui primitives
├── hooks/               # Custom React hooks (useTransactions, useGoals, etc.)
├── lib/                 # Utilities, calculations, formatters
├── stores/              # State management (Zustand)
├── types/               # TypeScript interfaces and enums
├── data/                # Default categories, constants
└── views/               # Page-level components (Daily, Weekly, Monthly, Goal)
```

## Commands

- `npm run dev` — Start dev server
- `npm run build` — Production build
- `npm run lint` — ESLint check
- `npm run type-check` — TypeScript strict check
- `npm run preview` — Preview production build

## Key Principles

- **IMPORTANT**: This is NOT a generic dashboard. Read @docs/DESIGN.md before writing ANY UI code. The visual identity is intentional — luxury-minimal with bold data visualization. No default shadcn/Tailwind gray-on-white aesthetics.
- **IMPORTANT**: Every number on screen must have a visual companion — a chart, progress bar, indicator, or animation. Never display raw numbers alone.
- Variable income means targets recalculate dynamically. See @docs/DOMAIN.md for the income/expense model.
- All monetary values stored in cents (integers) to avoid floating-point errors. Display as dollars with 2 decimal places.
- localStorage is the single source of truth. Every write triggers a JSON export to prevent data loss.
- Categories are pre-defined but user-extensible. See @docs/DOMAIN.md for the full category taxonomy.

## Code Style

- Use functional components with hooks exclusively. No class components.
- Prefer named exports. One component per file.
- Use Zustand for global state. No prop drilling beyond 2 levels.
- All chart components accept data via props — keep data fetching in hooks, rendering in components.
- Use `date-fns` for all date manipulation. No raw Date() math.
- Tailwind classes only — no inline styles, no CSS modules, no styled-components.

## Working on Features or Bugs

- **IMPORTANT**: Always create a git branch before making changes: `git checkout -b feature/description` or `git checkout -b fix/description`
- Run `npm run type-check` after every change to verify TypeScript compliance.
- Test the UI visually in the browser after every change — this is a visual product.
- Commit when the app is in a working state. Do not batch large changes into single commits.

## Architecture & Domain Details

- @docs/ARCHITECTURE.md — Component hierarchy, state flow, data persistence
- @docs/DOMAIN.md — Data models, income streams, expense categories, goal calculations
- @docs/DESIGN.md — Visual identity, color system, typography, chart styling, animation guidelines
- @docs/WORKFLOW.md — Git workflow, deployment, maintenance, calendar integration
