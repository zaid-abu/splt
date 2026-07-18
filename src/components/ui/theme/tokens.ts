import { CORAL_COLORS } from "@/components/coral/theme";

type CoralPalette = (typeof CORAL_COLORS)[keyof typeof CORAL_COLORS];

const createLegacyColors = (colors: CoralPalette) => ({
  bg: colors.bg,
  surface: colors.surface,
  control: colors.surface,
  text: colors.foreground,
  textStrong: colors.foreground,
  textInverse: colors.inkOnAccent,
  muted: colors.muted,
  border: colors.border,
  borderSoft: colors.border,
  brand: colors.accent,
  ink: colors.foreground,
  danger: colors.negative,
  success: colors.positive,
  subtle: colors.accentSoft,
  dangerTint: colors.negativeSoft,
  successTint: colors.positiveSoft,
});

export const LIGHT_COLORS = createLegacyColors(CORAL_COLORS.light);
export const DARK_COLORS = createLegacyColors(CORAL_COLORS.dark);

export const RADIUS = { sm: 12, md: 14, lg: 16, xl: 24, pill: 999 } as const;
export const SPACE = { page: 24 } as const;
export const SHADOW = {
  sm: {
    shadowColor: CORAL_COLORS.light.foreground,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: CORAL_COLORS.light.foreground,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: CORAL_COLORS.light.foreground,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
} as const;
