---
name: Splt
description: Warm, calm expense sharing for friends and groups.
colors:
  ink: "#1A1A1A"
  ink-soft: "#3A3A3A"
  canvas-warm: "#F7F6F1"
  surface-ivory: "#FEFDFA"
  surface-soft: "#F4F3EE"
  surface-plain: "#FFFFFF"
  border-warm: "#E7E5DE"
  border-soft: "#EDEBE4"
  text-muted: "#6E6D68"
  text-subtle: "#9B9A94"
  input-ink: "#5D5C5A"
  debt-red: "#E85D5D"
  credit-green: "#4CAF82"
  group-lilac: "#C4A8E0"
  ring-blush: "#E8C4C4"
  alert-amber: "#F5A623"
  brand-taupe: "#8C7A6B"
typography:
  display:
    fontFamily: "Sora_600SemiBold"
    fontSize: "32px"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Sora_600SemiBold"
    fontSize: "24px"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  title:
    fontFamily: "IBMPlexSans_600SemiBold"
    fontSize: "16px"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "-0.01em"
  body:
    fontFamily: "IBMPlexSans_400Regular"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "IBMPlexSans_600SemiBold"
    fontSize: "11px"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.1em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  pill: "9999px"
spacing:
  xxs: "4px"
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "20px"
  xl: "32px"
  xxl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface-plain}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  button-secondary:
    backgroundColor: "{colors.surface-plain}"
    textColor: "{colors.ink}"
    typography: "{typography.title}"
    rounded: "{rounded.pill}"
    padding: "9px 18px"
  card-surface:
    backgroundColor: "{colors.surface-ivory}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  input-default:
    backgroundColor: "{colors.surface-ivory}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    padding: "14px 16px"
  input-pill:
    backgroundColor: "{colors.surface-plain}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "14px 16px"
---

# Design System: Splt

## 1. Overview

**Creative North Star: "The Warm Ledger"**

Splt’s interface should feel like a money tool that lowers social tension instead of amplifying it. The system is warm, calm, and trustworthy: soft cream backgrounds, near-black typography, restrained semantic color, and generous mobile spacing produce a premium but familiar feel that stays legible under real-world use. This is product UI, not editorial branding for its own sake; the visual system exists to keep shared costs understandable and actions obvious.

The core aesthetic is native-mobile restraint with editorial warmth. Surfaces are light and quiet, outlines do most of the separation work, and accent colors appear only when they carry meaning: debt, credit, warnings, selection, or a single brand nudge. Typography does the hierarchy work through weight, spacing, and rhythm rather than size extremes. Bottom sheets, tabs, and list rows follow platform expectations closely enough to feel trustworthy on both iOS and Android.

This system explicitly rejects the anti-references captured in [PRODUCT.md](/Users/abuzaid/Documents/Projects/splt/PRODUCT.md:1): it is **not flashy fintech with aggressive growth-product cues**, **not a gamified social app competing for attention**, and **not cold accounting software that feels dense, corporate, or spreadsheet-led**.

**Key Characteristics:**
- Warm neutral surfaces with low-chroma contrast
- Near-black text and restrained semantic accents
- Familiar native controls with soft editorial polish
- Rounded cards and pills, but never inflated or bubbly
- Flat-by-default depth with sparse, structural lift

## 2. Colors

The palette is a warm-neutral product system anchored by charcoal ink, soft ivory surfaces, and tightly scoped semantic accents.

### Primary
- **Charcoal Ink** (`#1A1A1A`): Primary CTA fill, active navigation state, high-priority headings, and the strongest text value across the app.

### Secondary
- **Warm Ivory** (`#FEFDFA`): Default card and sheet surface, used to create soft separation from the warmer app background without reading as stark white.

### Tertiary
- **Taupe Signal** (`#8C7A6B`): Minor brand accent for “Change” affordances and low-volume emphasis where semantic red/green would be wrong.

### Neutral
- **Warm Canvas** (`#F7F6F1`): App background and main page field.
- **Soft Surface** (`#F4F3EE`): Secondary panel fill and alternate neutral layer.
- **Plain White** (`#FFFFFF`): Control interior and high-clarity action surfaces.
- **Warm Border** (`#E7E5DE`): Default dividers and card outlines.
- **Soft Border** (`#EDEBE4`): Subtler separation where a full divider would feel too hard.
- **Muted Ink** (`#6E6D68`): Secondary copy, timestamps, helper text.
- **Subtle Ink** (`#9B9A94`): Tertiary labels and de-emphasized metadata.

### Semantic
- **Debt Red** (`#E85D5D`): Amounts the user owes, destructive emphasis, danger status.
- **Credit Green** (`#4CAF82`): Amounts owed to the user, success status, positive resolution.
- **Alert Amber** (`#F5A623`): Warning emphasis and cautionary highlights.
- **Group Lilac** (`#C4A8E0`): Group icon backgrounds and light social identity moments, never a primary brand field.
- **Blush Ring** (`#E8C4C4`): Soft accent around avatars or decorative social details.

### Named Rules
**The Semantic Accent Rule.** Red, green, and amber exist to carry meaning, not decoration. If a color does not communicate balance, status, selection, or affordance, it should likely be neutral instead.

**The No Purple Reversal Rule.** The older purple-heavy look is retired. Lilac may appear in contained icon or avatar treatments, but never as the dominant brand color, screen wash, or CTA field.

## 3. Typography

**Display Font:** Sora_600SemiBold  
**Body Font:** IBMPlexSans_400Regular  
**Label/Mono Font:** IBMPlexSans_600SemiBold for labels and microcopy

**Character:** The pairing is clean and modern, with a small amount of editorial lift. Sora handles greetings, modal titles, and higher-level screen headings; IBM Plex Sans carries the working UI so forms, lists, balances, and controls stay familiar and crisp.

### Hierarchy
- **Display** (600, 32px, 1.15): Reserved for hero moments, greetings, major numeric moments, and primary screen titles that need warmth without theatrics.
- **Headline** (600, 24px, 1.2): Modal titles, section-leading headings, and important empty-state headlines.
- **Title** (600, 16px, 1.35): Row titles, button labels, field headlines, and the default strong UI text role.
- **Body** (400, 16px, 1.5): General explanatory copy, input text, supporting descriptions, and readable in-flow content.
- **Label** (600, 11px, 0.1em tracking, uppercase when used as a section label): Section tags, compact metadata, and categorical markers.

### Named Rules
**The Weight-Not-Scale Rule.** Hierarchy should come primarily from weight, spacing, and placement, not from oversized type jumps. This is a task-first product UI; type should organize work, not perform.

**The Uppercase Restraint Rule.** Small uppercase labels are valid for section structure and metadata only. Never turn whole screens into tracked uppercase scaffolding.

## 4. Elevation

Splt is flat by default. Most depth comes from warm background layering, 1px borders, and semantic grouping rather than large shadows. True lift appears sparingly on structural chrome like the custom tab bar and transient feedback like toast, where the user benefits from clear separation from the page underneath.

### Shadow Vocabulary
- **Chrome Lift** (`shadowColor: #000; shadowOffset: 0 -1px; shadowOpacity: 0.05; shadowRadius: 8; elevation: 8`): Used on the bottom tab bar so navigation reads as persistent chrome, not content.
- **Toast Lift** (`shadowColor: #000; shadowOffset: 0 4px; shadowOpacity: 0.1; shadowRadius: 8; elevation: 5`): Used for transient feedback that must sit above content without feeling heavy.

### Named Rules
**The Flat-By-Default Rule.** Cards, rows, and inputs should rest on borders and tonal contrast first. Reach for shadow only when the element must behave as chrome or overlay, not as ordinary content.

## 5. Components

### Buttons
- **Character:** Softly assertive, compact, and native-feeling.
- **Shape:** Pill for primary and secondary actions (`9999px`), with compact height around 40px for inline actions.
- **Primary:** Charcoal fill with white text, semibold IBM Plex Sans, centered content, and no decorative outline.
- **Hover / Focus:** Mobile-first press feedback relies on opacity changes and haptics rather than flashy transforms. Reanimated scale is used only in a few tactile summary cards, not broadly across all buttons.
- **Secondary / Ghost:** White background, warm border, charcoal text. Used for alternate actions like “View balances.”

### Chips
- **Style:** Rounded pill chips with soft border and neutral fill, sometimes carrying small semantic labels like “Current” or “Popular.”
- **State:** Selected chips invert into darker or more distinct fills; metadata chips stay quiet and compact.

### Cards / Containers
- **Corner Style:** Rounded but controlled (`16px` outer cards, `12px` inner panels, occasional `14px` icons or status shells).
- **Background:** Ivory or plain white over a warm canvas. Alternate panels may use tinted red or green neutrals to signal debt and credit.
- **Shadow Strategy:** No ambient card shadows by default. Borders and tonal shifts do the work.
- **Border:** Thin warm border (`#E7E5DE` or nearby) is common and intentional.
- **Internal Padding:** Usually `14px` to `20px`, with tighter spacing in rows and more generous spacing in summary blocks.

### Inputs / Fields
- **Style:** Either rounded-rectangle cards (`16px`) or pill search fields (`9999px`), always with clean warm borders and readable dark text.
- **Focus:** Focus is expressed through context, open state, or modal presentation more than glowing outlines. Search and selection flows rely on clear field shape and surrounding sheet structure.
- **Error / Disabled:** Error states should use debt red intentionally; disabled text belongs in the subtle neutral range, never low-contrast gray on tinted fills.

### Navigation
- **Style:** Custom bottom tab bar with solid white background, 1px warm top border, thin lucide icons, no text labels, and a tiny active dot below the selected icon.
- **States:** Inactive tabs use muted gray; active tabs shift to charcoal with slightly heavier stroke. The center add action stays outline-based, not a floating FAB.
- **Platform Treatment:** Safe-area-aware and edge-aligned. On Android the bar gets a small structural shadow; on iOS it remains crisp and quiet.

### Bottom Sheets
- **Style:** Full-width warm sheets with square top edge treatment (`borderRadius: 0`) and a soft neutral handle indicator.
- **Content:** Sora title, IBM Plex supporting copy, bordered search or input cards, and list rows with consistent 16px rounding.
- **Behavior:** Sheets are working surfaces, not theatrical modals. Keyboard handling and dismiss affordances matter more than ornament.

## 6. Do's and Don'ts

### Do:
- **Do** keep primary actions in `#1A1A1A` with white text, and reserve semantic reds and greens for actual money or status meaning.
- **Do** use `16px` as the default card radius, `12px` for inner panels, and `9999px` only for pills, chips, and compact action buttons.
- **Do** preserve the warm-canvas layering of `#F7F6F1` background, `#FEFDFA` surface, and `#FFFFFF` control interiors.
- **Do** rely on IBM Plex Sans for working UI copy and reserve Sora for display moments, screen headings, and modal titles.
- **Do** keep navigation, sheets, and list rows aligned with native mobile expectations on both iOS and Android.

### Don't:
- **Don't** build **flashy fintech with aggressive growth-product cues**: no neon accents, oversized numeric bravado, or hyper-saturated CTA fields.
- **Don't** make it **a gamified social app competing for attention**: no celebratory confetti UI, noisy badges everywhere, or playful color for its own sake.
- **Don't** make it **cold accounting software that feels dense, corporate, or spreadsheet-led**: avoid cold grays, rigid grid-heavy presentation, and finance-dashboard tropes.
- **Don't** reintroduce purple as the primary brand color or flood a screen with lilac; `#C4A8E0` is a contained supporting accent only.
- **Don't** use large decorative shadows on bordered cards, oversized radii above `20px` on surfaces, or glassy translucent chrome.
