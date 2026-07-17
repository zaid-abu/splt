import React, { useState, useCallback } from "react";
import { View, ScrollView, Pressable, LayoutAnimation, RefreshControl } from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types";
import { SpendingSummaryCard } from "../components/SpendingSummaryCard";
import { TrendChart } from "../components/TrendChart";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { TopExpenses } from "../components/TopExpenses";

import { useUI, ScreenHeader } from "@/components/ui";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3mo", label: "3 Months" },
  { key: "year", label: "Year" },
  { key: "all", label: "All Time" },
];

export default function AnalyticsScreen() {
  const { color, space, radius } = useUI();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const {
    totalSpent,
    expenseCount,
    categoryData,
    trendData,
    topExpenses,
    isLoading,
    isError,
    refetch,
  } = useAnalytics(currentUser?.id, period, preferredCurrency.code, convertCurrency);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRefreshing(true);
    try {
      await refetch();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleLogExpense = () => router.push("/expense/new");

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />
      <View
        style={{
          paddingTop: insets.top + 18,
          backgroundColor: color.bg,
          zIndex: 10,
        }}
      >
        <ScreenHeader title="Analytics" onBackPress={() => router.back()} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: space.page, gap: 8, paddingBottom: 18 }}
        >
          {PERIODS.map((p) => {
            const isSelected = period === p.key;
            return (
              <Pressable
                key={p.key}
                onPress={() => {
                  Haptics.selectionAsync();
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setPeriod(p.key);
                }}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: isSelected ? color.text : color.control,
                  borderWidth: 1,
                  borderColor: isSelected ? color.text : color.border,
                  borderRadius: 999,
                }}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: isSelected ? color.textInverse : color.muted,
                  }}
                >
                  {p.label}
                </Typography>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 6 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={color.text}
            progressViewOffset={10}
          />
        }
      >
        {isLoading ? (
          <View style={{ paddingHorizontal: space.page, gap: 24 }}>
            <Skeleton height={120} radius={16} />
            <Skeleton height={200} radius={16} />
            <Skeleton height={280} radius={16} />
            <Skeleton height={200} radius={16} />
          </View>
        ) : isError ? (
          <View style={{ paddingVertical: 40 }}>
            <ErrorState
              title="Couldn't load analytics"
              message="Check your connection and try again."
              onRetry={onRefresh}
            />
          </View>
        ) : (
          <View style={{ paddingHorizontal: space.page, gap: 24 }}>
            <SpendingSummaryCard
              totalSpent={totalSpent}
              expenseCount={expenseCount}
              categoryData={categoryData}
              currencyCode={preferredCurrency.code}
            />
            <TrendChart trendData={trendData} onLogExpense={handleLogExpense} />
            <CategoryBreakdown
              data={categoryData}
              totalSpent={totalSpent}
              currencyCode={preferredCurrency.code}
              onLogExpense={handleLogExpense}
            />
            <TopExpenses
              expenses={topExpenses}
              currencyCode={preferredCurrency.code}
              onLogExpense={handleLogExpense}
            />
          </View>
        )}
      </ScrollView>
    </FocusAwareView>
  );
}
