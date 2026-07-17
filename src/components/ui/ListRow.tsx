import type { JSX, ReactNode } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useUI } from "@/components/ui/native-ui";

interface ListRowProps {
  leading?: ReactNode;
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
  onPress?: () => void;
  isLast?: boolean;
  disabled?: boolean;
}

export function ListRow({
  leading,
  title,
  subtitle,
  trailing,
  onPress,
  isLast,
  disabled,
}: ListRowProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const content = (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: color.border,
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {leading && <View style={{ marginRight: 14 }}>{leading}</View>}
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {title}
        </Typography>
        {subtitle && (
          <Typography
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontSize: 13,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
            }}
          >
            {subtitle}
          </Typography>
        )}
      </View>
      {trailing && <View style={{ marginLeft: 12 }}>{trailing}</View>}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        disabled={disabled}
        style={({ pressed }) => ({ opacity: pressed ? 0.62 : 1 })}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}
