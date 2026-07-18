import type { JSX } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
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
    if (code === "USD") return "";
    const rate = exchangeRates[code] || exchangeRates["USD"] || 1;
    return `1 USD = ${rate.toLocaleString("en-US", { maximumFractionDigits: code === "IDR" || code === "KRW" || code === "JPY" || code === "VND" ? 0 : 2 })} ${code} · updated today`;
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
                {isHome ? "Home currency" : rateLabel || ""}
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

      <Eyebrow>Conversion preference</Eyebrow>

      <Pressable
        accessibilityRole="switch"
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          minHeight: 52,
        }}
      >
        <View>
          <Text
            style={{ fontFamily: "InstrumentSans_600SemiBold", fontSize: 16, color: color.text }}
          >
            Use expense-date rate
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 13,
              color: color.muted,
              marginTop: 3,
            }}
          >
            Best for trips with changing rates
          </Text>
        </View>
        <View
          style={{
            width: 51,
            height: 31,
            borderRadius: 9999,
            backgroundColor: coral.accent,
            justifyContent: "center",
            paddingHorizontal: 3,
          }}
        >
          <View
            style={{
              width: 25,
              height: 25,
              borderRadius: 9999,
              backgroundColor: color.textInverse,
              alignSelf: "flex-end",
            }}
          />
        </View>
      </Pressable>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 13,
          color: color.muted,
          marginTop: 18,
          lineHeight: 20,
        }}
      >
        Rates are shown before settlement and can be corrected by group members.
      </Text>
    </CoralScreen>
  );
}
