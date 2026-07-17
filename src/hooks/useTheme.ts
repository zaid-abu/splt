import { useUIStore } from "@/store/useUIStore";
import { useUI, DARK_COLORS } from "@/components/ui";

export function useTheme() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const ui = useUI();

  return {
    isDarkMode,
    color: ui.color,
    darkColors: DARK_COLORS,
    radius: ui.radius,
    space: ui.space,
    shadow: ui.shadow,
  };
}
