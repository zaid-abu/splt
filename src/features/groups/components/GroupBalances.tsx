import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
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

  return (
    <GlassSection title="Group Balances">
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
          <Typography
            style={{
              fontSize: 16,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 4,
            }}
          >
            All settled up!
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}
          >
            No pending balances
          </Typography>
        </View>
      ) : (
        groupDebts.map((debt) => {
          const fromUser = members.find((m) => m.userId === debt.fromUserId)?.user;
          const toUser = members.find((m) => m.userId === debt.toUserId)?.user;
          if (!fromUser || !toUser) return null;

          const isMeOwe = fromUser.id === currentUserId;
          const isOweMe = toUser.id === currentUserId;
          const amountColor = isMeOwe ? color.danger : isOweMe ? color.success : color.text;

          return (
            <GlassRow
              key={`${debt.fromUserId}-${debt.toUserId}`}
              icon={<AppUserAvatar user={fromUser} size="md" />}
              title={isMeOwe ? "You" : fromUser.name}
              subtitle={`owes ${isOweMe ? "you" : toUser.name.split(" ")[0]}`}
              end={
                <Typography
                  style={{
                    fontSize: 16,
                    color: amountColor,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(debt.amount, currency)}
                </Typography>
              }
            />
          );
        })
      )}
    </GlassSection>
  );
}
