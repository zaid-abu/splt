import type { JSX } from "react";
import { View } from "react-native";
import { Typography } from "heroui-native";
import { useUI, GlassSection, GlassRow } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";
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
    <GlassSection title="Need attention">
      {owedUsers.slice(0, 3).map((user) => {
        const amount = formatAmount(
          Math.abs(perUserBalances.get(user.id) ?? 0),
          currencyCode,
        );
        return (
          <GlassRow
            key={user.id}
            icon={<AppUserAvatar user={user} size="sm" />}
            title={user.name}
            subtitle="Owes you"
            onPress={() => onAction(user.id)}
            showChevron
            end={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Typography
                  style={{
                    fontSize: 13,
                    color: color.success,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {amount}
                </Typography>
                <HapticButton tone="outlined" height={36} onPress={() => onAction(user.id)}>
                  Remind
                </HapticButton>
              </View>
            }
          />
        );
      })}
      {oweUsers.slice(0, 3).map((user) => {
        const amount = formatAmount(
          Math.abs(perUserBalances.get(user.id) ?? 0),
          currencyCode,
        );
        return (
          <GlassRow
            key={user.id}
            icon={<AppUserAvatar user={user} size="sm" />}
            title={user.name}
            subtitle="You owe"
            onPress={() => onAction(user.id)}
            showChevron
            end={
              <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                <Typography
                  style={{
                    fontSize: 13,
                    color: color.danger,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {amount}
                </Typography>
                <HapticButton tone="ink" height={36} onPress={() => onAction(user.id)}>
                  Settle
                </HapticButton>
              </View>
            }
          />
        );
      })}
    </GlassSection>
  );
}
