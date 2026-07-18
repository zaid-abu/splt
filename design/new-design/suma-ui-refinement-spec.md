# Suma UI Refinement: Coral Ledger

## Status

Approved for implementation planning.

## Objective

Refine the existing launcher, iOS prototype, and Android prototype into a more distinctive social-finance product without changing screen inventory, navigation, content, or interaction behavior. The result should feel vivid and contemporary while preserving native platform expectations and financial clarity.

## Existing Problems

- The pale neutral palette and green accent resemble a generic finance starter theme.
- The brand accent also represents positive balances, conflating identity with financial status.
- `Söhne` is not loaded, so typography changes unpredictably with local availability.
- Large radii and wide, soft shadows make cards and sheets feel inflated.
- Blur exists, but weak foreground/background separation prevents it from reading as material.
- The launcher and product screens use related but duplicated token definitions that can drift.

## Locked Constraints

- Preserve all existing routes, screen templates, labels, example data, forms, and interactions.
- Preserve separate iOS and Android presentation rules and native touch targets.
- Keep light and dark appearances, keyboard focus, and reduced-motion support.
- Keep inspectable `data-od-id` attributes unchanged.
- Use blur only for status/navigation bars, command sheets, and transient overlays.
- Do not add decorative glass cards, gradient text, oversized shadows, or new UI modules.

## Visual Direction

**Coral Ledger** combines a vivid coral identity with cool mineral neutrals. Coral marks primary actions and active navigation only. Emerald indicates money owed to the user; crimson indicates money the user owes. Deep blue-black anchors high-value balance surfaces and prevents the palette from becoming playful at the expense of trust.

The decisive visual move is a sharply layered material system: calm opaque content surfaces sit beneath translucent navigation and command layers. Blur becomes visible because the layers behind it carry controlled color and contrast, not because every component is transparent.

## Color System

Use OKLCH tokens throughout. Add role-specific tokens instead of deriving semantic meaning from the brand accent.

```css
:root {
  --bg: oklch(97% 0.012 245);
  --surface: oklch(99% 0.006 245);
  --surface-raised: oklch(100% 0 0 / 0.82);
  --fg: oklch(22% 0.032 255);
  --muted: oklch(46% 0.026 250);
  --border: oklch(87% 0.022 245);

  --accent: oklch(66% 0.19 28);
  --accent-ink: oklch(31% 0.11 25);
  --accent-soft: oklch(93% 0.05 28);
  --ink-on-accent: oklch(99% 0.004 25);

  --positive: oklch(52% 0.145 157);
  --positive-soft: oklch(93% 0.045 157);
  --negative: oklch(50% 0.19 18);
  --negative-soft: oklch(94% 0.04 18);
  --warning: oklch(66% 0.14 78);

  --balance-surface: oklch(25% 0.045 255);
  --balance-fg: oklch(97% 0.008 245);
}
```

### Usage Rules

- Coral appears on the primary action and one active-navigation state per screen.
- Positive and negative balances use their semantic tokens plus explicit owed/owing language.
- The balance summary uses `--balance-surface`; coral may appear as one small material highlight, never a full gradient.
- Content cards remain opaque. Translucency belongs only to navigation and task layers.
- Dark mode preserves token roles rather than inverting the light palette, using the following values:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg: oklch(17% 0.02 255);
    --surface: oklch(21% 0.024 255);
    --surface-raised: oklch(25% 0.026 255 / 0.84);
    --fg: oklch(95% 0.008 245);
    --muted: oklch(72% 0.025 245);
    --border: oklch(32% 0.026 255);
    --accent: oklch(72% 0.18 28);
    --accent-ink: oklch(91% 0.055 28);
    --accent-soft: oklch(29% 0.065 28);
    --ink-on-accent: oklch(18% 0.035 25);
    --positive: oklch(72% 0.14 157);
    --positive-soft: oklch(27% 0.055 157);
    --negative: oklch(72% 0.17 18);
    --negative-soft: oklch(27% 0.06 18);
    --warning: oklch(76% 0.13 78);
    --balance-surface: oklch(13% 0.035 255);
    --balance-fg: oklch(97% 0.008 245);
  }
}
```

## Typography

Load **Instrument Sans** as the product family with the existing native stacks as fallback. Load **IBM Plex Mono** only for financial amounts, exchange rates, and verification codes. Use the following pinned Google Fonts stylesheet with `display=swap`; the fallback stacks keep every screen usable if it is unavailable.

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

```css
--font-ui: "Instrument Sans", "SF Pro Text", "Roboto", system-ui, sans-serif;
--font-numeric: "IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace;
```

### Type Rules

- Large titles: 36px iOS, 32px Android, weight 620, line-height 1.08, tracking `-0.025em`.
- Top-bar titles and row titles: Instrument Sans, weight 580–620.
- Body and labels: Instrument Sans, weight 430–560; preserve current readable sizes.
- Amounts: IBM Plex Mono, weight 550, tabular figures, tracking no tighter than `-0.015em`.
- Replace repeated uppercase section labels with sentence-case section titles at 14px and weight 620. Do not change their words unless necessary for sentence casing.

## Material And Blur

### Status And Top Bars

- Background: `color-mix(in oklch, var(--surface-raised), transparent 18%)`.
- Blur: 24px with saturation between 1.15 and 1.25.
- Add a subtle bottom hairline using `--border`; avoid drop shadows.

### Command Sheets

- Background: `color-mix(in oklch, var(--surface-raised), transparent 8%)`.
- Blur: 36px with saturation 1.2.
- Use a 24px iOS radius and a 24px Android top radius.
- Use a short, concentrated elevation shadow; maximum blur radius 12px.
- Keep search and command controls opaque enough to remain legible over moving content.

### Stage And Device Presentation

- Replace the radial gradient with two restrained, heavily blurred color fields behind the device: coral near the lower action area and cool blue near the upper navigation area.
- These fields exist only in the prototype stage to reveal material behavior. They never enter product screens.
- Device shells keep native silhouettes but use a cleaner, lower-opacity ambient shadow.

## Shape And Elevation

Adopt a compact shape scale:

- Inputs and buttons: 14px.
- Actionable cards: 16px.
- Small icon containers: 12px.
- iOS sheet: 24px.
- Android sheet: 24px top corners only.
- Pills remain fully rounded where platform conventions require them.

Remove the launcher’s border-plus-wide-shadow card treatment. Use either a crisp border or a short shadow, never both. Product cards should gain depth primarily through surface contrast and hover movement.

## Component Changes

### Launcher

- Bind launcher tokens to the same Coral Ledger roles as the prototypes.
- Use Instrument Sans and IBM Plex Mono consistently.
- Restyle platform targets as asymmetric, high-contrast launch panels with 16px radii and restrained elevation.
- Keep links, destinations, and responsive layout unchanged.

### Balance Summary

- Retain its dark anchor role.
- Use mono numerals, stronger label contrast, and one contained coral highlight.
- Reduce radius from 26px to 16px.

### Group Cards

- Reduce radius and remove wide shadows.
- Differentiate cards through hierarchy and content density, not multiple accent fills.
- Keep the existing asymmetric grid.

### Buttons And FAB

- Coral becomes the sole brand-action color.
- Use pressed-state darkening and a 2px downward movement.
- Replace wide colored glows with a compact shadow of 8px blur or less.

### Lists, Inputs, And Segments

- Strengthen separator and placeholder contrast.
- Use the compact 12–14px radius scale.
- Keep semantic status colors independent from selected-control color.

## Platform Adaptation

### iOS

- Preserve large-title hierarchy, circular floating action, 44pt targets, Dynamic Island framing, and material-style sheets.
- Use slightly higher translucency on bars and sheets to resemble system materials.

### Android

- Preserve Material top-bar density, 48dp targets, rounded-rectangle FAB, bottom-sheet geometry, and system back behavior represented by the prototype.
- Use slightly more opaque tonal surfaces than iOS and avoid copying iOS circular control shapes.

## Architecture And Data Flow

The refinement is token- and CSS-led. `suma-prototype.js` retains route state, templates, form submission, sheet state, and toast behavior unchanged. HTML entries retain their platform markers and shared stylesheet/script references.

Implementation should update:

- `suma-prototype.css` for shared tokens and component presentation.
- `index.html` for launcher tokens and presentation.
- `DESIGN.md` for the final system contract.
- `ui-registry.md` for the revised component baseline.

No JavaScript changes are expected unless typography or visual-state validation reveals a genuine presentation bug.

## Error And Edge-State Preservation

- Browser form validation remains intact.
- Existing negative, positive, warning, focus, toggle, snackbar, and reduced-motion states retain their behavior.
- Long names and amounts must continue truncating or remaining unwrapped as currently specified.
- Dark mode must retain readable semantic distinctions without relying on hue alone.

## Verification Plan

1. Validate CSS syntax and JavaScript syntax.
2. Confirm no route, action, submit handler, or `data-od-id` changes.
3. Check typography fallback declarations and font-loading behavior.
4. Check text and control contrast against WCAG AA thresholds.
5. Verify 44pt iOS and 48dp Android touch targets remain intact.
6. Inspect home, command sheet, add-expense, settlement, authentication, and launcher states in light and dark appearances.
7. Verify no horizontal overflow at compact mobile widths.
8. Verify reduced-motion behavior and keyboard focus remain visible.
9. Scan for banned visual patterns: decorative glass cards, wide ghost shadows, oversized radii, gradient text, and brand color used as semantic status.

## Completion Criteria

- The launcher and both platform prototypes visibly share one distinctive brand system.
- Coral is reserved for brand actions; balance status uses independent semantic colors.
- Instrument Sans and IBM Plex Mono load with coherent fallbacks.
- Blur clearly communicates navigation or task-layer elevation and appears nowhere else.
- Cards, controls, and sheets use the compact radius/elevation scale.
- Existing functionality and accessibility contracts remain unchanged.
