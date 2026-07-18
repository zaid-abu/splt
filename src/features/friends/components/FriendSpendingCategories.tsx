import { View, Text } from "react-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import { useUI } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";
import { EXPENSE_CATEGORIES } from "@/types";

interface CategorySpendingItem {
  cat: string;
  amount: number;
}

interface FriendSpendingCategoriesProps {
  categorySpending: CategorySpendingItem[];
  currencyCode: string;
}

const CATEGORY_LABELS = Object.fromEntries(
  EXPENSE_CATEGORIES.map((category) => [category.key, category.label])
);

export function FriendSpendingCategories({
  categorySpending,
  currencyCode,
}: FriendSpendingCategoriesProps): React.JSX.Element {
  const { color } = useUI();
  const coral = useCoralColors();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Spending by Category</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
          {categorySpending.map((item, idx) => (
            <View key={item.cat}>
              {idx > 0 ? (
                <View
                  style={{
                    height: 1,
                    backgroundColor: color.borderSoft,
                    marginHorizontal: 14,
                  }}
                />
              ) : null}
              <MoneyRow
                avatar={<CategoryIconBadge category={item.cat as any} size="sm" />}
                title={CATEGORY_LABELS[item.cat] ?? item.cat}
                amount={formatAmount(item.amount, currencyCode)}
              />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
