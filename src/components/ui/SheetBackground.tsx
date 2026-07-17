import { Platform } from "react-native";
import { BlurView } from "expo-blur";
import { useUIStore } from "@/store/useUIStore";
import { useUI } from "@/components/ui";

export function BlurredSheetBackground(): React.JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { color, radius, space, shadow } = useUI();
  return (
    <BlurView
      intensity={Platform.OS === "ios" ? 90 : 80}
      tint={isDarkMode ? "dark" : "light"}
      style={{
        flex: 1,
        backgroundColor: Platform.OS === "android" ? color.surface : "transparent",
        borderTopLeftRadius: 0,
        borderTopRightRadius: 0,
      }}
    />
  );
}
