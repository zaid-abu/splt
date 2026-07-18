/**
 * BalanceCard
 */
import type { JSX } from "react";
import { View, Pressable, Text } from "react-native";
import * as icons from "lucide-react-native";
import { useUI } from "@/components/ui";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { BalanceHero, StatPair, Eyebrow, useCoralColors } from "@/components/coral";
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
  const coral = useCoralColors();
  const isAllSettled = youOwe === 0 && owedToYou === 0;
  const netBalance = owedToYou - youOwe;
  const netBalanceLabel =
    netBalance > 0 ? "Net owed to you" : netBalance < 0 ? "Net you owe" : "Net balance";
  const netBalanceAmount = Math.abs(netBalance).toFixed(2);

  if (isAllSettled) {
    return (
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Balance</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
          <View
            style={{
              paddingVertical: 28,
              paddingHorizontal: 18,
              alignItems: "center",
              justifyContent: "center",
            }}
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
            <Text
              style={{
                fontSize: 22,
                lineHeight: 28,
                color: color.text,
                fontFamily: "InstrumentSans_600SemiBold",
                marginBottom: 6,
                textAlign: "center",
              }}
            >
              All settled up
            </Text>
            <Text
              style={{
                fontSize: 15,
                lineHeight: 21,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
                textAlign: "center",
              }}
            >
              You don&apos;t owe anyone, and no one owes you.
            </Text>
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
                <Text
                  style={{
                    fontSize: 14,
                    color: color.text,
                    fontFamily: "InstrumentSans_600SemiBold",
                  }}
                >
                  View balances
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </View>
    );
  }

  return (
    <BalanceHero label={netBalanceLabel} value={`${netBalanceAmount} ${currencyCode}`}>
      <StatPair
        left={{
          label: "You owe",
          value: formatAmount(youOwe, currencyCode),
          tone: youOwe > 0 ? "negative" : "neutral",
        }}
        right={{
          label: "You are owed",
          value: formatAmount(owedToYou, currencyCode),
          tone: owedToYou > 0 ? "positive" : "neutral",
        }}
      />
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
            <Text
              style={{
                fontSize: 14,
                color: "#FFFFFF",
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              Settle up
            </Text>
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
            <Text
              style={{
                fontSize: 14,
                color: color.text,
                fontFamily: "InstrumentSans_600SemiBold",
              }}
            >
              View balances
            </Text>
          </Pressable>
        )}
      </View>
    </BalanceHero>
  );
}
