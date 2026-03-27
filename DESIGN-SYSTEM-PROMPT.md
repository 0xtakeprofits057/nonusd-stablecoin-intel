# Non-USD Stablecoin Intelligence — Design System & UI/UX Specification

> **Role**: You are a senior UI/UX designer and frontend architect with 15+ years of experience shipping institutional-grade financial dashboards. Your design sensibility blends Apple's Human Interface Guidelines with the information density required by professional trading terminals (Bloomberg, Refinitiv). You also draw inspiration from **Nubank's fintech design language** — their dark mode elevation model, bold hero typography for key financial figures, rounded icon action strips, and progressive disclosure through stacked sections with generous padding. You have deep expertise in responsive design systems, motion design, accessibility, and CSS architecture.

---

## 1. Project Context

**Product**: Non-USD Stablecoin Intelligence Dashboard — a data-rich analytical tool tracking market caps, trading pairs, DeFi yields, issuer profiles, and blockchain distribution for non-USD-denominated stablecoins.

**Primary Audience**: Institutional finance professionals — fund managers, research analysts, and compliance officers who expect Bloomberg/Reuters-level polish. They scan dashboards quickly, need data hierarchy to be immediately legible, and value density over decoration.

**Deployment Target**: Cloudflare Pages (static site). All assets must be CDN-friendly. No server-side rendering. Font loading must be optimized for global edge delivery.

**Current State**: Single 4,000-line HTML file with inline CSS/JS, Chart.js + D3 charts, 8 tab views. The redesign will create a modular design system foundation first, then views will be rebuilt on top of it.

---

## 2. Design Philosophy

### 2.1 Core Principles

1. **Data-first hierarchy** — Every pixel serves information. Decoration is banned unless it improves scanability. White space is used strategically to separate data groups, not as filler.

2. **Apple-inspired, Bloomberg-dense** — Borrow Apple Stocks' visual language (dark surfaces, luminous typography, gradient area charts, rounded containers) but allow 40–60% more information density per viewport than Apple would. Think "Apple designed a Bloomberg terminal."

3. **Progressive disclosure** — Surface headline metrics immediately. Reveal depth on interaction (hover tooltips, expandable sections, drill-down navigation). Never overwhelm on first glance.

4. **Institutional trust** — No playful gradients, no crypto-bro aesthetics. Muted, confident color usage. Precision in alignment and spacing signals credibility.

5. **Motion with purpose** — Every animation must communicate state change, data transition, or spatial relationship. No animation for decoration. All motion must feel physically plausible (spring-based easing, momentum).

### 2.2 Design Reference: Apple Stocks App

Study and adapt these specific patterns from Apple Stocks:

- **Luminous text on dark surfaces**: Large, bold numbers (market cap, price) rendered in pure white or near-white on deep dark backgrounds. Secondary text in muted gray.
- **Gradient area charts**: Colored line with a soft gradient fill fading to transparent below. No grid lines — clean, minimal axes.
- **Card containers**: Subtle rounded rectangles with thin borders or slight elevation. Cards group related metrics.
- **Sparklines in list rows**: Tiny inline charts next to each currency in list views — showing 7d or 30d trend at a glance.
- **Segmented controls**: Pill-shaped time range selectors (1D, 1W, 1M, 3M, 1Y, ALL).
- **Color-coded change indicators**: Green for positive, red for negative — used sparingly and consistently.
- **Sticky header with live summary**: Top bar always shows the most critical aggregate metrics.

### 2.3 Design Reference: Nubank Fintech App

Study and adapt these specific patterns from Nubank's banking app (secondary reference, complements Apple Stocks):

- **Dark mode elevation model**: Cards use a slightly lighter dark surface (`#1C1C1E` → `#2C2C2E`) floating on true black, with NO visible borders. Elevation is communicated purely through background contrast and subtle shadow. This feels warmer and more premium than border-based separation.
- **Hero financial numbers**: Account balances and key values rendered in 28–34px bold white, with a small muted label above (10–11px, uppercase or sentence case in gray). The number dominates the visual weight of the card.
- **Circular icon action strip**: Primary actions (Pix, Pagar, Transferir, Depositar) presented as circular icon buttons in a horizontal row. Icons are 44–48px circles with dark/muted backgrounds and white/light icons. Labels sit below in small text. Apply this pattern to the currency quick-select row.
- **Section-based vertical flow**: Content is stacked in discrete sections with generous vertical padding (20–24px between sections). Sections are separated by subtle background changes or thin dividers, not heavy borders. Each section has a bold title and chevron for drill-down.
- **Progressive disclosure via chevrons**: Rows with `>` chevrons indicate tap-to-expand. This is cleaner than showing all data at once. Apply to asset rows and issuer rows — show headline metric, hide detail behind a click.
- **Pill-style period selectors**: Time period toggles ("Este mês", "Setembro", "Outubro") rendered as horizontal pills with rounded backgrounds. Active pill filled, inactive outlined or transparent. Same pattern as our segmented controls but slightly more rounded and spaced.
- **Green for positive, red for negative**: `+R$ 820,13` in vivid green. Consistent with Apple's semantic colors. Bold weight for change values to draw the eye.
- **Minimal decoration**: No gradients on cards, no ornamental elements. Visual hierarchy created entirely through typography weight, size, and color contrast. Every element earns its pixels.
- **Dark donut charts**: Donut/pie charts with wide strokes, dark center, and a clean legend. Segments have generous gaps between them.

**How to blend Apple Stocks + Nubank**: Use Apple's color system and chart rendering (gradient area charts, sparklines). Use Nubank's card elevation model (no borders in dark mode, background contrast only), hero number sizing, and progressive disclosure patterns. The result should feel like a Bloomberg terminal designed by Apple's HIG team with Nubank's dark-mode polish.

---

## 3. Design Tokens — Full Specification

All values are defined as CSS custom properties on `:root` (light) and `[data-theme="dark"]` (dark). Every component references tokens — never raw values.

### 3.1 Color Palette

```css
:root {
  /* === SURFACES === */
  --surface-primary: #FFFFFF;
  --surface-secondary: #F5F5F7;       /* Apple's signature warm gray */
  --surface-tertiary: #E8E8ED;
  --surface-elevated: #FFFFFF;
  --surface-overlay: rgba(0, 0, 0, 0.45);

  /* === TEXT === */
  --text-primary: #1D1D1F;            /* Apple's near-black */
  --text-secondary: #6E6E73;
  --text-tertiary: #AEAEB2;
  --text-quaternary: #C7C7CC;
  --text-on-accent: #FFFFFF;

  /* === BORDERS === */
  --border-primary: rgba(0, 0, 0, 0.08);
  --border-secondary: rgba(0, 0, 0, 0.04);
  --border-focus: #0071E3;            /* Apple blue */

  /* === ACCENTS === */
  --accent-blue: #0071E3;             /* Primary action, links */
  --accent-blue-hover: #0077ED;
  --accent-blue-muted: rgba(0, 113, 227, 0.12);

  /* === SEMANTIC === */
  --color-positive: #34C759;          /* Apple green */
  --color-positive-bg: rgba(52, 199, 89, 0.10);
  --color-negative: #FF3B30;          /* Apple red */
  --color-negative-bg: rgba(255, 59, 48, 0.10);
  --color-warning: #FF9500;
  --color-warning-bg: rgba(255, 149, 0, 0.10);
  --color-neutral: #8E8E93;

  /* === CHART PALETTE === */
  /* Ordered for maximum distinguishability at small sizes */
  --chart-1: #0071E3;                 /* Blue — primary series */
  --chart-2: #34C759;                 /* Green */
  --chart-3: #FF9500;                 /* Orange */
  --chart-4: #AF52DE;                 /* Purple */
  --chart-5: #FF2D55;                 /* Pink */
  --chart-6: #5AC8FA;                 /* Teal */
  --chart-7: #FFCC00;                 /* Yellow */
  --chart-8: #FF3B30;                 /* Red */

  /* === SHADOWS === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.10), 0 4px 16px rgba(0, 0, 0, 0.06);
  --shadow-card: 0 0.5px 1px rgba(0, 0, 0, 0.04);
  --shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.08);

  /* === TRANSITIONS === */
  --ease-out: cubic-bezier(0.25, 0.46, 0.45, 0.94);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-apple: cubic-bezier(0.4, 0, 0.2, 1);
  --duration-fast: 150ms;
  --duration-normal: 250ms;
  --duration-slow: 400ms;
  --duration-enter: 350ms;
  --duration-exit: 200ms;
}

[data-theme="dark"] {
  /* === SURFACES === */
  --surface-primary: #000000;          /* True black — OLED friendly, Apple Stocks style */
  --surface-secondary: #1C1C1E;        /* Apple's elevated dark surface */
  --surface-tertiary: #2C2C2E;
  --surface-elevated: #1C1C1E;
  --surface-overlay: rgba(0, 0, 0, 0.65);

  /* === TEXT === */
  --text-primary: #F5F5F7;
  --text-secondary: #98989D;
  --text-tertiary: #6E6E73;
  --text-quaternary: #48484A;
  --text-on-accent: #FFFFFF;

  /* === BORDERS === */
  /* Nubank influence: in dark mode, minimize visible borders.
     Use background-contrast elevation instead. Borders exist
     but are near-invisible — only used for interactive focus states. */
  --border-primary: rgba(255, 255, 255, 0.06);
  --border-secondary: rgba(255, 255, 255, 0.03);
  --border-focus: #0A84FF;             /* Apple blue for dark mode */

  /* === ACCENTS === */
  --accent-blue: #0A84FF;
  --accent-blue-hover: #409CFF;
  --accent-blue-muted: rgba(10, 132, 255, 0.16);

  /* === SEMANTIC — slightly brighter for dark backgrounds === */
  --color-positive: #30D158;
  --color-positive-bg: rgba(48, 209, 88, 0.14);
  --color-negative: #FF453A;
  --color-negative-bg: rgba(255, 69, 58, 0.14);
  --color-warning: #FFD60A;
  --color-warning-bg: rgba(255, 214, 10, 0.14);
  --color-neutral: #636366;

  /* === CHART PALETTE — boosted luminance for dark === */
  --chart-1: #0A84FF;
  --chart-2: #30D158;
  --chart-3: #FF9F0A;
  --chart-4: #BF5AF2;
  --chart-5: #FF375F;
  --chart-6: #64D2FF;
  --chart-7: #FFD60A;
  --chart-8: #FF453A;

  /* === SHADOWS — more subtle in dark mode === */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.20);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.25);
  --shadow-lg: 0 8px 24px rgba(0, 0, 0, 0.30);
  --shadow-xl: 0 16px 48px rgba(0, 0, 0, 0.40);
  --shadow-card: 0 0.5px 1px rgba(0, 0, 0, 0.15);
  --shadow-card-hover: 0 4px 16px rgba(0, 0, 0, 0.30);
}
```

### 3.2 Typography

**Font**: Inter (loaded from Google Fonts or self-hosted on Cloudflare).

```css
:root {
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-mono: 'SF Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;

  /* === TYPE SCALE === */
  /* Named semantically, not by size */
  --text-hero: 600 34px/1.1 var(--font-sans);        /* Total market cap headline */
  --text-headline: 700 24px/1.15 var(--font-sans);    /* Section titles */
  --text-title: 700 17px/1.25 var(--font-sans);       /* Card titles, currency names */
  --text-body: 400 14px/1.5 var(--font-sans);         /* Default body text */
  --text-callout: 600 13px/1.4 var(--font-sans);      /* Metric values, bold body */
  --text-caption: 500 12px/1.35 var(--font-sans);     /* Secondary labels */
  --text-micro: 600 10px/1.3 var(--font-sans);        /* Table headers, badges, uppercase labels */
  --text-data: 700 13px/1.3 var(--font-mono);         /* Trading pairs, addresses, monospace data */

  /* === LETTER SPACING === */
  --tracking-tight: -0.022em;          /* For hero/headline sizes */
  --tracking-normal: -0.006em;         /* For body text */
  --tracking-wide: 0.06em;            /* For uppercase micro labels */
}
```

### 3.3 Spacing

8px base grid. All spacing uses multiples of 4px for fine-tuning.

```css
:root {
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-7: 32px;
  --space-8: 40px;
  --space-9: 48px;
  --space-10: 64px;

  /* Semantic spacing */
  --gap-card: var(--space-3);         /* 12px — between cards in a grid */
  --gap-section: var(--space-6);      /* 24px — between major sections */
  --padding-card: var(--space-4);     /* 16px — inner card padding */
  --padding-page: var(--space-5);     /* 20px — page-level horizontal padding */
  --padding-page-lg: var(--space-7);  /* 32px — page padding on wide screens */
}
```

### 3.4 Border Radius

```css
:root {
  --radius-sm: 6px;        /* Buttons, badges, small inputs */
  --radius-md: 10px;       /* Cards, panels */
  --radius-lg: 14px;       /* Large cards, modals */
  --radius-xl: 20px;       /* Pill buttons, segmented controls */
  --radius-full: 9999px;   /* Circles, fully rounded pills */
}
```

### 3.5 Layout Breakpoints

```css
/* Mobile-first breakpoints */
--bp-sm: 640px;    /* Large phones / small tablets */
--bp-md: 768px;    /* Tablets */
--bp-lg: 1024px;   /* Small laptops */
--bp-xl: 1280px;   /* Desktops */
--bp-2xl: 1536px;  /* Large desktops */
--bp-3xl: 1920px;  /* Ultrawides — max content width */
```

---

## 4. Information Architecture — Redesigned

### 4.1 Navigation: Sidebar + Contextual Tabs

Replace the flat 8-tab bar with a **collapsible left sidebar** for primary navigation, plus **contextual segmented controls** within views.

```
┌──────────────────────────────────────────────────────┐
│ [Logo]  Non-USD Intelligence     [Search] [◑ Theme]  │  ← Sticky top bar
├──────┬───────────────────────────────────────────────┤
│      │                                               │
│  ◉   │   Market Overview                             │
│ Mkt  │   ┌─────────┬─────────┬──────────┐           │
│      │   │ KPI Row │ KPI Row │ KPI Row  │           │
│  📊  │   ├─────────┴─────────┴──────────┤           │
│ Deep │   │ Main chart (area, gradient)   │           │
│ Dive │   ├──────────────────┬────────────┤           │
│      │   │ Top movers table │ Donut      │           │
│  ⚗️   │   └──────────────────┴────────────┘           │
│ DeFi │                                               │
│      │                                               │
│  ⚖️   │                                               │
│ CeD  │                                               │
│      │                                               │
│      │                                               │
│  ⚙️   │                                               │
│ More │                                               │
└──────┴───────────────────────────────────────────────┘
```

**Primary sidebar items** (always visible):
1. **Market Overview** — KPIs, aggregate charts, top movers, market context
2. **Deep Dive** — Currency explorer with full drill-down (replaces "By Currency")
3. **DeFi** — TVL, yields, protocol data
4. **CeD Compare** — Centralized vs decentralized comparison

**"More" flyout** (secondary, on-demand):
- By Issuer
- By Blockchain
- By Region
- All Assets (table)

### 4.2 What to Cut / Deprioritize

| Current Feature | Recommendation | Rationale |
|---|---|---|
| **By Region / Continent map** | **Demote to "More" menu** | Geographic breakdown is the least actionable view for institutional users. The D3 world map is expensive to render and low-signal. Keep the data, hide the map behind a click. |
| **By Issuer** | **Demote to "More" menu** | Useful for due diligence but not daily monitoring. Card-grid layout wastes space — when accessed, render as a dense sortable table instead. |
| **By Blockchain** | **Demote to "More" menu** | Chain distribution matters but is secondary to currency and protocol views. |
| **All Assets tab** | **Merge into Market Overview** | The "All Assets" table should be the bottom section of the Overview, not a separate tab. Add column sort + filter. |
| **CeD Compare** | **Keep as primary view** | Unique differentiator. Strengthen the visual comparison (side-by-side KPIs, divergence chart). |
| **Market Context section** | **Promote into Overview header** | FX scale and comparison bars should be part of the Overview's KPI area, not buried in a panel. |

### 4.3 Redesigned View: Market Overview

```
┌─────────────────────────────────────────────────────────┐
│ HEADER BAR (sticky)                                     │
│ "Non-USD Stablecoin Intelligence"                       │
│ Total MC: $8.2B ↑3.2%  │  24h Vol: $412M  │  Assets: 47│
├─────────────────────────────────────────────────────────┤
│                                                         │
│ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐          │
│ │ EUR  │ │ BRL  │ │ GBP  │ │ JPY  │ │ MXN  │  ← Currency│
│ │$4.1B │ │$1.2B │ │$820M │ │$340M │ │$210M │    pills  │
│ │↑2.1% │ │↑5.4% │ │↓0.3% │ │↑1.8% │ │↑0.9% │          │
│ └──────┘ └──────┘ └──────┘ └──────┘ └──────┘          │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │  Total Market Cap Over Time                       │  │
│ │  [1D] [1W] [1M] [3M] [1Y] [ALL]                  │  │
│ │                                                   │  │
│ │  ~~~~ gradient area chart ~~~~                    │  │
│ │                                                   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─────────────────────┐ ┌──────────────────────────┐   │
│ │ Distribution (donut)│ │ Top Movers (24h)         │   │
│ │                     │ │ EURS   +12.4%  ██████   │   │
│ │   [chart]           │ │ BRZ    +8.2%   █████    │   │
│ │                     │ │ GYEN   -3.1%   ██       │   │
│ └─────────────────────┘ └──────────────────────────┘   │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ All Assets                          [Filter] [↕]  │  │
│ │ ┌────┬──────┬────────┬───────┬──────┬──────────┐ │  │
│ │ │Flag│Symbol│Mkt Cap │24h Chg│7d Chg│ Sparkline│ │  │
│ │ ├────┼──────┼────────┼───────┼──────┼──────────┤ │  │
│ │ │ 🇪🇺 │EURC  │$2.1B   │+1.2%  │+3.4% │ ~~~     │ │  │
│ │ │ 🇧🇷 │BRZ   │$890M   │+5.4%  │+8.1% │ ~~~     │ │  │
│ └─┴────┴──────┴────────┴───────┴──────┴──────────┘─┘  │
└─────────────────────────────────────────────────────────┘
```

### 4.4 Redesigned View: Currency Deep Dive

When a user clicks any currency (from the pills, table, or sidebar), transition into a full-width deep dive:

```
┌─────────────────────────────────────────────────────────┐
│ ← Back to Overview                                      │
│                                                         │
│ 🇪🇺 Euro Stablecoins                                     │
│ Total MC: $4.12B   24h Vol: $180M   Assets: 8          │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Price / Market Cap Chart       [1D][1W][1M][1Y]   │  │
│ │ ~~~~ interactive area chart with crosshair ~~~~   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌─── EURC ────────────────────┐ ┌─── EURS ──────────┐ │
│ │ Circle · $2.1B · +1.2%     │ │ Stasis · $890M    │ │
│ │ ┌──────────────────────┐   │ │ ┌────────────────┐ │ │
│ │ │ Metrics grid         │   │ │ │ Metrics grid   │ │ │
│ │ │ Vol │ Chains │ Pairs  │   │ │ │ Vol │ Chains   │ │ │
│ │ └──────────────────────┘   │ │ └────────────────┘ │ │
│ │ ▸ Trading Pairs (12)       │ │ ▸ Trading Pairs    │ │
│ │ ▸ DeFi Pools (8)           │ │ ▸ DeFi Pools       │ │
│ └────────────────────────────┘ └────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Component Specifications

### 5.1 KPI Card

```
┌──────────────────────┐
│ TOTAL MARKET CAP     │  ← var(--text-micro), uppercase, var(--text-tertiary), var(--tracking-wide)
│ $8.24B               │  ← var(--text-hero), var(--text-primary), var(--tracking-tight)
│ ↑ 3.2% (24h)        │  ← var(--text-callout), var(--color-positive)
└──────────────────────┘
Background: var(--surface-secondary)
Border: 1px solid var(--border-primary)
  → In dark mode: border becomes near-invisible (Nubank style).
    Card "floats" on background contrast alone.
Border-radius: var(--radius-md)
Padding: var(--space-4) var(--space-5)   /* Generous horizontal padding — Nubank influence */
Hover: var(--shadow-card-hover), translateY(-1px) with var(--ease-spring)
Number sizing: The primary value ($8.24B) should DOMINATE the card.
  → Nubank principle: the number is the hero, everything else is supporting context.
```

### 5.2 Segmented Control (Time Range Picker)

```
┌───────────────────────────────────────┐
│ [1D] [1W] [ 1M ] [3M] [1Y] [ALL]    │
└───────────────────────────────────────┘
Container: var(--surface-tertiary), var(--radius-xl), padding 2px
Segment: padding 6px 14px, var(--text-micro), var(--text-secondary)
Active segment: var(--surface-elevated), var(--shadow-sm), var(--text-primary), var(--radius-xl)
Transition: active indicator slides with var(--ease-apple) var(--duration-normal)
```

### 5.3 Asset Row (in table)

```
┌────┬───────┬──────────┬────────┬────────┬───────────────┐
│ 🇪🇺 │ EURC  │ $2.14B   │ +1.2%  │ +3.4%  │ ~~sparkline~~ │
│    │ Euro  │          │        │        │               │
└────┴───────┴──────────┴────────┴────────┴───────────────┘
Row height: 52px
Flag: 20px, var(--radius-sm)
Symbol: var(--text-callout), var(--text-primary)
Sub-name: var(--text-caption), var(--text-tertiary)
Market cap: var(--text-callout), var(--text-primary), right-aligned
Change: var(--text-callout), var(--color-positive) or var(--color-negative)
Sparkline: 80px wide, 24px tall, SVG, stroke 1.5px, color matches change direction
Hover: background var(--accent-blue-muted), transition var(--duration-fast)
Border-bottom: 1px solid var(--border-secondary)
```

### 5.4 Asset Detail Row — Nubank-Style Progressive Disclosure

```
┌─────────────────────────────────────────────────────────┐
│ 🇪🇺  EURC                          $2.14B        ›     │
│     Euro Coin · Circle              +1.24% (24h)       │
├─────────────────────────────────────────────────────────┤
│  [expanded on click — Nubank chevron pattern]           │
│                                                         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐  │
│  │ 24H VOL  │ │ 7D CHG   │ │ CHAINS   │ │ PAIRS    │  │
│  │ $42.3M   │ │ +3.41%   │ │ 4        │ │ 12       │  │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘  │
│                                                         │
│  ~~~ inline sparkline (30d) ~~~                        │
│                                                         │
│  ▸ Trading Pairs       ▸ DeFi Pools                    │
└─────────────────────────────────────────────────────────┘
```
Collapsed state: Shows flag, symbol, name/issuer, market cap, 24h change, and a `›` chevron.
  Row height: 64px. Generous padding (Nubank influence — breathable rows, not cramped tables).
  Background: var(--surface-secondary). No border in dark mode.
  Hover: var(--surface-tertiary) background.
Expanded state: Slides open (max-height transition, 300ms var(--ease-apple)).
  Shows metrics grid, sparkline, and sub-navigation links.
  Chevron rotates 90° on expand.
This replaces the dense "All Assets" table for the primary view.
The traditional sortable table is still available as a "Table view" toggle.

### 5.5 Tooltip (on hover)

```
┌─────────────────────────────┐
│ EURC · Euro Coin            │
│ ─────────────────────────── │
│ Market Cap    $2.14B        │
│ 24h Volume    $42.3M        │
│ 24h Change    +1.24%        │
│ 7d Change     +3.41%        │
│ Chains        Ethereum, Base│
│ Issuer        Circle        │
└─────────────────────────────┘
Background: var(--surface-elevated)
Border: 1px solid var(--border-primary)
Shadow: var(--shadow-lg)
Border-radius: var(--radius-md)
Padding: var(--space-3) var(--space-4)
Max-width: 280px
Appears: var(--duration-fast) fade + translateY(4px → 0)
Position: follows cursor with 12px offset, flip to stay in viewport
Font: var(--text-caption) for labels, var(--text-callout) for values
Pointer-events: none (tooltip doesn't block interaction)
```

### 5.5 Currency Quick-Select Strip (Nubank-inspired)

```
  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐  ┌────┐
  │ 🇪🇺 │  │ 🇧🇷 │  │ 🇬🇧 │  │ 🇯🇵 │  │ 🇲🇽 │  │ ··· │
  │$4.1B│  │$1.2B│  │$820M│  │$340M│  │$210M│  │More│
  │+2.1%│  │+5.4%│  │-0.3%│  │+1.8%│  │+0.9%│  │    │
  └────┘  └────┘  └────┘  └────┘  └────┘  └────┘
```
Inspired by Nubank's circular action strip (Pix, Pagar, Transferir).
Container: Horizontal scrollable row, no wrap. Scroll indicators on edges.
Item: 88px wide, var(--surface-secondary) background, var(--radius-lg) border-radius
  → In dark mode: slightly lighter card (#2C2C2E) on true black. No border.
Flag: 24px emoji, centered
Value: var(--text-callout), var(--text-primary), centered
Change: var(--text-micro), var(--color-positive) or var(--color-negative), centered
Active state: var(--accent-blue-muted) background, subtle ring (2px var(--accent-blue))
Hover: scale(1.03) with var(--ease-spring), var(--shadow-md)
Tap/click: Navigate to that currency's deep-dive view
On mobile: Full-bleed horizontal scroll, snaps to items (scroll-snap-type: x mandatory)

### 5.6 Sidebar Navigation

```
Width: 64px (collapsed) / 220px (expanded)
Background: var(--surface-secondary) with backdrop-filter: blur(20px)
Border-right: 1px solid var(--border-primary)
Item height: 44px
Item icon: 20px, centered
Item label: var(--text-caption), hidden when collapsed, slide-in when expanded
Active item: var(--accent-blue-muted) background, var(--accent-blue) icon color,
             left 3px var(--accent-blue) indicator bar
Hover: var(--surface-tertiary) background
Collapse/expand: var(--ease-apple) var(--duration-slow)
On mobile (<768px): transforms to bottom tab bar, 5 items max
```

---

## 6. Chart Recommendations

### 6.1 Strategy: D3 for Everything

**Drop Chart.js entirely.** Rationale:

- Chart.js uses `<canvas>` which makes hover interactions, tooltips, and theme transitions harder to control pixel-by-pixel.
- D3 with SVG gives full control over gradients, animations, responsive sizing, and Apple-style visual polish.
- The dashboard already uses D3 for the map. Consolidating on one library reduces bundle size and maintenance.
- SVG charts respond to CSS custom properties, making dark/light theme transitions seamless.

### 6.2 Chart Styles

**Area Chart (primary):**
- Stroke: 2px, `var(--chart-1)`, `stroke-linecap: round`, `stroke-linejoin: round`
- Fill: Linear gradient from `var(--chart-1)` at 30% opacity → transparent at bottom
- No grid lines. Minimal Y-axis labels (3–4 ticks, right-aligned, `var(--text-tertiary)`)
- X-axis: date labels only at endpoints and midpoint
- Crosshair on hover: vertical line (1px, `var(--border-primary)`) + circle dot on data point + floating tooltip

**Donut Chart:**
- Inner radius: 65% of outer radius (thick ring, not thin)
- Segment gap: 2px (use `stroke` on segments)
- Center label: Total value in `var(--text-headline)`
- Legend: Below chart, horizontal, `var(--text-caption)`, dot + label + value

**Sparklines (inline):**
- Pure SVG, 80×24px viewport
- Stroke: 1.5px, color = green if positive change, red if negative
- No fill, no axes, no labels
- Polyline with `stroke-linecap: round`

**Bar Chart (horizontal, for comparisons):**
- Apple-style rounded bars: `rx="4"`
- Bar height: 24px, gap: 8px
- Label left of bar, value right of bar or inside if bar is wide enough
- Background track: `var(--surface-tertiary)` full-width bar behind the fill

---

## 7. Motion & Animation Specification

### 7.1 Principles

- **Spring physics over linear easing.** Use `cubic-bezier(0.34, 1.56, 0.64, 1)` for elements entering view (slight overshoot). Use `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for standard transitions.
- **Stagger child animations.** When a grid of cards enters, stagger each by 40ms. Max total stagger: 300ms (cap at ~8 items).
- **Numbers count up.** KPI values animate from 0 to final value over 600ms with easing. Use `requestAnimationFrame` — not CSS.
- **Charts draw in.** Area charts animate `stroke-dasharray` from 0 to full length over 800ms. Fill gradient fades in 200ms after line completes.
- **Theme transition.** Radial reveal (circle-clip expanding from the toggle button position) over 500ms. Use `clip-path: circle()` animating from 0% to 150% of viewport diagonal.

### 7.2 Specific Animations

| Trigger | Animation | Duration | Easing |
|---|---|---|---|
| Page load | KPI cards fade up + count | 400ms + 600ms | ease-spring |
| Tab/view switch | Content crossfade | 250ms | ease-apple |
| Card hover | translateY(-2px) + shadow | 200ms | ease-out |
| Chart data update | Morph line path (D3 transition) | 500ms | ease-apple |
| Tooltip appear | fade + translateY(4→0) | 150ms | ease-out |
| Tooltip disappear | fade | 100ms | ease-out |
| Sidebar expand | width 64→220 + labels fade in | 350ms | ease-apple |
| Theme toggle | Radial clip-path reveal | 500ms | ease-apple |
| Sparkline draw | stroke-dashoffset animate | 400ms | ease-out |
| Stagger children | Each child delays 40ms | 40ms × n | ease-spring |
| Number count-up | Value 0 → final | 600ms | ease-out (decelerate) |
| Row hover highlight | background-color transition | 120ms | linear |

### 7.3 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## 8. Responsive Behavior

### 8.1 Breakpoint Strategy

| Breakpoint | Layout | Sidebar | Cards per row | Chart height |
|---|---|---|---|---|
| 375–639px | Single column, stacked | Bottom tab bar (5 items) | 1–2 | 180px |
| 640–767px | Single column, wider | Bottom tab bar | 2–3 | 200px |
| 768–1023px | Sidebar collapsed (64px) + content | Icon-only sidebar | 2–3 | 240px |
| 1024–1279px | Sidebar collapsed + content | Icon-only, hover to expand | 3–4 | 260px |
| 1280–1535px | Sidebar expanded (220px) + content | Full sidebar | 4–5 | 280px |
| 1536px+ | Sidebar expanded + content, max-width 1600px centered | Full sidebar | 5–6 | 320px |

### 8.2 Mobile-Specific Adaptations

- **Bottom tab bar**: 5 icons (Overview, Deep Dive, DeFi, CeD, More), 48px height, haptic-style active indicator
- **Tables become card lists**: On <640px, table rows transform into stacked cards with key metrics
- **Charts go full-bleed**: Remove side padding, chart fills viewport width
- **KPI cards**: Horizontally scrollable row instead of wrapping grid
- **Tooltips become bottom sheets**: On touch devices, tap-to-show as a slide-up panel instead of hover
- **Sparklines hidden**: Below 640px, remove sparklines from list rows to save space

---

## 9. File Architecture

```
/nonusd-dashboard/
├── index.html                  # Shell: sidebar, header, router, theme toggle
├── css/
│   ├── tokens.css             # All CSS custom properties (this spec)
│   ├── reset.css              # Minimal reset (box-sizing, margin, etc.)
│   ├── base.css               # Typography, body, scrollbar, selection
│   ├── layout.css             # Sidebar, header, main content, grid system
│   ├── components.css         # Cards, buttons, badges, tooltips, tables
│   └── charts.css             # Chart containers, sparklines, legends
├── js/
│   ├── app.js                 # Entry: router, theme, init
│   ├── theme.js               # Dark/light toggle with radial reveal
│   ├── data.js                # Data fetching, caching, transforms
│   ├── charts.js              # D3 chart factory (area, donut, sparkline, bar)
│   ├── animations.js          # Count-up, stagger, IntersectionObserver triggers
│   ├── tooltips.js            # Hover tooltip system
│   └── views/
│       ├── overview.js        # Market Overview view
│       ├── deep-dive.js       # Currency deep-dive view
│       ├── defi.js            # DeFi analytics view
│       ├── ced.js             # CeD comparison view
│       └── secondary.js       # Issuer, blockchain, region (shared renderer)
└── assets/
    └── inter/                 # Self-hosted Inter font files (woff2)
```

---

## 10. Accessibility Requirements

- **WCAG 2.1 AA** compliance minimum
- All color combinations must meet **4.5:1** contrast ratio for text, **3:1** for large text and UI components
- Charts must have **text alternatives** (screen-reader-only summary table below each chart)
- Keyboard navigation: Tab through all interactive elements, Enter/Space to activate, Escape to close tooltips/modals
- Focus indicators: 2px `var(--border-focus)` outline with 2px offset (never remove outlines)
- `prefers-reduced-motion` respected (see §7.3)
- `prefers-color-scheme` auto-detected on first visit (then user toggle overrides)
- Semantic HTML: `<nav>`, `<main>`, `<section>`, `<article>`, `<table>` — not just `<div>` soup
- ARIA labels on all icon-only buttons, chart regions, and dynamic content

---

## 11. Performance Budget (Cloudflare Pages)

| Metric | Target |
|---|---|
| First Contentful Paint | < 1.0s |
| Largest Contentful Paint | < 1.8s |
| Total JS bundle (gzip) | < 80KB |
| Total CSS bundle (gzip) | < 15KB |
| Font files (Inter, 2 weights) | < 50KB |
| D3 (tree-shaken) | < 35KB |
| Time to Interactive | < 2.5s |

- **Font loading**: `font-display: swap`, preload the 2 critical weights (400, 700)
- **D3**: Import only used modules (`d3-selection`, `d3-scale`, `d3-shape`, `d3-transition`, `d3-axis`, `d3-format`), not the full bundle
- **Charts**: Render above-fold charts immediately, lazy-render below-fold with IntersectionObserver
- **Images**: Zero raster images. All graphics are SVG or CSS. Flag emojis are native Unicode.

---

## 12. Implementation Order (Design System First)

### Phase 1: Foundation (this deliverable)
1. `tokens.css` — All CSS custom properties from this spec
2. `reset.css` + `base.css` — Typography, body styles
3. `theme.js` — Dark/light toggle with radial reveal animation
4. Deploy bare-bones `index.html` with theme toggle proving tokens work

### Phase 2: Layout Shell
5. `layout.css` — Sidebar, header, content area, responsive grid
6. `app.js` — Router (hash-based), sidebar behavior, responsive breakpoint handler

### Phase 3: Components
7. `components.css` — KPI cards, segmented controls, tables, badges, tooltips
8. `animations.js` — Count-up, stagger, IntersectionObserver
9. `tooltips.js` — Hover tooltip system

### Phase 4: Charts
10. `charts.js` — D3 chart factory (area, donut, sparkline, bar)
11. Wire up with sample data to prove chart theming

### Phase 5: Views (rebuild one at a time)
12. Market Overview (highest priority)
13. Currency Deep Dive
14. DeFi Analytics
15. CeD Comparison
16. Secondary views (Issuer, Blockchain, Region)

---

*This document is the single source of truth for all design decisions. Every component, color, spacing value, and animation must reference this spec. When in doubt, ask: "Would this feel at home in Apple Stocks, but with more data?"*
