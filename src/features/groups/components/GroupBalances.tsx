import type { JSX } from "react";
import { View, Text } from "react-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import type { GroupMember } from "@/types";

export interface GroupBalancesProps {
  groupDebts: { fromUserId: string; toUserId: string; amount: number }[];
  members: GroupMember[];
  currentUserId?: string;
  currency: string;
}

export function GroupBalances({
  groupDebts,
  members,
  currentUserId,
  currency,
}: GroupBalancesProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Group Balances</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        {groupDebts.length === 0 ? (
          <View
            style={{
              paddingVertical: 32,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: radius.lg,
                backgroundColor: color.control,
                borderWidth: 1,
                borderColor: color.border,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 16,
              }}
            >
              <icons.Check size={24} color={color.success} strokeWidth={1.8} />
            </View>
            <Text
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "InstrumentSans_600SemiBold",
                marginBottom: 4,
              }}
            >
              All settled up!
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
                textAlign: "center",
              }}
            >
              No pending balances
            </Text>
          </View>
        ) : (
          groupDebts.map((debt) => {
            const fromUser = members.find((m) => m.userId === debt.fromUserId)?.user;
            const toUser = members.find((m) => m.userId === debt.toUserId)?.user;
            if (!fromUser || !toUser) return null;

            const isMeOwe = fromUser.id === currentUserId;
            const isOweMe = toUser.id === currentUserId;
            const amountTone = isMeOwe
              ? ("negative" as const)
              : isOweMe
                ? ("positive" as const)
                : ("neutral" as const);

            return (
              <MoneyRow
                key={`${debt.fromUserId}-${debt.toUserId}`}
                avatar={<AppUserAvatar user={fromUser} size="md" />}
                title={isMeOwe ? "You" : fromUser.name}
                subtitle={`owes ${isOweMe ? "you" : toUser.name.split(" ")[0]}`}
                amount={formatAmount(debt.amount, currency)}
                amountTone={amountTone}
              />
            );
          })
        )}
      </View>
    </View>
  );
}
