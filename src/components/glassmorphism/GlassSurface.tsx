import type { ReactNode, JSX } from "react";
import { View, Platform, StyleSheet } from "react-native";
import { BlurView } from "expo-blur";
import { useUIStore } from "@/store/useUIStore";

interface GlassSurfaceProps {
  children: ReactNode;
  borderRadius?: number;
  padding?: number;
  style?: Record<string, unknown>;
}

export default function GlassSurface({
  children,
  borderRadius = 24,
  padding = 20,
  style,
}: GlassSurfaceProps): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const tint = isDarkMode ? "dark" : "light";
  const fallbackBg = isDarkMode ? "rgba(20, 35, 55, 0.9)" : "rgba(255, 255, 255, 0.85)";

  return (
    <View
      style={[
        {
          borderRadius,
          overflow: "hidden",
        },
        style,
      ]}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 90}
        tint={tint}
        style={{
          padding,
          borderRadius,
          backgroundColor: Platform.OS === "android" ? fallbackBg : "transparent",
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: isDarkMode ? "rgba(255, 255, 255, 0.12)" : "rgba(255, 255, 255, 0.64)",
        }}
      >
        {children}
      </BlurView>
    </View>
  );
}
