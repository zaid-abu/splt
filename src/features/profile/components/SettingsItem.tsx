import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { UI } from "@/components/ui/native-ui";

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
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: UI.color.border,
        opacity: pressed || disabled ? 0.5 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
        {Icon && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: UI.radius.lg,
              backgroundColor: UI.color.control,
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDanger ? UI.color.danger : UI.color.border,
            }}
          >
            <Icon size={20} color={isDanger ? UI.color.danger : UI.color.text} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 16,
              color: isDanger ? UI.color.danger : UI.color.text,
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
                color: UI.color.muted,
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
