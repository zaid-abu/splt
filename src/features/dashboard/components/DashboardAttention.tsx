import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI, TYPO } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { Card } from "@/components/ui/Card";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User } from "@/types";

interface DashboardAttentionProps {
  oweUsers: User[];
  owedUsers: User[];
  perUserBalances: Map<string, number>;
  currencyCode: string;
  onAction: (userId: string) => void;
}

export function DashboardAttention({
  oweUsers,
  owedUsers,
  perUserBalances,
  currencyCode,
  onAction,
}: DashboardAttentionProps): JSX.Element {
  const { color } = useUI();

  if (owedUsers.length === 0 && oweUsers.length === 0) return <></>;

  return (
    <View style={{ marginBottom: 24 }}>
      <View style={{ marginBottom: 14 }}>
        <Typography style={TYPO.semi(18)}>Need attention</Typography>
      </View>
      <Card padding={0}>
        {owedUsers.slice(0, 3).map((user) => (
          <View
            key={user.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <AppUserAvatar user={user} size="sm" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography style={[TYPO.semi(15), { color: color.textStrong }]}>
                {user.name}
              </Typography>
              <Typography style={[TYPO.medium(13), { color: color.success, marginTop: 1 }]}>
                Owes you{" "}
                {formatAmount(
                  Math.abs(perUserBalances.get(user.id) ?? 0),
                  currencyCode,
                )}
              </Typography>
            </View>
            <HapticButton tone="outlined" height={36} onPress={() => onAction(user.id)}>
              Remind
            </HapticButton>
          </View>
        ))}
        {oweUsers.slice(0, 3).map((user) => (
          <View
            key={user.id}
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth: 1,
              borderBottomColor: color.border,
            }}
          >
            <AppUserAvatar user={user} size="sm" />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Typography style={[TYPO.semi(15), { color: color.textStrong }]}>
                {user.name}
              </Typography>
              <Typography style={[TYPO.medium(13), { color: color.danger, marginTop: 1 }]}>
                You owe{" "}
                {formatAmount(
                  Math.abs(perUserBalances.get(user.id) ?? 0),
                  currencyCode,
                )}
              </Typography>
            </View>
            <HapticButton tone="ink" height={36} onPress={() => onAction(user.id)}>
              Settle
            </HapticButton>
          </View>
        ))}
      </Card>
    </View>
  );
}
