import type { JSX } from "react";
import { View, Text } from "react-native";
import { useUI } from "@/components/ui";
import { HapticButton } from "@/components/ui/HapticButton";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import * as icons from "lucide-react-native";
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
  const coral = useCoralColors();

  if (owedUsers.length === 0 && oweUsers.length === 0) return <></>;

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Need attention</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
        }}
      >
        {owedUsers.slice(0, 3).map((user) => {
          const amount = formatAmount(Math.abs(perUserBalances.get(user.id) ?? 0), currencyCode);
          return (
            <MoneyRow
              key={user.id}
              avatar={<AppUserAvatar user={user} size="sm" />}
              title={user.name}
              subtitle="Owes you"
              onPress={() => onAction(user.id)}
              amount={amount}
              amountTone="positive"
              rightElement={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <HapticButton tone="outlined" height={36} onPress={() => onAction(user.id)}>
                    Remind
                  </HapticButton>
                  <icons.ChevronRight size={18} color={color.muted} />
                </View>
              }
            />
          );
        })}
        {oweUsers.slice(0, 3).map((user) => {
          const amount = formatAmount(Math.abs(perUserBalances.get(user.id) ?? 0), currencyCode);
          return (
            <MoneyRow
              key={user.id}
              avatar={<AppUserAvatar user={user} size="sm" />}
              title={user.name}
              subtitle="You owe"
              onPress={() => onAction(user.id)}
              amount={amount}
              amountTone="negative"
              rightElement={
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                  <HapticButton tone="ink" height={36} onPress={() => onAction(user.id)}>
                    Settle
                  </HapticButton>
                  <icons.ChevronRight size={18} color={color.muted} />
                </View>
              }
            />
          );
        })}
      </View>
    </View>
  );
}
