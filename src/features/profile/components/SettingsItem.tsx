import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";

const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";
const TEXT_DANGER = "#E02424";

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
        paddingVertical: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: SEPARATOR,
        opacity: pressed || disabled ? 0.5 : 1,
      })}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 16, flex: 1 }}>
        {Icon && (
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 0,
              backgroundColor: "transparent",
              alignItems: "center",
              justifyContent: "center",
              borderWidth: 1,
              borderColor: isDanger ? TEXT_DANGER : SEPARATOR,
            }}
          >
            <Icon size={20} color={isDanger ? TEXT_DANGER : TEXT_PRIMARY} strokeWidth={1.5} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Typography
            style={{
              fontSize: 16,
              color: isDanger ? TEXT_DANGER : TEXT_PRIMARY,
              fontFamily: "CrimsonText_700Bold",
              letterSpacing: -0.3,
            }}
          >
            {title}
          </Typography>
          {subtitle && (
            <Typography
              style={{
                fontSize: 13,
                color: TEXT_SECONDARY,
                fontFamily: "CrimsonText_600SemiBold",
                marginTop: 2,
              }}
            >
              {subtitle}
            </Typography>
          )}
        </View>
      </View>
      {rightElement && <View style={{ marginLeft: 16 }}>{rightElement}</View>}
    </Pressable>
  );
}
