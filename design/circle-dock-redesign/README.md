# Splt Circle Dock HTML Prototype

This package is the approved visual contract for Splt before React Native implementation begins. It
defines the Circle Dock navigation, Coral Ledger visual system, financial language, task flows,
platform treatments, themes, responsive behavior, and screen-state expectations in directly
inspectable HTML.

## Use

Open `index.html` directly in a browser. No server, build step, package install, or network dependency
is required. The launcher provides:

- Category filters for all 48 screen documents.
- Direct links to all 11 end-to-end flow walkthroughs.
- iOS and Android treatment controls.
- Light and dark theme controls.

Every file under `screens/` and `flows/` can also be opened directly through a `file://` URL. Theme
and platform choices persist when browser storage is available and gracefully remain document-local
when storage is blocked.

## Architecture

- `index.html` is the polished launcher and complete inventory.
- `prototype.css` defines Coral Ledger tokens, phone frames, shared components, platform differences,
  themes, responsive rules, focus treatment, and reduced motion.
- `prototype.js` contains the screen registry, flow registry, semantic renderers, navigation, controls,
  task-sheet behavior, segments, state examples, and launcher filtering.
- `screens/` contains thin direct-entry HTML documents. Each unique `data-screen` key renders
  domain-specific content from the shared registry.
- `flows/` contains thin direct-entry walkthrough documents. Each unique `data-flow` key renders its
  ordered screen links and decision notes from the shared registry.
- `manifest.json` is the machine-readable package inventory.

The registry is intentionally declarative. Shared renderers cover welcome, authentication, shell,
list, detail, form, success, insight, task-sheet, and state-reference compositions without copying
visual markup into every entry document.

## Interaction Map

- The Circle Dock switches among Home, Circles, Activity, and More.
- The center coral Add control opens the global task sheet from every dock screen.
- Group, People, Activity, and Insights segments change visible selection or navigate to their real
  adjacent screen.
- Every list row opens a source screen or demonstrates a clearly announced design state.
- Form rows open a visible state example or navigate to a focused editor.
- Completion receipts link to the affected expense, group, or relationship.
- Launcher filters update the visible inventory and result count.
- Theme and platform controls update the complete artifact rather than a decorative swatch.

## Responsive And Accessibility Contract

- Supported phone references are `360x800`, `390x844`, and `430x932`.
- iOS controls provide at least `44pt` targets; Android controls provide at least `48dp` targets.
- Compact Android uses more opaque chrome, rounded rectangles, and Material-sized controls.
- iOS uses softer circular controls and stronger system-chrome translucency.
- Content cards are opaque. Blur is limited to the Circle Dock and task sheets.
- Dark mode is a first-class token set rather than a color inversion.
- Keyboard focus is visibly outlined, markup follows a logical DOM order, and controls use semantic
  links or buttons.
- Positive, negative, and review states always include signs or plain-language labels; color is never
  the only signal.
- `prefers-reduced-motion` replaces spatial sheet motion with a near-instant crossfade.
- Layouts collapse without horizontal overflow at supported phone widths.

## Financial Language

The artifact distinguishes `Total`, `Your share`, `You lent`, `You borrowed`, `owes you`, `you owe`,
and `Review`. Settlement screens state that Splt records cash or external transfers and does not move
money. Recurring screens distinguish review-before-posting from automatic posting.

## File Inventory

The binding filenames are listed in `manifest.json`. There are 48 screen files, 11 flow files, and 5
package-root files. The package contains 64 files in total.

## Implementation Contract

React Native implementation should treat this package as the visual and interaction contract, not as
web production code. Production work may map the shared vocabulary to native components, but should
preserve screen reachability, financial copy, consequence reviews, platform behavior, state handling,
accessibility, and the Circle Dock information architecture represented here.
