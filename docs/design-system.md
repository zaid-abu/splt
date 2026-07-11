# Design System Reference

The full design system documentation is in `/DESIGN.md` at the project root.

## Quick Reference

### Brand Identity

- **Name:** Splt
- **Personality:** Warm, calm, trustworthy
- **Creative North Star:** "The Warm Ledger"
- **Anti-references:** No flashy fintech, no gamified social, no cold accounting

### Core Colors

| Token         | Hex       | Usage                              |
| ------------- | --------- | ---------------------------------- |
| Charcoal Ink  | `#1A1A1A` | Primary CTA, headings, strong text |
| Warm Canvas   | `#F7F6F1` | App background                     |
| Surface Ivory | `#FEFDFA` | Cards, sheets                      |
| Control White | `#FFFFFF` | Inputs, button interiors           |
| Warm Border   | `#E7E5DE` | Dividers, card outlines            |
| Debt Red      | `#E85D5D` | Amounts you owe                    |
| Credit Green  | `#4CAF82` | Amounts owed to you                |
| Alert Amber   | `#F5A623` | Warnings                           |

### Typography

| Style    | Font          | Size | Weight          |
| -------- | ------------- | ---- | --------------- |
| Display  | Sora          | 32px | 600             |
| Headline | Sora          | 24px | 600             |
| Title    | IBM Plex Sans | 16px | 600             |
| Body     | IBM Plex Sans | 16px | 400             |
| Label    | IBM Plex Sans | 11px | 600 (uppercase) |

### Spacing

- Screen gutters: `20px` / `24px`
- Card padding: `14px` / `16px`
- Row vertical: `12px` / `16px`
- Gap between sections: `28px`

### Border Radius

- Cards: `16px`
- Inner panels / inputs: `12px`
- Pills / buttons: `9999px`
- Icon shells: `14-18px`

### Elevation

- **Flat-by-default** — borders and tonal contrast do the work
- **Chrome lift** — tab bar only (`0 -1px 8px rgba(0,0,0,0.05)`)
- **Toast lift** — transient feedback only (`0 4px 8px rgba(0,0,0,0.1)`)

### Design Tokens

Centralized in three locations:

1. `design-tokens.json` — JSON master tokens
2. `src/constants/design-tokens.ts` — TS constants
3. `src/global.css` — CSS custom properties via `:root`

### Component Library

All UI components are registered in `/ui-registry.md` with visual properties, pattern notes, and file locations.

### Key Design Rules

- **The Semantic Accent Rule:** Red, green, amber carry meaning, not decoration
- **The No Purple Reversal Rule:** Lilac is a contained accent only
- **The Weight-Not-Scale Rule:** Hierarchy from weight/spacing, not oversized type
- **The Flat-By-Default Rule:** Cards rest on borders and tonal contrast first

See `DESIGN.md` for the complete documentation (250 lines), including detailed component guidelines,
Do's and Don'ts, and full color/typography/elevation specs.
