import type { JSX } from "react";
import { View, Pressable, TextInput } from "react-native";
import { Typography } from "heroui-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useUI } from "@/components/ui";
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

  return (
    <Animated.View
      entering={FadeInDown.duration(400)}
      style={{ alignItems: "center", marginVertical: 32, paddingHorizontal: 24 }}
    >
      <Typography
        style={{
          fontSize: 14,
          color: color.muted,
          fontFamily: "IBMPlexSans_500Medium",
          marginBottom: 8,
        }}
      >
        Amount ({settlementCurrency})
      </Typography>

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
        <Typography
          style={{
            fontSize: 32,
            color: color.text,
            fontFamily: "IBMPlexSans_500Medium",
            marginRight: 8,
          }}
        >
          {settlementCurrencyObj.symbol}
        </Typography>
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
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.border,
              borderRadius: radius.pill,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 13,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Full: {formatAmount(Math.abs(netBalance), preferredCurrencyCode)}
            </Typography>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.selectionAsync();
              onSetHalfBalance();
            }}
            style={({ pressed }) => ({
              paddingHorizontal: 20,
              paddingVertical: 10,
              backgroundColor: color.surface,
              borderWidth: 1,
              borderColor: color.border,
              borderRadius: radius.pill,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Typography
              style={{
                fontSize: 13,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              Half: {(Math.abs(netBalance) / 2).toFixed(2)}
            </Typography>
          </Pressable>
        </View>
      )}
    </Animated.View>
  );
}
