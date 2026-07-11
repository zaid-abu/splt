import { Typography } from "heroui-native";
import React, { type JSX } from "react";
import { View, Pressable } from "react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";

// ─── Design Tokens ───
const SURFACE = "#FFFCF8";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#E85D5D";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";
const CARD_RADIUS = 16;

interface GroupCardProps {
  group: Group;
  balance?: number;
  currency?: string;
  index?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

export const GroupCard = React.memo(function GroupCard({
  group,
  balance = 0,
  currency = "USD",
  index = 0,
  isFirst = false,
  isLast = false,
  onPress,
}: GroupCardProps): JSX.Element {
  const memberCount = group.members.length;

  let subAmountText = "";
  let subAmountColor = TEXT_SECONDARY;

  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = TEXT_DANGER;
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = TEXT_SUCCESS;
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 16,
        borderLeftWidth: 1,
        borderRightWidth: 1,
        borderTopWidth: isFirst ? 1 : 0,
        borderBottomWidth: 1,
        borderColor: SEPARATOR,
        backgroundColor: SURFACE,
        borderTopLeftRadius: isFirst ? CARD_RADIUS : 0,
        borderTopRightRadius: isFirst ? CARD_RADIUS : 0,
        borderBottomLeftRadius: isLast ? CARD_RADIUS : 0,
        borderBottomRightRadius: isLast ? CARD_RADIUS : 0,
        opacity: pressed ? 0.5 : 1,
      })}
    >
      {/* Leading Icon */}
      <View style={{ marginRight: 16, flexShrink: 0 }}>
        <GroupIconBadge group={group} size="md" />
      </View>

      {/* Title & Subtitle */}
      <View style={{ flex: 1, marginRight: 12 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: 16,
            color: TEXT_PRIMARY,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.3,
          }}
        >
          {group.name}
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: TEXT_SECONDARY,
            fontFamily: "IBMPlexSans_500Medium",
            marginTop: 4,
          }}
        >
          {memberCount} participant{memberCount !== 1 ? "s" : ""}
        </Typography>
      </View>

      {/* Trailing Balance */}
      <View style={{ alignItems: "flex-end", maxWidth: 118 }}>
        <Typography
          numberOfLines={1}
          adjustsFontSizeToFit
          style={{
            fontSize: 14,
            color: subAmountColor,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          {subAmountText}
        </Typography>
      </View>

      <icons.ChevronRight
        size={16}
        color={TEXT_SECONDARY}
        strokeWidth={1.75}
        style={{ marginLeft: 10 }}
      />
    </Pressable>
  );
});
