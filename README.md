# Rasko Finance Command Center

A personal finance dashboard built to track variable income across multiple streams, manage categorized daily/weekly expenses, and hit a 6-month $30K savings goal.

## What This Is

A single-page React app designed for a weekly Sunday financial review ritual. Input transactions throughout the week, then open the dashboard on Sunday to see your entire financial picture — where money went, whether you're on track for your savings goal, and what to adjust next week.

## Features

- **Variable Income Tracking** — Three income streams (AI/Online Projects, Delivery, Factory Work) with target vs. actual comparison
- **Categorized Expenses** — 18 pre-defined categories grouped into Essentials, Cost of Earning, Lifestyle, Growth, and Commitments
- **4 Dashboard Views** — Daily Snapshot, Weekly Review, Monthly Overview, and Goal Tracker
- **$30K Savings Thermometer** — Visual goal tracker with pace indicators and projected completion date
- **CSV Import/Export** — Backup your data and import bank statements
- **Dark Luxury Aesthetic** — Not your typical dashboard. Rich visuals, animated charts, and a financial-magazine feel.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui
- Recharts
- Zustand (state management)
- localStorage (data persistence)

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## Built With Claude Code

This project uses a `CLAUDE.md` file and supporting docs (`docs/ARCHITECTURE.md`, `docs/DOMAIN.md`, `docs/DESIGN.md`, `docs/WORKFLOW.md`) to maintain consistent development with Claude Code in VS Code. See `docs/WORKFLOW.md` for the full development and maintenance guide.
