import { useMemo } from "react";
import { useUIStore } from "@/store/useUIStore";
import { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW } from "@/components/ui/theme/tokens";

export function useUI() {
  const isDark = useUIStore((s) => s.isDarkMode);
  const color = isDark ? DARK_COLORS : LIGHT_COLORS;

  return useMemo(
    () => ({
      color,
      radius: RADIUS,
      space: SPACE,
      shadow: SHADOW,
    }),
    [color]
  );
}
