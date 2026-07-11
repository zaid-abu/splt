import type { JSX, ReactNode } from "react";
import { Pressable, ActivityIndicator } from "react-native";
import type { ViewStyle } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { UI } from "@/components/ui/native-ui";

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
  const bgColor =
    tone === "brand"
      ? UI.color.brand
      : tone === "danger"
        ? UI.color.danger
        : tone === "outlined"
          ? UI.color.control
          : UI.color.text;
  const textColor = tone === "outlined" ? UI.color.text : UI.color.textInverse;
  const borderColor = tone === "outlined" ? UI.color.border : "transparent";

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
        borderRadius: UI.radius.pill,
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
