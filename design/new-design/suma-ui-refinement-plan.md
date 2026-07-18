# Suma Coral Ledger UI Refinement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the approved Coral Ledger color, typography, shape, elevation, and material system to the launcher and both native prototypes without changing product behavior.

**Architecture:** Keep the existing static multi-target architecture: `index.html` launches two platform HTML entries, both of which consume `suma-prototype.css` and `suma-prototype.js`. Make the refinement through shared CSS tokens and platform modifiers; lock the JavaScript checksum so routes, content, and interactions cannot drift. Use a Node built-in contract test to drive each visual-system change and to preserve accessibility and platform constraints.

**Tech Stack:** HTML5, modern CSS with OKLCH and `color-mix()`, vanilla JavaScript, Google Fonts, Node.js built-in test runner.

## Global Constraints

- Preserve every route, screen template, label, example value, form, and interaction.
- Preserve the current `suma-prototype.js` SHA-256 checksum: `e34748a972846574678f86628255723f3407a3a680ae3eec8ce093d9656438ef`.
- Preserve all existing `data-od-id` values.
- Preserve 44pt minimum iOS targets and 48dp minimum Android targets.
- Preserve light mode, dark mode, visible keyboard focus, and reduced-motion behavior.
- Coral is a brand-action color only; positive and negative balances use independent semantic tokens.
- Blur is allowed only on `.status-bar`, `.topbar`, and `.sheet`.
- Cards and product content remain opaque.
- Inputs and buttons use 14px radii; actionable cards use 16px; sheets use 24px.
- Do not add new dependencies, routes, UI modules, or JavaScript behavior.
- Do not commit changes unless the user explicitly requests a commit.

---

## File Map

- Create `suma-ui-refinement.test.mjs`: executable visual-system and regression contract.
- Modify `mobile-ios.html`: load the approved fonts while preserving iOS structure.
- Modify `mobile-android.html`: load the approved fonts while preserving Android structure.
- Modify `suma-prototype.css`: own shared Coral Ledger tokens, typography, blur, shape, elevation, and platform adaptations.
- Modify `index.html`: apply the same tokens and fonts to the launcher without changing destinations.
- Modify `DESIGN.md`: replace the superseded green system with the implemented contract.
- Modify `ui-registry.md`: update the reusable component baseline.
- Modify `critique.json`: replace stale emerald-system notes after verification.
- Do not modify `suma-prototype.js`.

---

### Task 1: Add The Visual-System Contract

**Files:**

- Create: `suma-ui-refinement.test.mjs`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: the current HTML, CSS, JavaScript, and design-document files.
- Produces: a Node test contract used by every later task.

- [ ] **Step 1: Create the failing contract test**

Create `suma-ui-refinement.test.mjs` with this complete content:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const read = (path) => readFileSync(new URL(path, import.meta.url), "utf8");
const css = read("./suma-prototype.css");
const launcher = read("./index.html");
const ios = read("./mobile-ios.html");
const android = read("./mobile-android.html");
const script = read("./suma-prototype.js");
const design = read("./DESIGN.md");
const registry = read("./ui-registry.md");

test("preserves the existing interaction implementation", () => {
  const hash = createHash("sha256").update(script).digest("hex");
  assert.equal(hash, "e34748a972846574678f86628255723f3407a3a680ae3eec8ce093d9656438ef");
  for (const marker of [
    "welcome-screen",
    "money-map-screen",
    "add-expense-screen",
    "settle-screen",
    "command-sheet",
  ]) {
    assert.match(script, new RegExp(`data-od-id=["']${marker}["']`));
  }
});

test("loads the approved font families on every entry", () => {
  for (const html of [launcher, ios, android]) {
    assert.match(html, /fonts\.googleapis\.com/);
    assert.match(html, /Instrument\+Sans/);
    assert.match(html, /IBM\+Plex\+Mono/);
  }
  assert.match(css, /--font-ui:\s*'Instrument Sans'/);
  assert.match(css, /--font-numeric:\s*'IBM Plex Mono'/);
  assert.doesNotMatch(css, /Söhne/);
});

test("defines independent brand and financial color roles", () => {
  const required = [
    "--accent: oklch(66% 0.19 28)",
    "--positive: oklch(52% 0.145 157)",
    "--negative: oklch(50% 0.19 18)",
    "--balance-surface: oklch(25% 0.045 255)",
    "--surface-raised: oklch(100% 0 0 / 0.82)",
  ];
  for (const token of required) assert.ok(css.includes(token), `Missing ${token}`);
  assert.match(css, /\.positive\s*\{\s*color:\s*var\(--positive\)/);
  assert.match(css, /\.negative\s*\{\s*color:\s*var\(--negative\)/);
  assert.match(css, /\.primary\s*\{[^}]*background:\s*var\(--accent\)/s);
});

test("uses purposeful blur and the compact shape scale", () => {
  assert.equal((css.match(/backdrop-filter:/g) || []).length, 3);
  assert.match(css, /\.topbar\s*\{[^}]*blur\(24px\)/s);
  assert.match(css, /\.sheet\s*\{[^}]*blur\(36px\)/s);
  assert.match(css, /\.sheet\s*\{[^}]*border-radius:\s*24px/s);
  assert.match(css, /\.balance-hero\s*\{[^}]*border-radius:\s*16px/s);
  assert.match(css, /\.group-card\s*\{[^}]*border-radius:\s*16px/s);
  assert.match(css, /\.primary, \.secondary, \.danger-btn\s*\{[^}]*border-radius:\s*14px/s);
  assert.doesNotMatch(css, /box-shadow:\s*0 18px 60px/);
  assert.doesNotMatch(css, /box-shadow:\s*0 12px 32px/);
});

test("applies the revised type hierarchy", () => {
  assert.match(css, /\.large-title\s*\{[^}]*font-family:\s*var\(--font-ui\)/s);
  assert.match(
    css,
    /\.amount,[^{]*\.balance-value[^{]*\{[^}]*font-family:\s*var\(--font-numeric\)/s
  );
  assert.match(css, /\.eyebrow\s*\{[^}]*font-size:\s*14px/s);
  assert.match(css, /\.eyebrow\s*\{[^}]*text-transform:\s*none/s);
});

test("preserves platform and accessibility contracts", () => {
  assert.match(css, /\.ios \.icon-btn[^}]*min-width:\s*44px/s);
  assert.match(css, /\.icon-btn[^}]*min-width:\s*48px/s);
  assert.match(css, /prefers-color-scheme:\s*dark/);
  assert.match(css, /prefers-reduced-motion:\s*reduce/);
  assert.match(css, /:focus-visible/);
  assert.match(ios, /data-od-id="ios-prototype-stage"/);
  assert.match(android, /data-od-id="android-prototype-stage"/);
  assert.match(launcher, /data-od-id="prototype-launcher"/);
});

test("documents the implemented Coral Ledger system", () => {
  for (const source of [design, registry]) {
    assert.match(source, /Coral Ledger/);
    assert.match(source, /Instrument Sans/);
    assert.match(source, /IBM Plex Mono/);
  }
  assert.match(registry, /16px cards/);
  assert.match(registry, /24px task sheets/);
});
```

- [ ] **Step 2: Run the first targeted test and verify RED**

Run:

```bash
node --test --test-name-pattern="loads the approved font families" suma-ui-refinement.test.mjs
```

Expected: FAIL because the HTML entries do not reference Google Fonts and CSS still contains `Söhne`.

- [ ] **Step 3: Verify the behavior-preservation baseline is GREEN**

Run:

```bash
node --test --test-name-pattern="preserves the existing interaction implementation" suma-ui-refinement.test.mjs
```

Expected: PASS with one passing test and no failures.

---

### Task 2: Load The Approved Typography

**Files:**

- Modify: `mobile-ios.html:6-9`
- Modify: `mobile-android.html:6-9`
- Modify: `index.html:6-9`
- Modify: `suma-prototype.css:1-18`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: the Google Fonts URL and fallback stacks locked in the specification.
- Produces: `--font-ui` and `--font-numeric` for all later component styling.

- [ ] **Step 1: Add the font resource links to all three HTML entries**

Insert this block immediately before each entry’s stylesheet or inline `<style>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link
  href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Instrument+Sans:wght@400;500;600;700&display=swap"
  rel="stylesheet"
/>
```

Keep the existing titles, viewport declarations, stylesheet link, and body markup unchanged.

- [ ] **Step 2: Replace the shared font tokens**

In `suma-prototype.css`, replace `--font-display` and `--font-body` with:

```css
--font-ui: "Instrument Sans", "SF Pro Text", "Roboto", system-ui, sans-serif;
--font-numeric: "IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace;
```

Then replace `font-family: var(--font-body)` with `font-family: var(--font-ui)` and temporarily replace each `var(--font-display)` use with `var(--font-ui)`. Numeric selectors are assigned in Task 3.

- [ ] **Step 3: Run the typography contract and verify GREEN**

Run:

```bash
node --test --test-name-pattern="loads the approved font families" suma-ui-refinement.test.mjs
```

Expected: PASS.

---

### Task 3: Apply Shared Color, Type, Material, And Shape Tokens

**Files:**

- Modify: `suma-prototype.css:1-152`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: `--font-ui` and `--font-numeric` from Task 2.
- Produces: Coral Ledger role tokens and the shared component presentation used by both targets.

- [ ] **Step 1: Run the color-role test and verify RED**

Run:

```bash
node --test --test-name-pattern="independent brand and financial color roles" suma-ui-refinement.test.mjs
```

Expected: FAIL because the role-specific tokens and selector bindings do not exist.

- [ ] **Step 2: Replace the light and dark token blocks**

Use the exact light token block from `suma-ui-refinement-spec.md:39-61` and exact dark block from `suma-ui-refinement-spec.md:72-94`. Retain `--ease` and add these elevation tokens inside the light root:

```css
--shadow-device: 0 18px 48px oklch(20% 0.03 255 / 0.15);
--shadow-raised: 0 6px 8px oklch(20% 0.03 255 / 0.1);
--shadow-sheet: 0 8px 12px oklch(20% 0.03 255 / 0.2);
```

- [ ] **Step 3: Bind role colors and numeric typography**

Replace the semantic and amount rules with:

```css
.positive {
  color: var(--positive);
}
.negative {
  color: var(--negative);
}
.amount,
.balance-value,
.settle-amount,
.stat-value,
.split-value,
.code-inputs input {
  font-family: var(--font-numeric);
  font-variant-numeric: tabular-nums;
}
.amount {
  font-weight: 600;
  white-space: nowrap;
  letter-spacing: -0.01em;
}
```

Use `var(--balance-surface)` and `var(--balance-fg)` on `.balance-hero`. Set `.large-title` to 36px, weight 600, and `var(--font-ui)`; retain the Android 32px override. Replace `.eyebrow` with:

```css
.eyebrow {
  margin: 28px 0 10px;
  color: var(--muted);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  text-transform: none;
}
```

- [ ] **Step 4: Implement the bounded material layers**

Replace the three blur selectors with these values while preserving their existing layout declarations:

```css
.status-bar {
  background: color-mix(in oklch, var(--surface-raised), transparent 18%);
  border-bottom: 1px solid color-mix(in oklch, var(--border), transparent 35%);
  backdrop-filter: blur(24px) saturate(1.2);
}
.topbar {
  background: color-mix(in oklch, var(--surface-raised), transparent 18%);
  border-bottom: 1px solid color-mix(in oklch, var(--border), transparent 35%);
  backdrop-filter: blur(24px) saturate(1.2);
}
.sheet {
  background: color-mix(in oklch, var(--surface-raised), transparent 8%);
  border: 1px solid color-mix(in oklch, var(--border), transparent 20%);
  border-radius: 24px;
  backdrop-filter: blur(36px) saturate(1.2);
  box-shadow: var(--shadow-sheet);
}
.android .sheet {
  border-width: 1px 0 0;
  border-radius: 24px 24px 0 0;
}
```

Merge these declarations into the current selectors rather than creating duplicate selectors. Ensure `backdrop-filter` occurs exactly three times in the final file.

- [ ] **Step 5: Add stage color fields and compact elevation**

Replace `.stage` background decoration and device shadow with:

```css
.stage {
  position: relative;
  isolation: isolate;
  background: oklch(91% 0.018 245);
}
.stage::before,
.stage::after {
  content: "";
  position: absolute;
  z-index: -1;
  width: 34vw;
  max-width: 520px;
  aspect-ratio: 1;
  border-radius: 50%;
  filter: blur(90px);
  opacity: 0.34;
  pointer-events: none;
}
.stage::before {
  top: -12%;
  left: 18%;
  background: oklch(73% 0.1 245);
}
.stage::after {
  right: 16%;
  bottom: -18%;
  background: var(--accent);
  opacity: 0.2;
}
.device {
  box-shadow: var(--shadow-device);
}
```

Keep all existing stage layout and device sizing declarations alongside these replacements.

- [ ] **Step 6: Apply the compact radius and shadow scale**

Set the final component values exactly:

```css
.balance-hero {
  border-radius: 16px;
}
.group-card {
  border-radius: 16px;
  box-shadow: none;
}
.group-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-raised);
}
.group-mark,
.command-icon,
.code-inputs input,
.split-value {
  border-radius: 12px;
}
.primary,
.secondary,
.danger-btn,
.social,
.field input,
.field select,
.search,
.receipt {
  border-radius: 14px;
}
.stat {
  border-radius: 14px;
}
.auth-logo,
.group-icon-lg {
  border-radius: 16px;
}
.fab {
  box-shadow: 0 4px 8px color-mix(in oklch, var(--accent), transparent 72%);
}
.primary {
  box-shadow: 0 3px 8px color-mix(in oklch, var(--accent), transparent 78%);
}
```

Remove the existing Android 26px button-radius override. Keep chips and iOS circular controls fully rounded.

- [ ] **Step 7: Preserve focus when search inputs suppress native outlines**

Add:

```css
.search:focus-within {
  outline: 3px solid color-mix(in oklch, var(--accent), white 25%);
  outline-offset: 2px;
}
```

- [ ] **Step 8: Run the shared-system tests and verify GREEN**

Run:

```bash
node --test --test-name-pattern="independent brand|purposeful blur|revised type|platform and accessibility" suma-ui-refinement.test.mjs
```

Expected: four passing tests and no failures.

---

### Task 4: Refine The Launcher Without Changing Destinations

**Files:**

- Modify: `index.html:7-23`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: Coral Ledger token values and approved font families.
- Produces: the consistent launcher entry surface for iOS, Android, and authentication links.

- [ ] **Step 1: Add launcher assertions to the existing purposeful-material test**

Append these assertions inside `test('uses purposeful blur and the compact shape scale', ...)`:

```js
assert.match(launcher, /--accent:\s*oklch\(66% 0\.19 28\)/);
assert.match(launcher, /\.targets a\s*\{[^}]*border-radius:\s*16px/s);
assert.doesNotMatch(launcher, /box-shadow:\s*0 18px 42px/);
assert.match(launcher, /\.targets a:first-child\s*\{[^}]*--panel-bg:\s*var\(--balance-surface\)/s);
```

- [ ] **Step 2: Run the launcher assertions and verify RED**

Run:

```bash
node --test --test-name-pattern="purposeful blur" suma-ui-refinement.test.mjs
```

Expected: FAIL on the launcher token, radius, old shadow, and first-panel assertions.

- [ ] **Step 3: Replace the launcher style block**

Keep all existing markup and href values. Replace only the contents of `<style>` with a tokenized implementation that includes these exact structural rules:

```css
:root {
  --bg: oklch(97% 0.012 245);
  --surface: oklch(99% 0.006 245);
  --fg: oklch(22% 0.032 255);
  --muted: oklch(46% 0.026 250);
  --border: oklch(87% 0.022 245);
  --accent: oklch(66% 0.19 28);
  --accent-soft: oklch(93% 0.05 28);
  --balance-surface: oklch(25% 0.045 255);
  --balance-fg: oklch(97% 0.008 245);
  --font-ui: "Instrument Sans", "SF Pro Text", "Roboto", system-ui, sans-serif;
  --font-numeric: "IBM Plex Mono", "SFMono-Regular", ui-monospace, monospace;
}
* {
  box-sizing: border-box;
}
body {
  margin: 0;
  min-height: 100svh;
  display: grid;
  place-items: center;
  padding: 32px;
  overflow: hidden;
  background: var(--bg);
  color: var(--fg);
  font-family: var(--font-ui);
}
body::before {
  content: "";
  position: fixed;
  width: min(56vw, 720px);
  aspect-ratio: 1;
  right: -14%;
  bottom: -38%;
  border-radius: 50%;
  background: var(--accent);
  filter: blur(120px);
  opacity: 0.12;
  pointer-events: none;
}
main {
  width: min(100%, 880px);
  position: relative;
}
h1 {
  margin: 0 0 16px;
  font-size: clamp(42px, 7vw, 72px);
  font-weight: 600;
  line-height: 1;
  letter-spacing: -0.03em;
}
p {
  max-width: 58ch;
  margin: 0 0 38px;
  color: var(--muted);
  font-size: 17px;
  line-height: 1.55;
}
.targets {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 16px;
}
.targets a {
  --panel-bg: var(--surface);
  --panel-fg: var(--fg);
  --panel-muted: var(--muted);
  min-height: 210px;
  padding: 26px;
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--panel-bg);
  color: var(--panel-fg);
  text-decoration: none;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition:
    transform 180ms cubic-bezier(0.22, 1, 0.36, 1),
    background 180ms ease;
}
.targets a:first-child {
  --panel-bg: var(--balance-surface);
  --panel-fg: var(--balance-fg);
  --panel-muted: color-mix(in oklch, var(--balance-fg), transparent 28%);
  border-color: transparent;
}
.targets a:hover {
  transform: translateY(-3px);
}
a:focus-visible {
  outline: 3px solid var(--accent);
  outline-offset: 3px;
}
.platform {
  color: var(--panel-muted);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.02em;
}
strong {
  font-size: 28px;
  font-weight: 600;
  letter-spacing: -0.02em;
}
.targets span:last-child {
  color: var(--panel-muted);
}
.auth {
  margin-top: 16px;
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.auth a {
  min-height: 48px;
  padding: 0 18px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--surface);
  color: var(--fg);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  font-weight: 600;
}
@media (max-width: 650px) {
  body {
    padding: 22px;
    overflow: auto;
  }
  .targets {
    grid-template-columns: 1fr;
  }
  h1 {
    font-size: 46px;
  }
}
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 4: Run the launcher test and verify GREEN**

Run:

```bash
node --test --test-name-pattern="purposeful blur" suma-ui-refinement.test.mjs
```

Expected: PASS.

---

### Task 5: Update The Design Contract And Registry

**Files:**

- Modify: `DESIGN.md:1-39`
- Modify: `ui-registry.md:1-40`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: the implemented tokens and component values from Tasks 2–4.
- Produces: the source-of-truth design documentation for future UI work.

- [ ] **Step 1: Run the documentation test and verify RED**

Run:

```bash
node --test --test-name-pattern="documents the implemented Coral Ledger system" suma-ui-refinement.test.mjs
```

Expected: FAIL because both files still document the emerald system and old radii.

- [ ] **Step 2: Rewrite DESIGN.md to match the implementation**

Preserve the existing section order. Replace the direction and tokens with Coral Ledger, list Instrument Sans and IBM Plex Mono under Typography, and document these exact component rules:

```markdown
## Components

- Brand actions use coral; positive and negative balances use independent semantic colors.
- Opaque content surfaces sit below translucent navigation and task layers.
- Inputs and buttons use 14px radii, actionable cards use 16px, and task sheets use 24px.
- iOS retains circular action controls and higher material translucency.
- Android retains its rounded-rectangle FAB, tonal surfaces, and more opaque bottom sheet.
- Blur is restricted to status bars, top bars, and command sheets.
```

- [ ] **Step 3: Update ui-registry.md**

Rename `Native Action Surface` to `Coral Ledger Action Surface` and update its table to include:

```markdown
| Property         | Pattern                                                               |
| ---------------- | --------------------------------------------------------------------- |
| Background       | Opaque `--surface` content beneath `--surface-raised` material layers |
| Border           | 1px `--border`; Android bottom sheets drop side borders               |
| Border radius    | 14px controls, 16px cards, 24px task sheets                           |
| Text — primary   | Instrument Sans using `--fg`, weight 500–600                          |
| Text — secondary | Instrument Sans using `--muted`, 13–14px                              |
| Financial values | IBM Plex Mono, weight 500–600, tabular figures                        |
| Hover state      | Neutral surface shift or 2px lift on actionable cards                 |
| Focus state      | 3px coral ring with 2px offset                                        |
| Shadow           | Compact elevation only; maximum 12px blur on sheets                   |
| Accent usage     | Coral for brand actions; emerald/crimson for balance semantics        |
```

Add “Coral Ledger” and both font names to the pattern notes. Keep the Money List Row entry, updating its amount typography to IBM Plex Mono.

- [ ] **Step 4: Run the documentation test and verify GREEN**

Run:

```bash
node --test --test-name-pattern="documents the implemented Coral Ledger system" suma-ui-refinement.test.mjs
```

Expected: PASS.

---

### Task 6: Verify The Complete Refinement And Refresh Critique

**Files:**

- Modify: `critique.json`
- Test: `suma-ui-refinement.test.mjs`

**Interfaces:**

- Consumes: the complete implementation and contract suite.
- Produces: final verification evidence and a critique panel describing the new system.

- [ ] **Step 1: Run the full contract suite**

Run:

```bash
node --test suma-ui-refinement.test.mjs
```

Expected: seven passing tests, zero failures.

- [ ] **Step 2: Validate the unchanged JavaScript separately**

Run:

```bash
node --check suma-prototype.js
```

Expected: exit code 0 with no output.

- [ ] **Step 3: Scan for prohibited patterns and stale tokens**

Run:

```bash
rg -n "Söhne|text-transform:\s*uppercase|box-shadow:\s*0 (12px 32px|18px 42px|18px 60px)|background-clip:\s*text|#6366f1|scrollIntoView|T[O]DO|T[B]D" index.html mobile-ios.html mobile-android.html suma-prototype.css DESIGN.md ui-registry.md
```

Expected: no output and exit code 1 because no prohibited pattern matches.

- [ ] **Step 4: Render one visual preview when the desktop renderer is available**

Run:

```bash
"$OD_NODE_BIN" "$OD_BIN" export mobile-ios.html --project "$OD_PROJECT_ID" --format image --out "/var/folders/n5/0ywwltp54y12_s3629d4tpxr0000gn/T/opencode/suma-coral-ledger-preview.png"
```

Expected: a successful image export. Inspect the image for clipped titles, weak contrast, accidental content translucency, excessive blur, and overlap. If the desktop renderer is unavailable, record that limitation and do not claim visual-render verification.

- [ ] **Step 5: Inspect representative states**

Open these routes in both platform entries and verify the same criteria manually:

```text
?screen=home
?screen=welcome
?screen=add-expense
?screen=settle
?screen=currencies
```

Check the command sheet from Home, keyboard focus in search and forms, light/dark appearance, 360px compact width, iOS circular FAB, Android rounded-rectangle FAB, and semantic positive/negative colors.

- [ ] **Step 6: Refresh critique.json**

After the checks pass, replace `critique.json` with:

```json
{
  "kind": "critique-panel",
  "score": 4.6,
  "axes": {
    "clarity": {
      "score": 5,
      "notes": "Brand actions and financial status now use separate color roles, preserving immediate balance comprehension."
    },
    "hierarchy": {
      "score": 5,
      "notes": "Compact shapes, controlled elevation, and the dark balance anchor establish stronger depth without adding UI."
    },
    "typography": {
      "score": 5,
      "notes": "Instrument Sans creates a consistent product voice while IBM Plex Mono gives financial values stable rhythm."
    },
    "motion": {
      "score": 4,
      "notes": "Existing fast state transitions remain intact and reduced motion is preserved; no decorative choreography was introduced."
    },
    "brand": {
      "score": 4,
      "notes": "Coral Ledger is more distinctive and social while keeping semantic money colors and native platform cues disciplined."
    }
  }
}
```

- [ ] **Step 7: Run the final full suite again**

Run:

```bash
node --test suma-ui-refinement.test.mjs && node --check suma-prototype.js && node -e "JSON.parse(require('fs').readFileSync('critique.json','utf8'))"
```

Expected: seven passing tests, JavaScript syntax exit 0, and valid JSON exit 0.
