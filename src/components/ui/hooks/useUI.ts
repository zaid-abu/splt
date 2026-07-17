import { useMemo } from "react";
import { useUIStore } from "@/store/useUIStore";
import { LIGHT_COLORS, DARK_COLORS, RADIUS, SPACE, SHADOW } from "@/components/ui/theme/tokens";

export function useUI() {
  const isDark = useUIStore((s) => s.isDarkMode);
  return useMemo(
    () => ({
      color: isDark ? DARK_COLORS : LIGHT_COLORS,
      radius: RADIUS,
      space: SPACE,
      shadow: SHADOW,
    }),
    [isDark],
  );
}
