import React, { useCallback, useMemo, useRef, useState } from "react";
import { View, TextInput } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as icons from "lucide-react-native";
import { Typography, PressableFeedback } from "heroui-native";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: Currency) => void;
  label?: string;
}

export function CurrencySelector({
  value,
  onChange,
  label,
}: CurrencySelectorProps): React.JSX.Element {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState("");

  const selectedCurrency = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  const filtered = useMemo(
    () =>
      search.trim()
        ? CURRENCIES.filter(
            (c) =>
              c.code.toLowerCase().includes(search.toLowerCase()) ||
              c.name.toLowerCase().includes(search.toLowerCase())
          )
        : CURRENCIES,
    [search]
  );

  const handlePresentModalPress = useCallback(() => {
    bottomSheetModalRef.current?.present();
  }, []);

  const handleSheetChanges = useCallback((index: number) => {
    if (index === -1) {
      setSearch("");
    }
  }, []);

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
      />
    ),
    []
  );

  return (
    <View className="gap-2">
      {label && (
        <Typography
          type="body-xs"
          className="text-muted-foreground font-bold tracking-widest uppercase ml-2"
        >
          {label}
        </Typography>
      )}

      <PressableFeedback onPress={handlePresentModalPress}>
        <View className="bg-white h-[56px] rounded-[20px] px-4 flex-row items-center justify-between border border-border">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-full bg-secondary items-center justify-center px-1">
              <Typography
                type="body-sm"
                numberOfLines={1}
                adjustsFontSizeToFit
                className="font-bold text-foreground"
              >
                {selectedCurrency.symbol}
              </Typography>
            </View>
            <Typography type="body" className="font-bold text-foreground">
              {selectedCurrency.code} — {selectedCurrency.name}
            </Typography>
          </View>
          <icons.ChevronDown size={20} className="text-muted-foreground" />
        </View>
      </PressableFeedback>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={["70%"]}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#F2F2F6" }}
        handleIndicatorStyle={{ backgroundColor: "#8A8798", width: 40 }}
        style={{ minWidth: "100%", alignSelf: "center" }}
      >
        <View className="flex-1 px-6 pt-2 pb-6">
          <Typography type="h3" className="font-black text-[20px] mb-4 text-foreground text-center">
            Select Currency
          </Typography>

          <View className="mb-4">
            <View className="flex-row items-center bg-white h-[44px] rounded-[16px] px-4 border border-border">
              <icons.Search size={20} color="#8A8798" />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search currencies…"
                className="flex-1 ml-2 font-medium text-[15px] text-foreground"
                placeholderTextColor="#8A8798"
                autoCapitalize="none"
                autoCorrect={false}
              />
              {search.length > 0 && (
                <PressableFeedback onPress={() => setSearch("")} hitSlop={8}>
                  <icons.XCircle size={18} color="#8A8798" />
                </PressableFeedback>
              )}
            </View>
          </View>

          <View className="flex-1 bg-white rounded-[24px] overflow-hidden border border-border">
            <BottomSheetFlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 20 }}
              renderItem={({ item: currency, index: idx }) => {
                const isSelected = currency.code === value;
                return (
                  <PressableFeedback
                    onPress={() => {
                      onChange(currency);
                      bottomSheetModalRef.current?.dismiss();
                    }}
                  >
                    <View
                      className={`flex-row items-center justify-between p-4 ${idx < filtered.length - 1 ? "border-b border-border/50" : ""}`}
                    >
                      <View className="flex-row items-center gap-3 flex-1">
                        <View
                          className={`w-12 h-12 rounded-full items-center justify-center px-1 ${isSelected ? "bg-primary/10" : "bg-secondary"}`}
                        >
                          <Typography
                            type="body-sm"
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className={`font-bold text-center ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {currency.symbol}
                          </Typography>
                        </View>
                        <View className="flex-1 pr-2">
                          <Typography
                            type="body"
                            className={`font-bold ${isSelected ? "text-primary" : "text-foreground"}`}
                          >
                            {currency.code}
                          </Typography>
                          <Typography type="body-sm" className="text-muted-foreground mt-0.5">
                            {currency.name}
                          </Typography>
                        </View>
                      </View>
                      {isSelected && <icons.Check size={20} className="text-primary" />}
                    </View>
                  </PressableFeedback>
                );
              }}
              ListEmptyComponent={
                <View className="p-8 items-center">
                  <Typography type="body" className="text-muted-foreground">
                    No currencies found
                  </Typography>
                </View>
              }
            />
          </View>
        </View>
      </BottomSheetModal>
    </View>
  );
}
