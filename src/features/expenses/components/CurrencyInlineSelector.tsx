import type { JSX } from "react";
import {  Pressable, ScrollView, View , Text } from "react-native";
import * as Haptics from "expo-haptics";
import { CURRENCIES } from "@/types";
import { QUICK_CURRENCIES } from "@/features/expenses/constants";
import { styles } from "@/features/expenses/utils/styles";
import type { Currency } from "@/types";

export function CurrencyInlineSelector({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (currency: Currency) => void;
  disabled?: boolean;
}): JSX.Element {
  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value) ?? CURRENCIES[0];
  const quick = CURRENCIES.filter(
    (currency) =>
      QUICK_CURRENCIES.includes(currency.code) || currency.code === selectedCurrency.code
  );

  return (
    <View style={styles.currencySelector}>
      <View style={styles.currencyCurrent}>
        <View style={styles.currencySymbol}>
          <Text style={styles.currencySymbolText}>{selectedCurrency.symbol}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.currencyName}>{selectedCurrency.code}</Text>
          <Text style={styles.currencyMeta} numberOfLines={1}>
            {disabled ? "Locked to group currency" : selectedCurrency.name}
          </Text>
        </View>
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.currencyChipRow}>
          {quick.map((currency) => {
            const active = currency.code === value;
            return (
              <Pressable
                key={currency.code}
                accessibilityRole="button"
                disabled={disabled}
                onPress={() => {
                  Haptics.selectionAsync();
                  onChange(currency);
                }}
                style={({ pressed }) => [
                  styles.currencyChip,
                  active && styles.currencyChipActive,
                  disabled && styles.disabled,
                  pressed && styles.pressed,
                ]}
              >
                <Text
                  style={[styles.currencyChipText, active && styles.currencyChipTextActive]}
                >
                  {currency.code}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
