import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";

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
  const { color, radius, space, shadow } = useUI();
  const Icon = icon ? (icons as any)[icon] : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={!onPress || disabled}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: color.border,
        opacity: pressed || disabled ? 0.5 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
        {Icon && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: radius.lg,
              backgroundColor: color.control,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDanger ? color.danger : color.border,
            }}
          >
            <Icon size={20} color={isDanger ? color.danger : color.text} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 16,
              color: isDanger ? color.danger : color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              style={{
                fontSize: 13,
                color: color.muted,
                fontFamily: "IBMPlexSans_500Medium",
                marginTop: 2,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </View>
      </View>
      {rightElement && (
        <View style={{ marginLeft: 16, justifyContent: "center" }}>{rightElement}</View>
      )}
    </Pressable>
  );
}
