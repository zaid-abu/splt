import type { JSX } from "react";
import { Pressable, ScrollView, View } from "react-native";
import { Typography } from "heroui-native";
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
          <Typography style={styles.currencySymbolText}>{selectedCurrency.symbol}</Typography>
        </View>
        <View style={{ flex: 1 }}>
          <Typography style={styles.currencyName}>{selectedCurrency.code}</Typography>
          <Typography style={styles.currencyMeta} numberOfLines={1}>
            {disabled ? "Locked to group currency" : selectedCurrency.name}
          </Typography>
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
                <Typography
                  style={[styles.currencyChipText, active && styles.currencyChipTextActive]}
                >
                  {currency.code}
                </Typography>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
