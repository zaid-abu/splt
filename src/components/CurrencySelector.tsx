/**
 * CurrencySelector — HeroUI Select compound component.
 *
 * Select anatomy:
 *   Select > Select.Trigger (Select.Value + Select.TriggerIndicator)
 *          > Select.Portal (Select.Overlay + Select.Content
 *              > Select.Item (Select.ItemLabel + Select.ItemIndicator))
 *
 * Uses `onValueChange` with SelectOption shape { value, label }.
 *
 * @see https://heroui.com/docs/native/components/select.mdx
 */
import { ScrollShadow, SearchField, Select, Separator, Typography } from "heroui-native";
import { LinearGradient } from "expo-linear-gradient";
import type { JSX } from "react";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

interface CurrencySelectorProps {
  value: string; // currency code e.g. "USD"
  onChange: (currency: Currency) => void;
  label?: string;
}

export function CurrencySelector({ value, onChange, label }: CurrencySelectorProps): JSX.Element {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() =>
    search.trim()
      ? CURRENCIES.filter(
          (c) =>
            c.code.toLowerCase().includes(search.toLowerCase()) ||
            c.name.toLowerCase().includes(search.toLowerCase()),
        )
      : CURRENCIES,
    [search],
  );

  const handleValueChange = useCallback(
    (option: any) => {
      const opt = Array.isArray(option) ? option[0] : option;
      if (!opt) return;
      const currency = CURRENCIES.find((c) => c.code === opt.value);
      if (currency) {
        onChange(currency);
        setSearch("");
      }
    },
    [onChange],
  );

  const selectedCurrency = CURRENCIES.find((c) => c.code === value);
  const selectedOption = selectedCurrency
    ? { value: selectedCurrency.code, label: `${selectedCurrency.symbol} ${selectedCurrency.code} — ${selectedCurrency.name}` }
    : undefined;

  return (
    <View className="gap-2">
      {label && (
        <Typography type="body-xs" className="text-muted font-semibold tracking-wider">
          {label.toUpperCase()}
        </Typography>
      )}

      <Select
        value={selectedOption}
        onValueChange={handleValueChange}
        presentation="bottom-sheet"
      >
        <Select.Trigger>
          <Select.Value placeholder="Select currency" />
          <Select.TriggerIndicator />
        </Select.Trigger>

        <Select.Portal>
          <Select.Overlay />
          <Select.Content presentation="bottom-sheet">
            <Select.Close />
            <View className="px-4 pt-2 pb-3">
              <SearchField value={search} onChange={setSearch}>
                <SearchField.Group>
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder="Search currencies…" />
                  <SearchField.ClearButton />
                </SearchField.Group>
              </SearchField>
            </View>
            <ScrollShadow LinearGradientComponent={LinearGradient}>
              <ScrollView showsVerticalScrollIndicator={false}>
                {filtered.map((currency, idx) => (
                  <View key={currency.code}>
                    <Select.Item
                      value={currency.code}
                      label={`${currency.symbol} ${currency.code} — ${currency.name}`}
                    >
                      <Select.ItemLabel />
                      <Select.ItemIndicator />
                    </Select.Item>
                    {idx < filtered.length - 1 && <Separator className="mx-4" />}
                  </View>
                ))}
              </ScrollView>
            </ScrollShadow>
          </Select.Content>
        </Select.Portal>
      </Select>
    </View>
  );
}
