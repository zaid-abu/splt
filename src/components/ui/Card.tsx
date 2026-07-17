import type { JSX, ReactNode } from "react";
import { View, Platform } from "react-native";
import type { ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { useUI } from "@/components/ui";
import { useUIStore } from "@/store/useUIStore";

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
}

export function Card({ children, style, padding = 16 }: CardProps): JSX.Element {
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const { color, radius, space, shadow } = useUI();

  return (
    <View
      style={[
        {
          borderRadius: radius.lg,
          overflow: "hidden",
          borderWidth: 1,
          borderColor: color.border,
        },
        style,
      ]}
    >
      <BlurView
        intensity={Platform.OS === "ios" ? 80 : 90}
        tint={isDarkMode ? "dark" : "light"}
        style={{
          padding,
          backgroundColor:
            Platform.OS === "android"
              ? isDarkMode
                ? "rgba(20, 35, 55, 0.9)"
                : "rgba(255, 255, 255, 0.85)"
              : "transparent",
        }}
      >
        {children}
      </BlurView>
    </View>
  );
}
