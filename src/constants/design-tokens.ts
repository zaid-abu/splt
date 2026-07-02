/**
 * Standard Typography Utility Constants
 * Extracted from design-tokens.json
 */

export const TYPOGRAPHY = {
  fontFamily: {
    heading: 'PlusJakartaSans_700Bold',
    body: 'PlusJakartaSans_400Regular',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    xxxl: 40,
  },
  fontWeight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  }
} as const;

export const SPACING = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const BORDER_RADIUS = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 40,
  pill: 9999,
} as const;
