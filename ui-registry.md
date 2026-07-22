# Coral Ledger Component Registry & Screen Contracts

### Coral Ledger Card Surfaces & Components

Files: `src/components/coral/*`, `src/features/*/screens-v2/*`
Last updated: 2026-07-20

| Property | Value / Variable | Description |
| --- | --- | --- |
| Canvas Background | `var(--canvas)` (`#EFF6FD` / `#091018`) | Primary application screen background |
| Surface Card | `var(--surface)` (`#F9FCFF` / `#111923`) | Opaque cards, list containers, detail cards |
| Navigation Chrome | `coral.surface` (`#F9FCFF` / `#111923`) | Shared opaque surface for headers and the floating dock |
| Control Surface | `var(--control)` (`#FFFFFF` / `#1D2B3A`) | Buttons, text fields, search bars |
| Navy Surface | `var(--navy)` (`#122237` / `#07111C`) | Hero summary containers, toasts, badges |
| Primary Accent | `var(--coral)` (`#F0584B` / `#FF7062`) | Primary CTA buttons, central Circle Dock add button |
| Text Primary | `var(--ink)` (`#101B29` / `#EAEFF4`) | Headings, row titles, main text (`Instrument Sans`) |
| Text Muted | `var(--muted)` (`#536272` / `#98A7B4`) | Subtitles, kicker labels, secondary metadata |
| Numeric Text | `var(--font-numeric)` | `IBM Plex Mono` for tabular amounts and balance summaries |
| Border | `var(--border)` (`#C9D6E2` / `#2A3440`) | `1px` subtle borders on cards and controls |
| Radius | Cards `16px`, Controls `14px`, Sheet `24px`, Dock `20px` | Standard border radius rules |
| Floating Dock | `CircleDock` component | Borderless floating tab bar using the opaque Navigation Chrome surface, with active indicator dot and a raised, unclipped coral center action |

### Component Inventory

1. **`CircleDock`** (`src/components/coral/CircleDock.tsx`): Bottom navigation bar featuring Home, Circles, Activity, More, and central Add sheet trigger.
2. **`CoralScreen`** (`src/components/coral/CoralScreen.tsx`): Screen container wrapper applying status bar inset, safe scroll, and theme background.
3. **`CoralTopBar`** (`src/components/coral/CoralTopBar.tsx`): Header bar with optional back navigation, title, and actions.
4. **`BalanceHero`** (`src/components/coral/BalanceHero.tsx`): Dark navy card displaying net balance in `IBM Plex Mono`.
5. **`MoneyRow`** (`src/components/coral/MoneyRow.tsx`): Standard list row with avatar/badge, title, subtitle, amount, and semantic tone (positive, negative, neutral).
6. **`CoralButton`** (`src/components/coral/CoralButton.tsx`): Standardized primary/secondary/danger button with loading and disabled states.
7. **`CoralField` & `CoralSearchField`** (`src/components/coral/CoralField.tsx`, `CoralSearchField.tsx`): Form input fields and search controls.
8. **`CoralSegment`** (`src/components/coral/CoralSegment.tsx`): Tab switcher for view filtering (e.g., Groups / People).
9. **`CoralSheet` & `GlobalActionSheet`** (`src/components/coral/CoralSheet.tsx`, `GlobalActionSheet.tsx`): Modal sheets for actions and forms.
