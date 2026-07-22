import type { JSX } from "react";
import {  Pressable, ScrollView, View , Text } from "react-native";
import * as Haptics from "expo-haptics";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { EXPENSE_CATEGORIES } from "@/types";
import { styles } from "@/features/expenses/utils/styles";
import type { ExpenseCategory } from "@/types";

export function CategorySelector({
  value,
  onChange,
}: {
  value: ExpenseCategory;
  onChange: (value: ExpenseCategory) => void;
}): JSX.Element {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.categoryRow}>
        {EXPENSE_CATEGORIES.map((category) => {
          const active = value === category.key;
          return (
            <Pressable
              key={category.key}
              accessibilityRole="button"
              onPress={() => {
                Haptics.selectionAsync();
                onChange(category.key);
              }}
              style={({ pressed }) => [
                styles.categoryChip,
                active && styles.categoryChipActive,
                pressed && styles.pressed,
              ]}
            >
              <CategoryIconBadge category={category.key} size="sm" />
              <Text
                style={[styles.categoryChipText, active && styles.categoryChipTextActive]}
              >
                {category.label.replace(" & Drink", "")}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}
