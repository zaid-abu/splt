import { useMemo } from "react";
import { useUIStore } from "@/store/useUIStore";
import { CORAL_COLORS } from "./theme";

export function useCoralColors() {
  const isDark = useUIStore((s) => s.isDarkMode);
  return useMemo(() => CORAL_COLORS[isDark ? "dark" : "light"], [isDark]);
}
