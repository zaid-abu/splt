export const LIGHT_COLORS = {
  bg: "#EEF6FF",
  surface: "rgba(255, 255, 255, 0.74)",
  control: "rgba(255, 255, 255, 0.74)",
  text: "#102033",
  textStrong: "#102033",
  textInverse: "#FFFFFF",
  muted: "#60708A",
  border: "rgba(255, 255, 255, 0.64)",
  brand: "#4F8CFF",
  ink: "#102033",
  danger: "#EF4444",
  success: "#22C55E",
  subtle: "rgba(238, 246, 255, 0.72)",
  dangerTint: "rgba(239, 68, 68, 0.08)",
  successTint: "rgba(34, 197, 94, 0.08)",
};

export const DARK_COLORS = {
  bg: "#0A1628",
  surface: "rgba(20, 35, 55, 0.74)",
  control: "rgba(20, 35, 55, 0.74)",
  text: "#E8ECF4",
  textStrong: "#E8ECF4",
  textInverse: "#0A1628",
  muted: "#7A8AA8",
  border: "rgba(255, 255, 255, 0.12)",
  brand: "#5B94FF",
  ink: "#E8ECF4",
  danger: "#F87171",
  success: "#4ADE80",
  subtle: "rgba(10, 22, 40, 0.72)",
  dangerTint: "rgba(248, 113, 113, 0.08)",
  successTint: "rgba(74, 222, 128, 0.08)",
};

export const RADIUS = { sm: 16, md: 24, lg: 36, xl: 36, pill: 999 };
export const SPACE = { page: 24 };
export const SHADOW = {
  sm: { shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 1 },
  md: { shadowColor: "#fff", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.16, shadowRadius: 8, elevation: 2 },
  lg: { shadowColor: "rgba(79, 140, 255, 0.18)", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 1, shadowRadius: 40, elevation: 12 },
} as const;
