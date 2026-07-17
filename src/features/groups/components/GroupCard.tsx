import { Typography } from "heroui-native";
import React, { type JSX } from "react";
import { View } from "react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI, GlassRow } from "@/components/ui";
import { formatActivityDate } from "@/utils/date";
import type { Group } from "@/types";

interface GroupCardProps {
  group: Group;
  balance?: number;
  currency?: string;
  latestExpenseAt?: number;
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
  onPress,
}: GroupCardProps): JSX.Element {
  const memberCount = group.members.length;

  const subtitleParts = [`${memberCount} participant${memberCount !== 1 ? "s" : ""}`];
  if (latestExpenseAt) {
    subtitleParts.push(formatActivityDate(new Date(latestExpenseAt)));
  }
  const subtitle = subtitleParts.join(" · ");

  return (
    <GlassRow
      icon={<GroupIconBadge group={group} size="md" />}
      title={group.name}
      subtitle={subtitle}
      end={<BalancePill balance={balance} currency={currency} />}
      showChevron
      onPress={onPress}
    />
  );
});
