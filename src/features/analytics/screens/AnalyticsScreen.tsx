import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  LayoutAnimation,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

import { useAnalytics, type AnalyticsPeriod } from "../hooks/useAnalytics";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { TopExpenses } from "../components/TopExpenses";
import { Text } from "@/components/ui/Text";
import { Spinner } from "@/components/ui/Spinner";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3mo", label: "3 Months" },
  { key: "year", label: "Year" },
  { key: "all", label: "All Time" },
];

export default function AnalyticsScreen() {
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { preferredCurrency, convertCurrency } = useUIStore();

  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const { totalSpent, categoryData, trendData, topExpenses, isLoading, refetch } = useAnalytics(
    currentUser?.id,
    period,
    preferredCurrency.code,
    convertCurrency
  );

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  return (
    <FocusAwareView className="flex-1 bg-background">
      <StatusBar style="light" />
      <View
        className="bg-background border-b border-border"
        style={{ paddingTop: insets.top + 24 }}
      >
        <View className="px-6 mb-6">
          <Text variant="h2">Analytics</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 24, gap: 8, paddingBottom: 24 }}
        >
          {PERIODS.map((p) => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setPeriod(p.key);
                }}
                className={`px-4 py-2 border rounded-xl ${
                  isSelected
                    ? "bg-primary border-primary"
                    : "bg-transparent border-border"
                } active:opacity-70`}
              >
                <Text
                  variant="body-sm"
                  weight="bold"
                  color={isSelected ? "foreground" : "foreground"}
                >
                  {p.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#FAFAFA"
            progressViewOffset={10}
          />
        }
      >
        {isLoading ? (
          <Spinner className="py-10" />
        ) : (
          <View className="px-6 gap-6">
            <View className="py-4">
              <Text variant="label" className="mb-2">
                Total Spent
              </Text>
              <Text variant="h1">
                {formatAmount(totalSpent, preferredCurrency.code)}
              </Text>
            </View>

            <CategoryBreakdown
              data={categoryData}
              totalSpent={totalSpent}
              currencyCode={preferredCurrency.code}
            />
            <TopExpenses expenses={topExpenses} currencyCode={preferredCurrency.code} />
          </View>
        )}
      </ScrollView>
    </FocusAwareView>
  );
}
