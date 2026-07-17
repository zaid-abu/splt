import { Typography } from "heroui-native";
import React, { type JSX } from "react";
import { View, Pressable } from "react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI } from "@/components/ui/native-ui";
import { formatActivityDate } from "@/utils/date";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";

interface GroupCardProps {
  group: Group;
  balance?: number;
  currency?: string;
  latestExpenseAt?: number;
  index?: number;
  isFirst?: boolean;
  isLast?: boolean;
  onPress?: () => void;
}

function BalancePill({ balance, currency }: { balance: number; currency: string }): JSX.Element {
  const { color, radius } = useUI();
  if (Math.abs(balance) <= 0.005) {
    return (
      <View
        style={{
          paddingHorizontal: 10,
          height: 26,
          borderRadius: radius.pill,
          backgroundColor: color.subtle,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography
          style={{
            fontSize: 11,
            color: color.muted,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          Settled
        </Typography>
      </View>
    );
  }

  const isNegative = balance < 0;
  const bgColor = isNegative ? color.dangerTint : color.successTint;
  const textColor = isNegative ? color.danger : color.success;

  return (
    <View
      style={{
        paddingHorizontal: 10,
        height: 26,
        borderRadius: radius.pill,
        backgroundColor: bgColor,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography
        style={{
          fontSize: 12,
          color: textColor,
          fontFamily: "IBMPlexSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {formatAmount(Math.abs(balance), currency)}
      </Typography>
    </View>
  );
}

export const GroupCard = React.memo(function GroupCard({
  group,
  balance = 0,
  currency = "USD",
  latestExpenseAt,
  index = 0,
  isFirst = false,
  isLast = false,
  onPress,
}: GroupCardProps): JSX.Element {
  const { color, radius, space, shadow } = useUI();
  const memberCount = group.members.length;

  const subtitleParts = [`${memberCount} participant${memberCount !== 1 ? "s" : ""}`];
  if (latestExpenseAt) {
    subtitleParts.push(formatActivityDate(new Date(latestExpenseAt)));
  }
  const subtitle = subtitleParts.join(" · ");

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
        borderColor: color.border,
        backgroundColor: color.surface,
        borderTopLeftRadius: isFirst ? radius.lg : 0,
        borderTopRightRadius: isFirst ? radius.lg : 0,
        borderBottomLeftRadius: isLast ? radius.lg : 0,
        borderBottomRightRadius: isLast ? radius.lg : 0,
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
            color: color.textStrong,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.3,
          }}
        >
          {group.name}
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginTop: 4,
          }}
        >
          {subtitle}
        </Typography>
      </View>

      {/* Trailing Balance Pill + Chevron */}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <BalancePill balance={balance} currency={currency} />
        <icons.ChevronRight size={16} color={color.muted} strokeWidth={1.75} />
      </View>
    </Pressable>
  );
});
