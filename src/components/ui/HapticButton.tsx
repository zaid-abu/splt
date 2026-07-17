import type { JSX, ReactNode } from "react";
import { Pressable, ActivityIndicator } from "react-native";
import type { ViewStyle } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

interface HapticButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "ink" | "brand" | "danger" | "outlined";
  height?: number;
  style?: ViewStyle;
}

export function HapticButton({
  children,
  onPress,
  disabled,
  loading,
  tone = "ink",
  height = 56,
  style,
}: HapticButtonProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const bgColor =
    tone === "brand"
      ? color.brand
      : tone === "danger"
        ? color.danger
        : tone === "outlined"
          ? color.control
          : color.ink;
  const textColor = tone === "outlined" ? color.textStrong : "#FFFFFF";
  const borderColor = tone === "outlined" ? color.border : "transparent";

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        onPress();
      }}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        height,
        borderRadius: radius.pill,
        backgroundColor: bgColor,
        borderWidth: tone === "outlined" ? 1 : 0,
        borderColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        paddingHorizontal: 20,
        opacity: disabled ? 0.45 : pressed || loading ? 0.78 : 1,
        ...style,
      })}
    >
      {loading && <ActivityIndicator color={textColor} />}
      <Typography style={{ fontSize: 16, color: textColor, fontFamily: "IBMPlexSans_600SemiBold" }}>
        {children}
      </Typography>
    </Pressable>
  );
}
