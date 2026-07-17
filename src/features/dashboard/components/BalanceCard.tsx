/**
 * BalanceCard
 */
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useUI, GlassSection, GlassHeroBalance } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { User } from "@/types";

export interface BalanceCardProps {
  youOwe: number;
  owedToYou: number;
  currencyCode: string;
  oweUsers: User[];
  owedUsers: User[];
  onOwePress: () => void;
  onOwedPress: () => void;
  onSettlePress?: () => void;
  onViewBalancesPress?: () => void;
}

export function BalanceCard({
  youOwe,
  owedToYou,
  currencyCode,
  oweUsers,
  owedUsers,
  onOwePress: _onOwePress,
  onOwedPress: _onOwedPress,
  onSettlePress,
  onViewBalancesPress,
}: BalanceCardProps): JSX.Element {
  const { color } = useUI();
  const isAllSettled = youOwe === 0 && owedToYou === 0;
  const netBalance = owedToYou - youOwe;
  const netBalanceLabel =
    netBalance > 0 ? "Net owed to you" : netBalance < 0 ? "Net you owe" : "Net balance";
  const netBalanceColor =
    netBalance < 0 ? color.danger : netBalance > 0 ? color.success : color.muted;
  const netBalanceAmount = Math.abs(netBalance).toFixed(2);

  if (isAllSettled) {
    return (
      <GlassSection title="Balance">
        <View
          style={{ paddingVertical: 28, paddingHorizontal: 18, alignItems: "center", justifyContent: "center" }}
        >
          <View
            style={{
              width: 64,
              height: 64,
              borderRadius: 14,
              borderWidth: 1,
              borderColor: color.border,
              backgroundColor: color.successTint,
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 14,
            }}
          >
            <icons.Check size={32} color={color.success} strokeWidth={2.5} />
          </View>
          <Typography
            style={{
              fontSize: 22,
              lineHeight: 28,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 6,
              textAlign: "center",
            }}
          >
            All settled up
          </Typography>
          <Typography
            style={{
              fontSize: 15,
              lineHeight: 21,
              color: color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              textAlign: "center",
            }}
          >
            You don&apos;t owe anyone, and no one owes you.
          </Typography>
          {onViewBalancesPress && (
            <Pressable
              accessibilityRole="button"
              onPress={onViewBalancesPress}
              style={({ pressed }) => ({
                marginTop: 16,
                paddingHorizontal: 18,
                minHeight: 44,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: color.border,
                backgroundColor: color.control,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.75 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 14, color: color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
              >
                View balances
              </Typography>
            </Pressable>
          )}
        </View>
      </GlassSection>
    );
  }

  return (
    <GlassHeroBalance
      label={netBalanceLabel}
      amount={`${netBalanceAmount} ${currencyCode}`}
      amountColor={netBalanceColor}
      metrics={[
        {
          label: "You owe",
          value: formatAmount(youOwe, currencyCode),
          color: youOwe > 0 ? color.danger : color.muted,
        },
        {
          label: "You are owed",
          value: formatAmount(owedToYou, currencyCode),
          color: owedToYou > 0 ? color.success : color.muted,
        },
      ]}
    >
      <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
        {youOwe > 0 && (
          <Pressable
            accessibilityRole="button"
            onPress={onSettlePress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              backgroundColor: color.ink,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.8 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Settle up
            </Typography>
          </Pressable>
        )}

        {onViewBalancesPress && (
          <Pressable
            accessibilityRole="button"
            onPress={onViewBalancesPress}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 44,
              borderRadius: 999,
              borderWidth: 1,
              borderColor: color.border,
              backgroundColor: color.control,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.75 : 1,
            })}
          >
            <Typography
              style={{ fontSize: 14, color: color.text, fontFamily: "IBMPlexSans_600SemiBold" }}
            >
              View balances
            </Typography>
          </Pressable>
        )}
      </View>
    </GlassHeroBalance>
  );
}
