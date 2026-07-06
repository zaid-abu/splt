import type { JSX } from "react";
import { View, Pressable } from "react-native";
import * as icons from "lucide-react-native";
import { Text } from "@/components/ui/Text";

interface SettingsItemProps {
  icon?: keyof typeof icons;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  isDanger?: boolean;
  disabled?: boolean;
}

export function SettingsItem({
  icon,
  title,
  subtitle,
  rightElement,
  onPress,
  isLast = false,
  isDanger = false,
  disabled = false,
}: SettingsItemProps): JSX.Element {
  const Icon = icon ? (icons as any)[icon] : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress || disabled}
      className={`flex-row items-center justify-between py-4 px-4 active:bg-surface-2 ${isLast ? "" : "border-b border-border"} ${disabled ? "opacity-50" : ""}`}
    >
      <View className="flex-row items-center gap-4 flex-1">
        {Icon && (
          <View
            className={`w-10 h-10 rounded-xl items-center justify-center border ${isDanger ? "border-danger bg-danger/10" : "border-border bg-surface-2"}`}
          >
            <Icon size={20} color={isDanger ? "#EF4444" : "#FB923C"} strokeWidth={1.5} />
          </View>
        )}
        <View className="flex-1">
          <Text variant="body" weight="bold" color={isDanger ? "danger" : "foreground"}>
            {title}
          </Text>
          {subtitle && (
            <Text variant="body-sm" weight="semibold" color="muted" className="mt-1">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightElement && <View className="ml-4">{rightElement}</View>}
    </Pressable>
  );
}
