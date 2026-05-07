# Workflow — Development, Maintenance & Review Ritual

## Initial Project Setup

### 1. Create the GitHub Repository

```bash
# On GitHub: create a new repo called "rasko-finance-dashboard"
# Then locally:
mkdir rasko-finance-dashboard
cd rasko-finance-dashboard
git init
git remote add origin https://github.com/YOUR_USERNAME/rasko-finance-dashboard.git
```

### 2. Set Up the Project with Claude Code

Open VS Code in the project directory. Open a Command Prompt terminal (not PowerShell). Type `claude` and press Enter.

First prompt (in Plan Mode — hold Shift+Tab until you see "plan mode"):

```
I need you to read CLAUDE.md and all linked docs (docs/ARCHITECTURE.md, docs/DOMAIN.md, docs/DESIGN.md). 

Then create the full project scaffold following the exact structure, tech stack, and design system specified. 

Ask me questions to clarify anything before you write code.
```

Let Claude ask questions, answer them, review the plan, then let it build.

### 3. First Commit

```bash
git add .
git commit -m "feat: initial project scaffold with full design system"
git push -u origin main
```

## Git Workflow for Changes

Every change follows this pattern. No exceptions.

### Adding a Feature

```bash
git checkout main
git pull origin main
git checkout -b feature/description-of-feature
```

Open Claude Code. Describe the feature. Let Claude plan, then code. Test visually. Then:

```bash
git add .
git commit -m "feat: description of what was added"
git checkout main
git merge feature/description-of-feature
git push origin main
git branch -d feature/description-of-feature
```

### Fixing a Bug

```bash
git checkout main
git pull origin main
git checkout -b fix/description-of-bug
```

Open Claude Code. Describe the bug (what should happen vs. what actually happens). Let Claude find and fix it. Test. Then:

```bash
git add .
git commit -m "fix: description of what was fixed"
git checkout main
git merge fix/description-of-bug
git push origin main
git branch -d fix/description-of-bug
```

### Rolling Back a Bad Change

If a change broke something and you already committed:

```bash
git log --oneline          # find the commit hash of the last good state
git revert <commit-hash>   # creates a new commit that undoes the bad one
git push origin main
```

If you haven't committed yet:

```bash
git checkout -- .          # discard all uncommitted changes
```

## Running the Dashboard Locally

```bash
cd rasko-finance-dashboard
npm run dev
```

This opens the dashboard at `http://localhost:5173` (Vite default). Bookmark this URL.

## Deployment Options (When Ready)

For now, run locally. When you want it accessible from any device:

### Option A: Vercel (Recommended — Free)
1. Push to GitHub
2. Go to vercel.com, sign in with GitHub
3. Import the repo
4. It auto-detects Vite + React and deploys
5. You get a URL like `rasko-finance.vercel.app`

### Option B: GitHub Pages (Also Free)
1. Add `vite-plugin-gh-pages` to the project
2. Run `npm run build && npm run deploy`
3. Accessible at `https://YOUR_USERNAME.github.io/rasko-finance-dashboard`

**Note**: Since data is in localStorage, each browser/device has its own data. Use CSV export/import to sync between devices.

## Sunday Review Ritual — Calendar Setup

### Google Calendar Recurring Event

Create this manually in Google Calendar:

- **Title**: "Financial Review — Rasko Finance Dashboard"
- **When**: Every Sunday, pick a consistent time (e.g., 7:00 PM)
- **Recurrence**: Weekly on Sunday
- **Description**: Include the dashboard URL (localhost or Vercel link)
- **Reminder**: 30 minutes before

### What to Do During Sunday Review

1. Open the dashboard → set time filter to "This Week"
2. Check KPI row — income, expenses, net saved, savings rate
3. Review category donut — click slices to drill into transactions
4. Log any missing transactions via the floating "+" button
5. Check the Sankey flow — where is money going?
6. Switch to Goals page — check pace status for your active goal
7. Adjust next week's approach based on what you see
8. Export a CSV backup (monthly — first Sunday of each month)

## Maintaining the CLAUDE.md Over Time

The CLAUDE.md and supporting docs are living documents. Update them when:

- You add a new income stream → update DOMAIN.md
- You want new expense categories → update DOMAIN.md
- You change the design direction → update DESIGN.md
- Claude Code keeps making a mistake → add a rule to CLAUDE.md
- A rule in CLAUDE.md is being ignored → the file might be too long, prune it

### How to Update

```bash
git checkout -b docs/update-description
# Edit the relevant .md file
git add .
git commit -m "docs: description of change"
git checkout main
git merge docs/update-description
git push origin main
```

## Backup Strategy

- **Weekly**: The app auto-saves to localStorage on every change
- **Monthly**: Export CSV on the first Sunday of each month, store in a Google Drive folder called "Finance Backups"
- **Git**: Every code change is versioned in GitHub — you can always go back
