import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
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
    <View
      style={{
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: color.border,
        backgroundColor: color.surface,
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
        groupDebts.map((debt, idx) => {
          const fromUser = members.find((m) => m.userId === debt.fromUserId)?.user;
          const toUser = members.find((m) => m.userId === debt.toUserId)?.user;
          if (!fromUser || !toUser) return null;

          const isMeOwe = fromUser.id === currentUserId;
          const isOweMe = toUser.id === currentUserId;
          const amountColor = isMeOwe ? color.danger : isOweMe ? color.success : color.text;

          return (
            <Pressable
              key={`${debt.fromUserId}-${debt.toUserId}`}
              accessibilityRole="button"
              style={({ pressed }) => [
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                },
                idx < groupDebts.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: color.border,
                },
                pressed && { backgroundColor: color.subtle, opacity: 0.85 },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <AppUserAvatar user={fromUser} size="md" />
                <View>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {isMeOwe ? "You" : fromUser.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginTop: 2,
                    }}
                  >
                    owes {isOweMe ? "you" : toUser.name.split(" ")[0]}
                  </Typography>
                </View>
              </View>
              <Typography
                style={{
                  fontSize: 20,
                  color: amountColor,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {formatAmount(debt.amount, currency)}
              </Typography>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
