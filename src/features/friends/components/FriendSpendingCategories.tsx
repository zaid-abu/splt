import { View } from "react-native";
import { Typography } from "heroui-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { SectionLabel, useUI } from "@/components/ui";
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
  const { color, radius } = useUI();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(100).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <SectionLabel>Spending by Category</SectionLabel>
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
          paddingVertical: 12,
        }}
      >
        {categorySpending.map((item, idx) => (
          <View
            key={item.cat}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingVertical: 12,
              paddingHorizontal: 16,
              borderBottomWidth: idx < categorySpending.length - 1 ? 1 : 0,
              borderBottomColor: color.border,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <CategoryIconBadge category={item.cat as any} size="sm" />
              <Typography
                style={{
                  fontSize: 15,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textTransform: "capitalize",
                }}
              >
                {CATEGORY_LABELS[item.cat] ?? item.cat}
              </Typography>
            </View>
            <Typography
              style={{
                fontSize: 16,
                color: color.text,
                fontFamily: "IBMPlexSans_600SemiBold",
              }}
            >
              {formatAmount(item.amount, currencyCode)}
            </Typography>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}
