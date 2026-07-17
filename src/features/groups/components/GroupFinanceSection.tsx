import type { JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography, Switch } from "heroui-native";
import { CurrencySelector } from "@/components/forms/CurrencySelector";
import { useUI, SectionLabel } from "@/components/ui";
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
  const currency = CURRENCIES.find((c) => c.code === currencyCode) ?? CURRENCIES[0];

  return (
    <>
      <SectionLabel>Finance</SectionLabel>

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
        <Typography
          style={{
            fontSize: 16,
            color: color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            marginBottom: 12,
          }}
        >
          Default Split Method
        </Typography>
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
                <Typography
                  style={{
                    fontSize: 13,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: active ? color.textInverse : color.text,
                    textTransform: "capitalize",
                  }}
                >
                  {method}
                </Typography>
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
          <Typography
            style={{
              fontSize: 16,
              color: color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 4,
            }}
          >
            Simplify Debts
          </Typography>
          <Typography
            style={{
              fontSize: 14,
              color: color.muted,
              fontFamily: "IBMPlexSans_400Regular",
              lineHeight: 20,
            }}
          >
            Combine debts to reduce the number of payments between members.
          </Typography>
        </View>
        <Switch isSelected={simplifyDebts} onSelectedChange={onSimplifyDebtsChange} />
      </View>
    </>
  );
}
