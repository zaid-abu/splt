import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { Check, ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUI } from "@/components/ui";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES, type Currency } from "@/types";

export default function CurrenciesScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const exchangeRates = useUIStore((s) => s.exchangeRates);
  const setCurrency = useUIStore((s) => s.setCurrency);

  const handleSelectCurrency = (currency: Currency) => {
    Haptics.selectionAsync();
    setCurrency(currency);
  };

  const getExchangeLabel = (code: string): string => {
    if (code === "USD") return "Base currency for reference rates";
    const rate = exchangeRates[code] || exchangeRates["USD"] || 1;
    return `1 USD = ${rate.toLocaleString("en-US", {
      maximumFractionDigits:
        code === "IDR" || code === "KRW" || code === "JPY" || code === "VND" ? 0 : 2,
    })} ${code}`;
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Currencies" onBack={() => router.canGoBack() && router.back()} />

      <LargeTitle>Travel without conversion math.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: color.muted,
          lineHeight: 22,
          marginBottom: 8,
        }}
      >
        Original amounts stay intact. Group balances use the selected home currency.
      </Text>

      <Eyebrow>Available currencies</Eyebrow>

      {CURRENCIES.map((c) => {
        const isHome = preferredCurrency.code === c.code;
        const rateLabel = getExchangeLabel(c.code);
        return (
          <Pressable
            key={c.code}
            accessibilityRole="button"
            accessibilityLabel={`${c.code} · ${c.name}${isHome ? ", home currency" : ""}`}
            accessibilityState={{ selected: isHome }}
            onPress={() => handleSelectCurrency(c)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              minHeight: 68,
              paddingVertical: 10,
              gap: 12,
              opacity: pressed ? 0.65 : 1,
            })}
          >
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                backgroundColor: isHome ? coral.accentSoft : color.surface,
                borderWidth: isHome ? 1 : undefined,
                borderColor: isHome ? coral.accent : undefined,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: isHome ? coral.accent : color.text,
                }}
              >
                {c.symbol}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_600SemiBold",
                  fontSize: 16,
                  color: color.text,
                }}
              >
                {c.code} · {c.name}
              </Text>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 13,
                  color: color.muted,
                  marginTop: 3,
                }}
              >
                {isHome ? "Home currency" : rateLabel}
              </Text>
            </View>
            {isHome ? (
              <Check size={22} color={coral.accent} strokeWidth={2} />
            ) : (
              <ChevronRight size={20} color={color.muted} strokeWidth={1.5} />
            )}
          </Pressable>
        );
      })}
    </CoralScreen>
  );
}
