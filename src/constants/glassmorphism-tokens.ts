import { Platform } from "react-native";

export const GLASS_LIGHT = {
  bg: "#EEF6FF",
  surface: "rgba(255, 255, 255, 0.74)",
  surfaceWarm: "rgba(238, 246, 255, 0.72)",
  text: "#102033",
  textSecondary: "#34465F",
  muted: "#60708A",
  accent: "#4F8CFF",
  accentOn: "#FFFFFF",
  accentHover: "#3B7DEB",
  accentActive: "#336FD6",
  success: "#22C55E",
  warn: "#F59E0B",
  danger: "#EF4444",
  border: "rgba(255, 255, 255, 0.64)",
  borderSoft: "rgba(255, 255, 255, 0.38)",
  blurTint: "light" as const,
  blurIntensity: Platform.OS === "ios" ? 80 : 90,
  surfaceFallback: "rgba(255, 255, 255, 0.85)",
} as const;

export const GLASS_DARK = {
  bg: "#0A1628",
  surface: "rgba(20, 35, 55, 0.74)",
  surfaceWarm: "rgba(10, 22, 40, 0.72)",
  text: "#E8ECF4",
  textSecondary: "#B0BCCC",
  muted: "#7A8AA8",
  accent: "#5B94FF",
  accentOn: "#FFFFFF",
  accentHover: "#4B84EF",
  accentActive: "#3B74DF",
  success: "#4ADE80",
  warn: "#FBBF24",
  danger: "#F87171",
  border: "rgba(255, 255, 255, 0.12)",
  borderSoft: "rgba(255, 255, 255, 0.08)",
  blurTint: "dark" as const,
  blurIntensity: Platform.OS === "ios" ? 80 : 90,
  surfaceFallback: "rgba(20, 35, 55, 0.9)",
} as const;

export type GlassTokens = typeof GLASS_LIGHT;

export const GLASS_RADIUS = {
  sm: 16,
  md: 24,
  lg: 36,
  pill: 9999,
  authMark: 22,
  orb: 46,
} as const;

export const GLASS_SPACE = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  section: 48,
} as const;

export const GLASS_TYPO = {
  title: {
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -0.025,
    fontFamily: "Sora_600SemiBold",
  } as const,
  body: {
    fontSize: 16,
    lineHeight: 25,
    fontFamily: "IBMPlexSans_400Regular",
  } as const,
  greeting: {
    fontSize: 13,
    letterSpacing: 0.01,
    fontFamily: "Sora_600SemiBold",
    textTransform: "uppercase" as const,
  } as const,
  label: {
    fontSize: 11,
    letterSpacing: 1.4,
    fontFamily: "IBMPlexSans_600SemiBold",
    textTransform: "uppercase" as const,
  } as const,
  buttonLabel: {
    fontSize: 16,
    fontFamily: "IBMPlexSans_600SemiBold",
    letterSpacing: 0.02,
  } as const,
} as const;

export const GLASS_SHADOW = {
  ring: {
    shadowColor: "rgba(255, 255, 255, 0.64)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 0.5,
    elevation: 0,
  },
  raised: {
    shadowColor: "rgba(79, 140, 255, 0.18)",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 1,
    shadowRadius: 40,
    elevation: 12,
  },
} as const;

export const GLASS_ANIMATION = {
  fast: 180,
  base: 280,
  orbRotation: 8000,
  orbBreathe: 4000,
} as const;
