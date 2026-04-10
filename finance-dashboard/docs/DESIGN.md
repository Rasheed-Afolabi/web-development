# Design System — Rasko Finance Command Center

## Aesthetic Direction: "Luxury Data"

Think Bloomberg Terminal meets luxury brand editorial. Dark-mode primary. Rich, saturated accent colors against deep backgrounds. Data should feel alive — not like a spreadsheet, but like a high-end financial magazine personalized for one person.

**NOT THIS**: Generic shadcn gray cards on white background with Inter font and purple gradients. That is explicitly what we are avoiding.

**THIS**: Deep charcoal/near-black canvas. Cards with subtle glass-morphism or soft elevation. Bold typography for numbers. Rich color-coded categories. Smooth transitions. Charts that breathe with gentle animations on load.

## Color System

```css
:root {
  /* Canvas */
  --bg-primary:       #0F0F14;      /* deep night — main background */
  --bg-secondary:     #1A1A24;      /* card surfaces */
  --bg-tertiary:      #24243A;      /* hover states, active elements */
  --bg-elevated:      #2A2A42;      /* modals, dropdowns */

  /* Text */
  --text-primary:     #F0F0F5;      /* main text — near white, not pure white */
  --text-secondary:   #9898B0;      /* labels, descriptions */
  --text-muted:       #5A5A72;      /* timestamps, meta info */

  /* Accent — Savings/Positive */
  --accent-green:     #34D399;      /* on track, income, savings */
  --accent-green-dim: #065F46;      /* green backgrounds */

  /* Accent — Warning */
  --accent-amber:     #FBBF24;      /* off track, caution */
  --accent-amber-dim: #78350F;

  /* Accent — Danger */
  --accent-red:       #F87171;      /* danger, overspending */
  --accent-red-dim:   #7F1D1D;

  /* Accent — Info/Primary Action */
  --accent-blue:      #60A5FA;      /* links, primary buttons */
  --accent-indigo:    #818CF8;      /* AI projects income stream */

  /* Chart Category Colors — see DOMAIN.md for full mapping */
  /* These should be vibrant and distinguishable against dark backgrounds */

  /* Borders & Dividers */
  --border-subtle:    #2A2A3E;
  --border-active:    #4A4A6A;
}
```

## Typography

Import from Google Fonts. Do NOT use Inter, Roboto, Arial, or system fonts.

- **Display / Hero Numbers**: `"Instrument Sans"` or `"Sora"` — weight 700. Used for big financial numbers ($5,230.00), goal amounts, and section headers. These numbers should feel substantial.
- **Headings**: `"Instrument Sans"` — weight 600. Section titles, card headers.
- **Body / Labels**: `"DM Sans"` — weight 400/500. Transaction descriptions, category labels, form inputs.
- **Mono / Currency**: `"JetBrains Mono"` or `"IBM Plex Mono"` — weight 500. Used exclusively for monetary amounts in tables and lists. Gives numbers a financial-terminal feel.

### Number Display Rules

- All dollar amounts display with **2 decimal places**: `$1,234.56`
- Large numbers on hero cards use **3.2rem+** sizing
- Positive amounts: `--accent-green`
- Negative amounts / expenses: `--accent-red`
- Use `Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })` for all currency formatting

## Card Design

Every data widget lives in a card. Cards should:
- Use `--bg-secondary` background
- Have `border: 1px solid var(--border-subtle)`
- Border radius: `12px` (not 4px or 8px — rounder feels premium)
- Padding: `24px`
- On hover: subtle border shift to `--border-active` with `transition: border-color 0.2s ease`
- Optional: very subtle `backdrop-filter: blur(8px)` on elevated cards for glass effect

## Chart Styling (Recharts)

All charts must follow these rules:

### General
- Dark background (transparent — inherits card bg)
- Grid lines: `--border-subtle` at 0.3 opacity. Minimal grid — only horizontal reference lines.
- Axis labels: `--text-muted`, DM Sans, 12px
- Tooltips: `--bg-elevated` background, `--text-primary` text, `border-radius: 8px`, subtle shadow
- Legend: bottom-aligned, `--text-secondary`, small dots for color indicators

### Bar Charts (Income vs. Expense)
- Rounded bar caps: `radius={[6, 6, 0, 0]}`
- Income bars: gradient from `--accent-green` to slightly lighter
- Expense bars: gradient from `--accent-red` to slightly lighter
- Bar gap: generous spacing — bars should not feel cramped
- Animate on load: bars grow upward over 800ms with easeOut

### Pie / Donut Charts (Category Breakdown)
- Use donut style (innerRadius 60%+) — never filled pie
- Center of donut shows the total amount in large display font
- Segments use category colors from DOMAIN.md
- Active segment expands slightly on hover (outerRadius + 8px)
- Animate on load: segments sweep in clockwise over 1000ms

### Line Charts (Trends)
- Smooth curves: `type="monotone"`
- Line width: 2.5px
- Dot on hover only — no permanent dots
- Area fill: subtle gradient from line color to transparent (opacity 0.1 to 0)
- Animate on load: line draws left-to-right over 1200ms

### Thermometer / Progress (Goal Tracker)
- This is the hero visual of the Goal view
- Vertical or horizontal thermometer — large, at least 300px tall
- Fill gradient from `--accent-red` (empty) through `--accent-amber` (midway) to `--accent-green` (full)
- Current amount displayed prominently inside or beside the fill
- Milestone markers as notches along the side ($5K, $10K, etc.)
- Animate fill on page load — liquid-rise effect over 1500ms
- Subtle pulse glow at the current fill level

## Status Indicators

The On Track / Off Track / Danger system is central to the Sunday Review experience.

- **On Track**: Green glowing badge, subtle pulse animation, upward arrow icon
- **Off Track**: Amber badge, steady (no pulse), horizontal arrow icon
- **Danger**: Red badge, faster pulse, downward arrow icon, optional card border turns red

These should be **impossible to miss** — placed prominently on the Weekly Review header.

## Animations & Micro-Interactions

- **Page transitions**: Fade + slight upward slide (200ms)
- **Card load**: Stagger cards appearing by 100ms each (first card immediate, second at 100ms, etc.)
- **Number counting**: When a financial number appears, count up from 0 to the actual value over 600ms. Use a smooth easing function. This makes numbers feel dynamic.
- **Button hover**: Scale 1.02 with subtle shadow increase
- **Transaction added**: Brief green flash on the list, new row slides in from top
- **Sidebar active indicator**: Smooth sliding highlight bar (not instant switch)

## Responsive Behavior

- Primary target: **Desktop browser** (this is reviewed on a laptop/desktop)
- Secondary: Tablet
- Mobile: Functional but not primary — the Sunday ritual happens on a bigger screen
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`
- Cards reflow to single column on mobile, 2-col on tablet, 3-4 col on desktop

## Icons

Use `lucide-react` exclusively. Icon size default: 20px. Icon color inherits from text color unless it's a category indicator.

## Empty States

When no data exists for a view (first-time use), show:
- An illustrated empty state (simple SVG illustration, not just text)
- A clear call-to-action: "Add your first transaction" with an arrow pointing to the form
- The tone should be encouraging, not clinical
