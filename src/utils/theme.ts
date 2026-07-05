export const THEME_COLORS = [
  "#3D2B82", // Primary
  "#6B4EFF", // Accent
  "#F34C5D", // Coral Red
  "#F5A623", // Gold
  "#00B894", // Mint
  "#0984E3", // Sky Blue
  "#6C5CE7", // Light Indigo
  "#E84393", // Pink
  "#10AC84", // Deep Teal
  "#E17055", // Terracotta
];

export function getStringColor(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % THEME_COLORS.length;
  return THEME_COLORS[index];
}

export function hexToRgba(hex: string, opacity: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

export function hexToPastel(hex: string, mixWithWhite = 0.85): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  
  const mix = (c: number) => Math.round(c * (1 - mixWithWhite) + 255 * mixWithWhite);
  
  const pr = mix(r).toString(16).padStart(2, "0");
  const pg = mix(g).toString(16).padStart(2, "0");
  const pb = mix(b).toString(16).padStart(2, "0");
  
  return `#${pr}${pg}${pb}`;
}
