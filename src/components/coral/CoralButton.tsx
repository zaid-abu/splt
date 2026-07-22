import { Pressable, ActivityIndicator, Text, Platform } from "react-native";
import type { ReactNode } from "react";

import { useCoralColors } from "./useCoral";

type CoralButtonProps = {
  label: string;
  icon?: ReactNode;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  loading?: boolean;
};

export function CoralButton({
  label,
  icon,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: CoralButtonProps) {
  const coral = useCoralColors();

  const styles = {
    primary: { bg: coral.accent, fg: coral.inkOnAccent, border: "transparent" },
    secondary: { bg: coral.surface, fg: coral.foreground, border: coral.border },
    danger: { bg: coral.negativeSoft, fg: coral.negative, border: "transparent" },
    text: { bg: "transparent", fg: coral.accent, border: "transparent" },
  }[variant];

  const isDisabled = disabled || loading;
  const minHeight = variant === "text" ? (Platform.OS === "ios" ? 44 : 48) : 52;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => ({
        minHeight,
        width: "100%",
        borderRadius: 14,
        backgroundColor: styles.bg,
        borderWidth: styles.border !== "transparent" ? 1 : 0,
        borderColor: styles.border,
        paddingHorizontal: variant === "text" ? 4 : 18,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        gap: 8,
        opacity: isDisabled ? 0.45 : pressed ? 0.78 : 1,
      })}
    >
      {loading && (
        <ActivityIndicator size="small" color={variant === "text" ? coral.accent : styles.fg} />
      )}
      {!loading && icon && icon}
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 16,
          letterSpacing: 0.02 * 16,
          color: styles.fg,
          textDecorationLine: variant === "text" ? "underline" : "none",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}
