import type { JSX, ReactNode } from "react";
import {  View, Pressable , Text } from "react-native";
import { useUI } from "@/components/ui/hooks/useUI";

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
        <Text
          numberOfLines={1}
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "InstrumentSans_600SemiBold",
          }}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            numberOfLines={1}
            style={{
              marginTop: 2,
              fontSize: 13,
              color: color.muted,
              fontFamily: "InstrumentSans_500Medium",
            }}
          >
            {subtitle}
          </Text>
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
