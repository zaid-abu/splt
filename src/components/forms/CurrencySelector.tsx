import React, { useCallback, useMemo, useRef, useState, memo } from "react";
import { View, TextInput, Keyboard } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { twMerge } from "tailwind-merge";

import { Text } from "@/components/primitives/Text";
import { Pressable } from "@/components/primitives/Pressable";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: Currency) => void;
  label?: string;
}

const CurrencyListItem = memo(
  function CurrencyListItem({
    currency,
    isSelected,
    onPress,
  }: {
    currency: Currency;
    isSelected: boolean;
    onPress: (c: Currency) => void;
  }) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(currency);
        }}
      >
        <View
          className={twMerge(
            "flex-row items-center px-4 py-3 border-b border-divider",
            isSelected && "bg-primary-soft",
          )}
        >
          <View className="w-12 h-12 border border-border items-center justify-center mr-3 rounded-xl bg-surface-2">
            <Text className="text-lg font-bold text-foreground" numberOfLines={1} adjustsFontSizeToFit>
              {currency.symbol}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={twMerge("text-base font-bold text-foreground", isSelected && "text-primary")}>
              {currency.code}
            </Text>
            <Text className="text-sm text-muted-foreground">{currency.name}</Text>
          </View>
          {isSelected && <icons.Check size={20} color="#FB923C" />}
        </View>
      </Pressable>
    );
  },
  (prev, next) => prev.isSelected === next.isSelected,
);

export function CurrencySelector({
  value,
  onChange,
  label,
}: CurrencySelectorProps): React.JSX.Element {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState("");

  const selectedCurrency = CURRENCIES.find((c) => c.code === value) ?? CURRENCIES[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q),
    );
  }, [search]);

  const handlePresent = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setTimeout(() => bottomSheetModalRef.current?.present(), 150);
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) setSearch("");
  }, []);

  const handleSelect = useCallback(
    (c: Currency) => {
      onChange(c);
      bottomSheetModalRef.current?.dismiss();
    },
    [onChange],
  );

  return (
    <View className="gap-2">
      {label && <Text className="text-[11px] font-bold tracking-widest uppercase text-muted-foreground">{label}</Text>}
      <Pressable accessibilityRole="button" onPress={handlePresent}>
        <View className="flex-row items-center bg-surface border border-border rounded-xl h-14 px-4">
          <View className="w-10 h-10 border border-border items-center justify-center mr-3 rounded-lg bg-surface-2">
            <Text className="text-base font-bold text-foreground" numberOfLines={1} adjustsFontSizeToFit>
              {selectedCurrency.symbol}
            </Text>
          </View>
          <Text className="flex-1 text-base font-medium text-foreground">
            {selectedCurrency.code} — {selectedCurrency.name}
          </Text>
          <icons.ChevronDown size={20} color="#8E8E93" />
        </View>
      </Pressable>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={["75%", "95%"]}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        backdropComponent={(props) => (
          <BottomSheetBackdrop
            {...props}
            disappearsOnIndex={-1}
            appearsOnIndex={0}
            pressBehavior="close"
            opacity={0.5}
          />
        )}
        backgroundStyle={{ backgroundColor: "#131316", borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: "#3F3F46", width: 40 }}
      >
        <View className="flex-1 px-4 pt-2">
          <View className="flex-row items-center bg-surface-2 border border-border rounded-xl h-12 px-4 mb-3 mx-0">
            <icons.Search size={16} color="#8E8E93" />
            <TextInput
              className="flex-1 ml-2 text-base text-foreground h-full"
              placeholder="Search currency..."
              placeholderTextColor="#8E8E93"
              value={search}
              onChangeText={setSearch}
              autoFocus
              clearButtonMode="while-editing"
            />
          </View>
          <BottomSheetFlatList
            data={filtered}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <CurrencyListItem
                currency={item}
                isSelected={item.code === value}
                onPress={handleSelect}
              />
            )}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 24 }}
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}
