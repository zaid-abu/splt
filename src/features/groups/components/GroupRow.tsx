import React, { type JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui/native-ui";
import type { Group } from "@/types";

interface GroupRowProps {
  group: Group;
  balance: number;
  currency: string;
  isLast: boolean;
  onPress: () => void;
}

export const GroupRow = React.memo(function GroupRow({
  group,
  balance,
  currency,
  isLast,
  onPress,
}: GroupRowProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const memberCount = group.members.length;

  let subAmountText = "";
  let subAmountColor: string = color.muted;

  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = color.danger;
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = color.success;
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        minHeight: 64,
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: color.border,
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <View style={{ marginRight: 14 }}>
        <GroupIconBadge group={group} size="md" />
      </View>

      <View style={{ flex: 1, marginRight: 10 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 15,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {group.name}
        </Typography>
        <Typography
          style={{
            fontSize: 13,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginTop: 2,
          }}
        >
          {memberCount} participants
        </Typography>
      </View>

      <View style={{ alignItems: "flex-end" }}>
        <Typography
          style={{
            fontSize: 13,
            color: subAmountColor,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {subAmountText}
        </Typography>
      </View>

      <icons.ChevronRight
        size={14}
        color={color.muted}
        strokeWidth={1.75}
        style={{ marginLeft: 8 }}
      />
    </Pressable>
  );
});
