import type { JSX } from "react";
import { View, Text, Pressable } from "react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { ChevronRight } from "lucide-react-native";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { useCoralColors } from "@/components/coral/useCoral";
import { useUIStore } from "@/store/useUIStore";
import { CURRENCIES, type Currency } from "@/types";

export default function CurrenciesScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
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

  const availableCurrencies = CURRENCIES.filter((c) => c.code !== preferredCurrency.code);
  const homeLabel = `${preferredCurrency.code} - used for overall balances`;

  return (
    <CoralScreen>
      <CoralTopBar title="Currencies" onBack={() => router.canGoBack() && router.back()} />

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 30,
          color: coral.foreground,
          letterSpacing: -0.035 * 30,
          lineHeight: 30 * 1.08,
          marginBottom: 2,
        }}
      >
        Currencies
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 14,
          color: coral.muted,
          lineHeight: 20,
          marginBottom: 16,
        }}
      >
        Choose your home currency and understand when conversion rates were last refreshed.
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: coral.foreground,
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        Home currency
      </Text>

      <View
        style={{
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            minHeight: 64,
            paddingVertical: 10,
            paddingHorizontal: 12,
            gap: 12,
          }}
        >
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              backgroundColor: coral.accentSoft,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 16,
                color: coral.accent,
              }}
            >
              {preferredCurrency.symbol}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
              }}
              numberOfLines={1}
            >
              {preferredCurrency.name}
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                color: coral.muted,
                marginTop: 3,
              }}
              numberOfLines={1}
            >
              {homeLabel}
            </Text>
          </View>
          <View
            style={{
              backgroundColor: coral.positiveSoft,
              borderRadius: 999,
              paddingHorizontal: 9,
              paddingVertical: 4,
              minHeight: 30,
              justifyContent: "center",
            }}
          >
            <Text
              style={{
                fontFamily: "IBMPlexMono_600SemiBold",
                fontSize: 11,
                color: coral.positive,
              }}
            >
              Selected
            </Text>
          </View>
        </View>
      </View>

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: coral.foreground,
          marginBottom: 8,
          paddingHorizontal: 2,
        }}
      >
        Available currencies
      </Text>

      <View
        style={{
          backgroundColor: coral.surface,
          borderWidth: 1,
          borderColor: coral.border,
          borderRadius: 16,
          overflow: "hidden",
        }}
      >
        {availableCurrencies.map((c, idx) => {
          const rateLabel = getExchangeLabel(c.code);
          return (
            <Pressable
              key={c.code}
              accessibilityRole="button"
              accessibilityLabel={`${c.code} · ${c.name}`}
              onPress={() => handleSelectCurrency(c)}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                minHeight: 64,
                paddingVertical: 10,
                paddingHorizontal: 12,
                gap: 12,
                opacity: pressed ? 0.65 : 1,
                borderBottomWidth: idx < availableCurrencies.length - 1 ? 1 : 0,
                borderBottomColor: coral.border,
              })}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 14,
                  backgroundColor: coral.avatarSoft,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 16,
                    color: coral.avatarInk,
                  }}
                >
                  {c.symbol}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_600SemiBold",
                    fontSize: 14,
                    color: coral.foreground,
                  }}
                  numberOfLines={1}
                >
                  {c.code} · {c.name}
                </Text>
                <Text
                  style={{
                    fontFamily: "InstrumentSans_400Regular",
                    fontSize: 12,
                    color: coral.muted,
                    marginTop: 3,
                  }}
                  numberOfLines={1}
                >
                  {rateLabel}
                </Text>
              </View>
              <ChevronRight size={20} color={coral.muted} strokeWidth={1.5} />
            </Pressable>
          );
        })}
      </View>
    </CoralScreen>
  );
}
