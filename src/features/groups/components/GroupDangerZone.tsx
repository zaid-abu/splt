import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";

export interface GroupDangerZoneProps {
  onDeletePress: () => void;
  onLeavePress: () => void;
}

export function GroupDangerZone({
  onDeletePress,
  onLeavePress,
}: GroupDangerZoneProps): JSX.Element {
  const { color, radius } = useUI();

  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onDeletePress();
        }}
        style={({ pressed }) => ({
          height: 56,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: color.danger,
          backgroundColor: color.control,
          alignItems: "center",
          justifyContent: "center",
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Typography
          style={{
            fontSize: 16,
            color: color.danger,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Delete Group
        </Typography>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          onLeavePress();
        }}
        style={({ pressed }) => ({
          height: 56,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.control,
          alignItems: "center",
          justifyContent: "center",
          marginTop: 12,
          opacity: pressed ? 0.65 : 1,
        })}
      >
        <Typography
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Leave Group
        </Typography>
      </Pressable>
    </>
  );
}
