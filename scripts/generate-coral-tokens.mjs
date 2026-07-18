import { converter, formatHex } from "culori";
import { writeFile } from "node:fs/promises";

const toRgb = converter("rgb");
const themes = {
  light: {
    bg: "oklch(97% 0.012 245)",
    surface: "oklch(99% 0.006 245)",
    foreground: "oklch(22% 0.032 255)",
    muted: "oklch(46% 0.026 250)",
    border: "oklch(87% 0.022 245)",
    accent: "oklch(66% 0.19 28)",
    accentInk: "oklch(31% 0.11 25)",
    accentSoft: "oklch(93% 0.05 28)",
    inkOnAccent: "oklch(99% 0.004 25)",
    positive: "oklch(52% 0.145 157)",
    positiveSoft: "oklch(93% 0.045 157)",
    negative: "oklch(50% 0.19 18)",
    negativeSoft: "oklch(94% 0.04 18)",
    warning: "oklch(66% 0.14 78)",
    balanceSurface: "oklch(25% 0.045 255)",
    balanceForeground: "oklch(97% 0.008 245)",
    avatarSoft: "oklch(92% 0.035 245)",
    avatarInk: "oklch(35% 0.07 250)",
  },
  dark: {
    bg: "oklch(17% 0.02 255)",
    surface: "oklch(21% 0.024 255)",
    foreground: "oklch(95% 0.008 245)",
    muted: "oklch(72% 0.025 245)",
    border: "oklch(32% 0.026 255)",
    accent: "oklch(72% 0.18 28)",
    accentInk: "oklch(91% 0.055 28)",
    accentSoft: "oklch(29% 0.065 28)",
    inkOnAccent: "oklch(18% 0.035 25)",
    positive: "oklch(72% 0.14 157)",
    positiveSoft: "oklch(27% 0.055 157)",
    negative: "oklch(72% 0.17 18)",
    negativeSoft: "oklch(27% 0.06 18)",
    warning: "oklch(76% 0.13 78)",
    balanceSurface: "oklch(13% 0.035 255)",
    balanceForeground: "oklch(97% 0.008 245)",
    avatarSoft: "oklch(28% 0.05 245)",
    avatarInk: "oklch(88% 0.045 245)",
  },
};

const converted = Object.fromEntries(
  Object.entries(themes).map(([theme, tokens]) => [
    theme,
    Object.fromEntries(
      Object.entries(tokens).map(([key, value]) => [key, formatHex(toRgb(value))])
    ),
  ])
);

const source = `export const CORAL_COLORS = ${JSON.stringify(converted, null, 2)} as const;\n`;
await writeFile("src/components/coral/theme.ts", source);
