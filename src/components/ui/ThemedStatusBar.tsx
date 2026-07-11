import { StatusBar } from "expo-status-bar";
import { useUIStore } from "@/store/useUIStore";

export function ThemedStatusBar() {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  return <StatusBar style={isDarkMode ? "light" : "dark"} />;
}
