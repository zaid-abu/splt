import type { JSX } from "react";
import {  View, Pressable, Text , Switch } from "react-native";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useUI } from "@/components/ui";
import { Eyebrow, useCoralColors } from "@/components/coral";
import { CURRENCIES } from "@/types";
import type { SplitMethod } from "@/types";

export interface GroupFinanceSectionProps {
  currencyCode: string;
  onCurrencyChange: (code: string) => void;
  defaultSplitMethod: SplitMethod;
  onDefaultSplitMethodChange: (method: SplitMethod) => void;
  simplifyDebts: boolean;
  onSimplifyDebtsChange: (v: boolean) => void;
}

export function GroupFinanceSection({
  currencyCode,
  onCurrencyChange,
  defaultSplitMethod,
  onDefaultSplitMethodChange,
  simplifyDebts,
  onSimplifyDebtsChange,
}: GroupFinanceSectionProps): JSX.Element {
  const { color, radius } = useUI();
  const coral = useCoralColors();
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  return (
    <View style={{ marginBottom: 28 }}>
      <Eyebrow style={{ marginTop: 0 }}>Finance</Eyebrow>
      <View
        style={{
          backgroundColor: coral.surface,
          borderRadius: 16,
          borderWidth: 1,
          borderColor: coral.border,
          overflow: "hidden",
          padding: 20,
        }}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: color.border,
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <CurrencySelector
            label="Base Currency"
            value={currency.code}
            onChange={(c) => onCurrencyChange(c.code)}
          />
        </View>

        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: color.border,
            paddingBottom: 20,
            marginBottom: 20,
          }}
        >
          <Text
            style={{
              fontSize: 16,
              color: color.text,
              fontFamily: "InstrumentSans_600SemiBold",
              marginBottom: 12,
            }}
          >
            Default Split Method
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            {(["equal", "custom", "percentage"] as const).map((method) => {
              const active = defaultSplitMethod === method;
              return (
                <Pressable
                  key={method}
                  onPress={() => onDefaultSplitMethodChange(method)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 42,
                    paddingHorizontal: 12,
                    borderRadius: radius.pill,
                    backgroundColor: active ? color.text : color.control,
                    borderWidth: 1,
                    borderColor: active ? color.text : color.border,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.72 : 1,
                  })}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontFamily: "InstrumentSans_600SemiBold",
                      color: active ? color.textInverse : color.text,
                      textTransform: "capitalize",
                    }}
                  >
                    {method}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBottom: 20,
          }}
        >
          <View style={{ flex: 1, marginRight: 24 }}>
            <Text
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "InstrumentSans_600SemiBold",
                marginBottom: 4,
              }}
            >
              Simplify Debts
            </Text>
            <Text
              style={{
                fontSize: 14,
                color: color.muted,
                fontFamily: "InstrumentSans_400Regular",
                lineHeight: 20,
              }}
            >
              Combine debts to reduce the number of payments between members.
            </Text>
          </View>
          <Switch value={simplifyDebts} onValueChange={onSimplifyDebtsChange} />
        </View>
      </View>
    </View>
  );
}
