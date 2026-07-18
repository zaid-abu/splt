import React, { type JSX } from "react";
import { View, Text } from "react-native";
import * as icons from "lucide-react-native";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { useUI } from "@/components/ui";
import { MoneyRow } from "@/components/coral";
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
        <Text
          style={{
            fontSize: 11,
            color: color.muted,
            fontFamily: "InstrumentSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          Settled
        </Text>
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
      <Text
        style={{
          fontSize: 12,
          color: textColor,
          fontFamily: "InstrumentSans_600SemiBold",
          letterSpacing: -0.2,
        }}
      >
        {formatAmount(Math.abs(balance), currency)}
      </Text>
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
  const { color } = useUI();
  const memberCount = group.members.length;

  const subtitleParts = [`${memberCount} participant${memberCount !== 1 ? "s" : ""}`];
  if (latestExpenseAt) {
    subtitleParts.push(formatActivityDate(new Date(latestExpenseAt)));
  }
  const subtitle = subtitleParts.join(" \u00b7 ");

  return (
    <MoneyRow
      avatar={<GroupIconBadge group={group} size="md" />}
      title={group.name}
      subtitle={subtitle}
      amount=""
      onPress={onPress}
      rightElement={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <BalancePill balance={balance} currency={currency} />
          <icons.ChevronRight size={18} color={color.muted} />
        </View>
      }
    />
  );
});
