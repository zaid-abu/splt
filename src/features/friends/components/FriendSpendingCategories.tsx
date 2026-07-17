import { View } from "react-native";
import { Typography } from "heroui-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { GlassSection, GlassRow, useUI } from "@/components/ui";
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

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <GlassSection title="Spending by Category">
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
            <GlassRow
              icon={<CategoryIconBadge category={item.cat as any} size="sm" />}
              title={CATEGORY_LABELS[item.cat] ?? item.cat}
              end={
                <Typography
                  style={{
                    fontSize: 16,
                    color: color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(item.amount, currencyCode)}
                </Typography>
              }
            />
          </View>
        ))}
      </GlassSection>
    </Animated.View>
  );
}
