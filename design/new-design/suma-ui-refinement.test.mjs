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
  assert.match(launcher, /--accent:\s*oklch\(66% 0\.19 28\)/);
  assert.match(launcher, /\.targets a\s*\{[^}]*border-radius:\s*16px/s);
  assert.doesNotMatch(launcher, /box-shadow:\s*0 18px 42px/);
  assert.match(
    launcher,
    /\.targets a:first-child\s*\{[^}]*--panel-bg:\s*var\(--balance-surface\)/s
  );
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
