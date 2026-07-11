import { useUIStore } from "@/store/useUIStore";
import { UI, DARK_COLORS } from "@/components/ui/native-ui";

export function useTheme() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);

  return {
    isDarkMode,
    color: UI.color,
    darkColors: DARK_COLORS,
    radius: UI.radius,
    space: UI.space,
    shadow: UI.shadow,
  };
}
