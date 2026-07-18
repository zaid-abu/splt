import React, { type ComponentType } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

export function OptionRow({
  icon: Icon,
  label,
  description,
  tone = "neutral",
  onPress,
}: {
  icon: ComponentType<{ size?: number; color?: string; strokeWidth?: number }>;
  label: string;
  description: string;
  tone?: "neutral" | "danger";
  onPress: () => void;
}): React.JSX.Element {
  const { color } = useUI();
  const itemColor = tone === "danger" ? color.danger : color.text;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => ({
        minHeight: 64,
        flexDirection: "row",
        alignItems: "center",
        gap: 14,
        paddingVertical: 10,
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 14,
          backgroundColor: color.control,
          borderWidth: 1,
          borderColor: color.border,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={20} color={itemColor} strokeWidth={1.8} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Typography
          style={{
            fontSize: 16,
            lineHeight: 21,
            color: itemColor,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {label}
        </Typography>
        <Typography
          numberOfLines={2}
          style={{
            marginTop: 2,
            fontSize: 13,
            lineHeight: 18,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
          }}
        >
          {description}
        </Typography>
      </View>
    </Pressable>
  );
}

// The OptionRow component is consumed by the FriendDetailScreen
// in the bottom sheet modal. It is not a standalone sheet component.
