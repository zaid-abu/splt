import type { ComponentType } from "react";
import { Pressable } from "react-native";
import type { ViewStyle } from "react-native";
import { useUI } from "@/components/ui";

type IconType = ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;

interface IconButtonProps {
  icon: IconType;
  onPress: () => void;
  accessibilityLabel: string;
  tone?: "default" | "danger";
  style?: ViewStyle;
}

export function IconButton({ icon: Icon, onPress, accessibilityLabel, tone = "default", style }: IconButtonProps): React.JSX.Element {
  const { color, radius } = useUI();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44, height: 44, borderRadius: radius.pill,
        backgroundColor: color.control, borderWidth: 1, borderColor: color.border,
        alignItems: "center", justifyContent: "center", opacity: pressed ? 0.6 : 1, ...style,
      })}
    >
      <Icon size={20} color={tone === "danger" ? color.danger : color.text} strokeWidth={1.75} />
    </Pressable>
  );
}
