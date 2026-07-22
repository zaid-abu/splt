import type { ReactNode } from "react";
import { Pressable } from "react-native";
import type { ViewStyle } from "react-native";
import { useUI } from "@/components/ui/hooks/useUI";

interface PrimaryButtonProps {
  children: ReactNode;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  tone?: "brand" | "ink" | "danger";
  style?: ViewStyle;
}

export function PrimaryButton({
  children,
  onPress,
  disabled,
  loading,
  tone = "ink",
  style,
}: PrimaryButtonProps): React.JSX.Element {
  const { color, radius } = useUI();
  const backgroundColor =
    tone === "brand" ? color.brand : tone === "danger" ? color.danger : color.ink;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => ({
        minHeight: 52,
        borderRadius: radius.pill,
        backgroundColor,
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "row",
        paddingHorizontal: 20,
        opacity: disabled ? 0.45 : pressed || loading ? 0.78 : 1,
        ...style,
      })}
    >
      {children}
    </Pressable>
  );
}
