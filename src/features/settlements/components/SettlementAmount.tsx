import type { JSX } from "react";
import { View, Pressable, TextInput, Text } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";
import { Eyebrow, useCoralColors } from "@/components/coral";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface SettlementAmountProps {
  amountStr: string;
  settlementCurrency: string;
  settlementCurrencyObj: { symbol: string };
  netBalance: number;
  preferredCurrencyCode: string;
  onAmountChange: (text: string) => void;
  onSetFullBalance: () => void;
  onSetHalfBalance: () => void;
}

export function SettlementAmount({
  amountStr,
  settlementCurrency,
  settlementCurrencyObj,
  netBalance,
  preferredCurrencyCode,
  onAmountChange,
  onSetFullBalance,
  onSetHalfBalance,
}: SettlementAmountProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{ alignItems: "center", marginVertical: 32, paddingHorizontal: 24 }}
    >
      <View style={{ width: "100%" }}>
        <Eyebrow style={{ marginTop: 0 }}>Amount</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
          <View style={{ padding: 24, alignItems: "center" }}>
            <Text
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "InstrumentSans_500Medium",
                marginBottom: 8,
              }}
            >
              Amount ({settlementCurrency})
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                borderBottomWidth: 2,
                borderBottomColor: color.border,
                paddingBottom: 8,
                minWidth: 200,
              }}
            >
              <Text
                style={{
                  fontSize: 32,
                  color: color.text,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginRight: 8,
                }}
              >
                {settlementCurrencyObj.symbol}
              </Text>
              <TextInput
                value={amountStr}
                onChangeText={onAmountChange}
                keyboardType="decimal-pad"
                placeholder="0.00"
                placeholderTextColor={color.muted}
                style={{
                  fontSize: 48,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: amountStr ? color.text : color.muted,
                  letterSpacing: -2,
                  textAlign: "center",
                  minWidth: 120,
                  padding: 0,
                }}
                autoFocus
              />
            </View>

            {Math.abs(netBalance) > 0 && (
              <View style={{ flexDirection: "row", gap: 12, marginTop: 24 }}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSetFullBalance();
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: color.border,
                    borderRadius: radius.pill,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Full: {formatAmount(Math.abs(netBalance), preferredCurrencyCode)}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    onSetHalfBalance();
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    backgroundColor: "transparent",
                    borderWidth: 1,
                    borderColor: color.border,
                    borderRadius: radius.pill,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      color: color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Half: {(Math.abs(netBalance) / 2).toFixed(2)}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </View>
    </Animated.View>
  );
}
