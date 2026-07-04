import React, { useCallback, useMemo, useRef, useState, memo } from "react";
import { View, TextInput, StyleSheet, Keyboard } from "react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { Typography, PressableFeedback } from "heroui-native";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

// --- Design Tokens ---
const BG = "#F5F0EB";
const BRAND = "#8C7A6B";
const SURFACE = "#FFFFFF";
const BORDER = "#E8E4DF";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#8A8782";

// --- Props ---
interface CurrencySelectorProps {
  value: string;
  onChange: (currency: Currency) => void;
  label?: string;
}

// --- Memoized List Item ---
// Extremely important for performance when rendering hundreds of currencies.
const CurrencyListItem = memo(
  ({
    currency,
    isSelected,
    onPress,
  }: {
    currency: Currency;
    isSelected: boolean;
    onPress: (c: Currency) => void;
  }) => {
    return (
      <PressableFeedback
        accessibilityRole="button"
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress(currency);
        }}
      >
        <View style={[styles.itemContainer, isSelected && styles.itemContainerSelected]}>
          <View style={styles.itemLeft}>
            <View style={[styles.symbolBox, isSelected && styles.symbolBoxSelected]}>
              <Typography
                style={styles.symbolText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {currency.symbol}
              </Typography>
            </View>
            <View style={styles.textContainer}>
              <Typography style={[styles.codeText, isSelected && styles.textSelected]}>
                {currency.code}
              </Typography>
              <Typography style={styles.nameText}>{currency.name}</Typography>
            </View>
          </View>
          {isSelected && <icons.Check size={20} color={TEXT_PRIMARY} />}
        </View>
      </PressableFeedback>
    );
  },
  (prevProps, nextProps) => prevProps.isSelected === nextProps.isSelected
);

// --- Main Component ---
export function CurrencySelector({
  value,
  onChange,
  label,
}: CurrencySelectorProps): React.JSX.Element {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState("");

  const selectedCurrency = CURRENCIES.find((c) => c.code === value) || CURRENCIES[0];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter(
      (c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q)
    );
  }, [search]);

  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
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

  const handleSelect = useCallback(
    (c: Currency) => {
      onChange(c);
      bottomSheetModalRef.current?.dismiss();
    },
    [onChange]
  );

  return (
    <View style={styles.container}>
      {label && (
        <Typography style={styles.label}>
          {label}
        </Typography>
      )}

      <PressableFeedback accessibilityRole="button" onPress={handlePresentModalPress}>
        <View style={styles.triggerContainer}>
          <View style={styles.triggerLeft}>
            <View style={styles.triggerSymbolBox}>
              <Typography
                style={styles.triggerSymbolText}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {selectedCurrency.symbol}
              </Typography>
            </View>
            <Typography style={styles.triggerText}>
              {selectedCurrency.code} — {selectedCurrency.name}
            </Typography>
          </View>
          <icons.ChevronDown size={20} color={TEXT_SECONDARY} />
        </View>
      </PressableFeedback>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={["75%", "95%"]}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: BORDER, width: 40 }}
      >
        <View style={styles.modalContent}>
          <Typography style={styles.modalTitle}>
            Select Currency
          </Typography>

          <View style={styles.searchContainer}>
            <View style={styles.searchBox}>
              <icons.Search size={20} color={TEXT_SECONDARY} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search currencies…"
                placeholderTextColor={TEXT_SECONDARY}
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.searchInput}
              />
              {search.length > 0 && (
                <PressableFeedback
                  accessibilityRole="button"
                  onPress={() => setSearch("")}
                  hitSlop={8}
                >
                  <icons.XCircle size={18} color={TEXT_SECONDARY} />
                </PressableFeedback>
              )}
            </View>
          </View>

          <View style={styles.listWrapper}>
            <BottomSheetFlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={true}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              maxToRenderPerBatch={20}
              windowSize={5}
              contentContainerStyle={{ paddingBottom: 40 }}
              renderItem={({ item }) => (
                <CurrencyListItem
                  currency={item}
                  isSelected={item.code === value}
                  onPress={handleSelect}
                />
              )}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Typography style={styles.emptyText}>
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

// --- Styles (Bypassing Tailwind for maximum performance) ---
const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    fontSize: 12,
    color: TEXT_SECONDARY,
    fontFamily: "PlusJakartaSans_700Bold",
    textTransform: "uppercase",
    letterSpacing: 1.5,
    marginLeft: 8,
  },
  triggerContainer: {
    backgroundColor: SURFACE,
    height: 56,
    borderRadius: 0,
    borderWidth: 1,
    borderColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  triggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  triggerSymbolBox: {
    width: 32,
    height: 32,
    borderRadius: 0,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  triggerSymbolText: {
    fontSize: 14,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: TEXT_PRIMARY,
  },
  triggerText: {
    fontSize: 15,
    fontFamily: "PlusJakartaSans_700Bold",
    color: TEXT_PRIMARY,
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  modalTitle: {
    fontSize: 24,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: TEXT_PRIMARY,
    marginBottom: 24,
  },
  searchContainer: {
    marginBottom: 16,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SURFACE,
    height: 48,
    borderRadius: 0,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEXT_PRIMARY,
  },
  listWrapper: {
    flex: 1,
    backgroundColor: SURFACE,
    borderWidth: 1,
    borderColor: BORDER,
    borderBottomWidth: 0, 
  },
  // List Item Styles
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    backgroundColor: SURFACE,
  },
  itemContainerSelected: {
    backgroundColor: BG,
  },
  itemLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  symbolBox: {
    width: 44,
    height: 44,
    borderRadius: 0,
    backgroundColor: BG,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1,
    borderColor: BORDER,
  },
  symbolBoxSelected: {
    backgroundColor: BRAND,
    borderColor: BRAND,
  },
  symbolText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_800ExtraBold",
    color: TEXT_PRIMARY,
  },
  textContainer: {
    flex: 1,
    paddingRight: 16,
  },
  codeText: {
    fontSize: 16,
    fontFamily: "PlusJakartaSans_700Bold",
    color: TEXT_PRIMARY,
  },
  nameText: {
    fontSize: 13,
    fontFamily: "PlusJakartaSans_500Medium",
    color: TEXT_SECONDARY,
    marginTop: 2,
  },
  textSelected: {
    color: TEXT_PRIMARY,
  },
  emptyContainer: {
    padding: 32,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 15,
    color: TEXT_SECONDARY,
    fontFamily: "PlusJakartaSans_500Medium",
  },
});
