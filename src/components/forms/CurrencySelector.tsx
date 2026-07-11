import React, { memo, useCallback, useMemo, useRef, useState } from "react";
import { Keyboard, StyleSheet, View } from "react-native";
import {
  BottomSheetBackdrop,
  BottomSheetFlatList,
  BottomSheetModal,
  BottomSheetTextInput,
} from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import { PressableFeedback, Typography } from "heroui-native";
import { UI } from "@/components/ui/native-ui";

import type { Currency } from "@/types";
import { CURRENCIES } from "@/types";

const POPULAR_CODES = ["USD", "EUR", "GBP", "INR", "JPY"];

interface CurrencySelectorProps {
  value: string;
  onChange: (currency: Currency) => void;
  label?: string;
}

type CurrencyListEntry =
  | { key: string; type: "section"; label: string }
  | { key: string; type: "currency"; currency: Currency; emphasis?: "current" | "popular" };

const CurrencyListItem = memo(
  ({
    currency,
    isSelected,
    emphasis,
    onPress,
  }: {
    currency: Currency;
    isSelected: boolean;
    emphasis?: "current" | "popular";
    onPress: (currency: Currency) => void;
  }) => {
    const isCurrent = emphasis === "current";

    return (
      <PressableFeedback
        accessibilityRole="button"
        onPress={() => {
          Haptics.selectionAsync();
          onPress(currency);
        }}
      >
        <View
          style={[
            styles.itemContainer,
            isCurrent && styles.itemCurrent,
            isSelected && styles.itemSelected,
          ]}
        >
          <View style={styles.itemLeft}>
            <View
              style={[
                styles.symbolShell,
                isCurrent && styles.symbolShellCurrent,
                isSelected && styles.symbolShellSelected,
              ]}
            >
              <Typography style={[styles.symbolText, isSelected && styles.symbolTextSelected]}>
                {currency.symbol}
              </Typography>
            </View>

            <View style={styles.textContainer}>
              <View style={styles.codeRow}>
                <Typography style={styles.codeText}>{currency.code}</Typography>
                {isCurrent && !isSelected ? (
                  <View style={styles.metaPill}>
                    <Typography style={styles.metaPillText}>Current</Typography>
                  </View>
                ) : null}
                {emphasis === "popular" && !isCurrent && !isSelected ? (
                  <View style={styles.metaPill}>
                    <Typography style={styles.metaPillText}>Popular</Typography>
                  </View>
                ) : null}
              </View>
              <Typography style={styles.nameText}>{currency.name}</Typography>
            </View>
          </View>

          {isSelected ? (
            <View style={styles.selectedBadge}>
              <icons.Check size={14} color="#FFFFFF" strokeWidth={2.4} />
            </View>
          ) : (
            <icons.ChevronRight size={18} color={UI.color.muted} strokeWidth={1.75} />
          )}
        </View>
      </PressableFeedback>
    );
  },
  (prevProps, nextProps) =>
    prevProps.isSelected === nextProps.isSelected && prevProps.emphasis === nextProps.emphasis
);

CurrencyListItem.displayName = "CurrencyListItem";

export function CurrencySelector({
  value,
  onChange,
  label,
}: CurrencySelectorProps): React.JSX.Element {
  const bottomSheetModalRef = useRef<BottomSheetModal>(null);
  const [search, setSearch] = useState("");

  const selectedCurrency = CURRENCIES.find((currency) => currency.code === value) ?? CURRENCIES[0];

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return CURRENCIES;

    return CURRENCIES.filter((currency) => {
      const haystack = [currency.code, currency.name, currency.symbol].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [search]);

  const listData = useMemo<CurrencyListEntry[]>(() => {
    if (search.trim()) {
      return [
        { key: "section-results", type: "section", label: "Results" },
        ...filteredCurrencies.map((currency) => ({
          key: currency.code,
          type: "currency" as const,
          currency,
          emphasis: currency.code === selectedCurrency.code ? "current" : undefined,
        })),
      ];
    }

    const popularSet = new Set(POPULAR_CODES);
    const currentSection = [
      {
        key: selectedCurrency.code,
        type: "currency" as const,
        currency: selectedCurrency,
        emphasis: "current" as const,
      },
    ];
    const popularSection = CURRENCIES.filter(
      (currency) => popularSet.has(currency.code) && currency.code !== selectedCurrency.code
    ).map((currency) => ({
      key: `popular-${currency.code}`,
      type: "currency" as const,
      currency,
      emphasis: "popular" as const,
    }));
    const allSection = CURRENCIES.filter(
      (currency) => currency.code !== selectedCurrency.code && !popularSet.has(currency.code)
    ).map((currency) => ({
      key: `all-${currency.code}`,
      type: "currency" as const,
      currency,
    }));

    return [
      { key: "section-current", type: "section", label: "Current currency" },
      ...currentSection,
      { key: "section-popular", type: "section", label: "Popular picks" },
      ...popularSection,
      { key: "section-all", type: "section", label: "All currencies" },
      ...allSection,
    ];
  }, [filteredCurrencies, search, selectedCurrency]);

  const handlePresentModalPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setTimeout(() => {
      bottomSheetModalRef.current?.present();
    }, 150);
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
        opacity={0.4}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSelect = useCallback(
    (currency: Currency) => {
      onChange(currency);
      bottomSheetModalRef.current?.dismiss();
    },
    [onChange]
  );

  const renderItem = useCallback(
    ({ item }: { item: CurrencyListEntry }) => {
      if (item.type === "section") {
        return <Typography style={styles.sectionLabel}>{item.label}</Typography>;
      }

      return (
        <CurrencyListItem
          currency={item.currency}
          isSelected={item.currency.code === value}
          emphasis={item.emphasis}
          onPress={handleSelect}
        />
      );
    },
    [handleSelect, value]
  );

  return (
    <View style={styles.container}>
      {label ? <Typography style={styles.label}>{label}</Typography> : null}

      <PressableFeedback accessibilityRole="button" onPress={handlePresentModalPress}>
        <View style={styles.triggerContainer}>
          <View style={styles.triggerLeft}>
            <View style={styles.triggerSymbolShell}>
              <Typography style={styles.triggerSymbolText}>{selectedCurrency.symbol}</Typography>
            </View>

            <View style={styles.triggerTextWrap}>
              <Typography style={styles.triggerCodeText}>{selectedCurrency.code}</Typography>
              <Typography numberOfLines={1} style={styles.triggerNameText}>
                {selectedCurrency.name}
              </Typography>
            </View>
          </View>

          <View style={styles.triggerAdornment}>
            <Typography style={styles.triggerChangeText}>Change</Typography>
            <icons.ChevronDown size={18} color={UI.color.muted} strokeWidth={1.75} />
          </View>
        </View>
      </PressableFeedback>

      <BottomSheetModal
        ref={bottomSheetModalRef}
        index={0}
        snapPoints={["82%"]}
        enableDynamicSizing={false}
        onChange={handleSheetChanges}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: UI.color.border, width: 40 }}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        android_keyboardInputMode="adjustResize"
      >
        <View style={styles.modalContent}>
          <View style={styles.headerBlock}>
            <Typography style={styles.modalTitle}>Select currency</Typography>
            <Typography style={styles.modalSubtitle}>
              This sets the default money format for the group or expense.
            </Typography>
          </View>

          <View style={styles.searchCard}>
            <icons.Search size={18} color={UI.color.muted} strokeWidth={1.75} />
            <BottomSheetTextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search by code, name, or symbol"
              placeholderTextColor={UI.color.muted}
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              style={styles.searchInput}
            />
            {search.length > 0 ? (
              <PressableFeedback
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSearch("")}
              >
                <icons.XCircle size={18} color={UI.color.muted} strokeWidth={1.75} />
              </PressableFeedback>
            ) : null}
          </View>

          <BottomSheetFlatList
            data={listData}
            keyExtractor={(item) => item.key}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <Typography style={styles.emptyTitle}>No currencies found</Typography>
                <Typography style={styles.emptyText}>
                  Try a different code, name, or symbol.
                </Typography>
              </View>
            }
          />
        </View>
      </BottomSheetModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  label: {
    marginLeft: 4,
    fontSize: 11,
    letterSpacing: 1.2,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    textTransform: "uppercase",
  },
  triggerContainer: {
    minHeight: 72,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.color.border,
    backgroundColor: UI.color.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  triggerLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  triggerSymbolShell: {
    width: 52,
    height: 48,
    borderRadius: 18,
    backgroundColor: UI.color.control,
    borderWidth: 1,
    borderColor: UI.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  triggerSymbolText: {
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  triggerTextWrap: {
    flex: 1,
    gap: 2,
  },
  triggerCodeText: {
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  triggerNameText: {
    fontSize: 14,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_500Medium",
  },
  triggerAdornment: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  triggerChangeText: {
    fontSize: 13,
    color: UI.color.brand,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
  },
  headerBlock: {
    marginBottom: 18,
  },
  modalTitle: {
    fontSize: 24,
    color: UI.color.text,
    fontFamily: "Sora_600SemiBold",
  },
  modalSubtitle: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 20,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_500Medium",
  },
  searchCard: {
    height: 52,
    marginBottom: 18,
    paddingHorizontal: 16,
    borderRadius: UI.radius.pill,
    borderWidth: 1,
    borderColor: UI.color.border,
    backgroundColor: UI.color.control,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 0,
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_500Medium",
  },
  listContent: {
    paddingBottom: 40,
  },
  sectionLabel: {
    marginTop: 8,
    marginBottom: 10,
    fontSize: 11,
    letterSpacing: 1.2,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    textTransform: "uppercase",
  },
  itemContainer: {
    minHeight: 76,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.color.border,
    backgroundColor: UI.color.surface,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  itemCurrent: {
    backgroundColor: "#F7F1EA",
  },
  itemSelected: {
    borderColor: UI.color.text,
    backgroundColor: "#F0ECE7",
  },
  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  symbolShell: {
    width: 52,
    height: 48,
    borderRadius: 18,
    backgroundColor: UI.color.control,
    borderWidth: 1,
    borderColor: UI.color.border,
    alignItems: "center",
    justifyContent: "center",
  },
  symbolShellCurrent: {
    backgroundColor: "#F4E8DC",
  },
  symbolShellSelected: {
    backgroundColor: UI.color.text,
    borderColor: UI.color.text,
  },
  symbolText: {
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  symbolTextSelected: {
    color: "#FFFFFF",
  },
  textContainer: {
    flex: 1,
    paddingRight: 8,
  },
  codeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flexWrap: "wrap",
  },
  codeText: {
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  nameText: {
    marginTop: 3,
    fontSize: 14,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_500Medium",
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: UI.radius.pill,
    backgroundColor: UI.color.control,
    borderWidth: 1,
    borderColor: UI.color.border,
  },
  metaPillText: {
    fontSize: 11,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  selectedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: UI.color.text,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    marginTop: 8,
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderRadius: UI.radius.lg,
    borderWidth: 1,
    borderColor: UI.color.border,
    backgroundColor: UI.color.surface,
    alignItems: "center",
  },
  emptyTitle: {
    fontSize: 16,
    color: UI.color.text,
    fontFamily: "IBMPlexSans_600SemiBold",
  },
  emptyText: {
    marginTop: 6,
    fontSize: 14,
    color: UI.color.muted,
    fontFamily: "IBMPlexSans_500Medium",
    textAlign: "center",
  },
});
