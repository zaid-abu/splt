# Suma Design System

## Direction

Coral Ledger is vivid, social, and composed. Cool mineral surfaces support a coral brand-action color, while emerald and crimson carry independent financial meaning. Opaque content sits beneath translucent native navigation and task layers.

## Tokens

```css
:root {
  --bg: oklch(97% 0.012 245);
  --surface: oklch(99% 0.006 245);
  --surface-raised: oklch(100% 0 0 / 0.82);
  --fg: oklch(22% 0.032 255);
  --muted: oklch(46% 0.026 250);
  --border: oklch(87% 0.022 245);
  --accent: oklch(66% 0.19 28);
  --positive: oklch(52% 0.145 157);
  --negative: oklch(50% 0.19 18);
  --balance-surface: oklch(25% 0.045 255);
  --font-ui: "Instrument Sans", "SF Pro Text", "Roboto", system-ui, sans-serif;
  --font-numeric: "IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace;
}
```

## Typography

Instrument Sans carries titles, body text, controls, and labels. IBM Plex Mono is restricted to amounts, rates, and verification codes. Large titles use weight 600 with `-0.025em` tracking; financial values use tabular figures and no tighter than `-0.015em` tracking.

## Layout

The home screen is a vertically flowing money map: summary, priority people, active groups, and recent movement. There is no persistent tab bar. A single command control opens a native sheet that combines search, destinations, and creation.

## Components

- Brand actions use coral; positive and negative balances use independent semantic colors.
- Opaque content surfaces sit below translucent navigation and task layers.
- Inputs and buttons use 14px radii, actionable cards use 16px, and task sheets use 24px.
- iOS retains circular action controls and higher material translucency.
- Android retains its rounded-rectangle FAB, tonal surfaces, and more opaque bottom sheet.
- Blur is restricted to status bars, top bars, and command sheets.

## Motion

Use 180–240 ms ease-out transitions. Screens push horizontally on iOS and fade-through on Android. Sheets rise from the bottom. Reduced motion replaces movement with a short crossfade.
