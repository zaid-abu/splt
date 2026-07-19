import { Pressable, ActivityIndicator, Text, Platform } from "react-native";

import { useCoralColors } from "./useCoral";

type CoralButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "danger" | "text";
  disabled?: boolean;
  loading?: boolean;
};

export function CoralButton({
  label,
  onPress,
  variant = "primary",
  disabled = false,
  loading = false,
}: CoralButtonProps) {
  const coral = useCoralColors();

  const styles = {
    primary: { bg: coral.accent, fg: coral.inkOnAccent },
    secondary: { bg: coral.accentSoft, fg: coral.accentInk },
    danger: { bg: coral.negativeSoft, fg: coral.negative },
    text: { bg: "transparent", fg: coral.accent },
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
