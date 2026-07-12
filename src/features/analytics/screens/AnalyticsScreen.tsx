import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  LayoutAnimation,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Typography } from "heroui-native";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { BarChart } from "react-native-gifted-charts";
import * as icons from "lucide-react-native";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { Skeleton } from "@/components/ui/Skeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { TopExpenses } from "../components/TopExpenses";

import { Card } from "@/components/ui/Card";
import { UI, SectionLabel, ScreenHeader, TYPO } from "@/components/ui/native-ui";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
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

  const averageExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
  const biggestCategory = categoryData[0];
  const biggestCategoryLabel = biggestCategory
    ? biggestCategory.category.charAt(0).toUpperCase() + biggestCategory.category.slice(1)
    : "None";

  const barChartData = useMemo(() => {
    const labelEvery = Math.max(1, Math.ceil(trendData.length / 5));
    return trendData.map((point, index) => ({
      value: point.value,
      label:
        index === 0 ||
        index === trendData.length - 1 ||
        index % labelEvery === 0 ||
        trendData.length <= 5
          ? point.label
          : "",
    }));
  }, [trendData]);

  const chartWidth = Math.max(220, width - UI.space.page * 2 - 56);
  const barSpacing = Math.max(8, (chartWidth - 40) / Math.max(1, barChartData.length) - 24);

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <ThemedStatusBar />
      <View
        style={{
          paddingTop: insets.top + 18,
          backgroundColor: UI.color.bg,
          zIndex: 10,
        }}
      >
        <ScreenHeader title="Analytics" onBackPress={() => router.back()} />

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: UI.space.page,
            gap: 8,
            paddingBottom: 18,
          }}
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
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                style={({ pressed }) => ({
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  backgroundColor: isSelected ? UI.color.text : UI.color.control,
                  borderWidth: 1,
                  borderColor: isSelected ? UI.color.text : UI.color.border,
                  borderRadius: UI.radius.pill,
                  opacity: pressed ? 0.72 : 1,
                })}
              >
                <Typography
                  style={{
                    ...TYPO.semi(13),
                    color: isSelected ? UI.color.textInverse : UI.color.muted,
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
            tintColor={UI.color.text}
            progressViewOffset={10}
          />
        }
      >
        {isLoading ? (
          <View style={{ paddingHorizontal: UI.space.page, gap: 24 }}>
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
          <View
            style={{
              paddingHorizontal: UI.space.page,
              gap: 20,
            }}
          >
            {/* Spending Summary */}
            <Card padding={20}>
              <SectionLabel style={{ marginBottom: 12 }}>Spending summary</SectionLabel>
              <Typography
                style={{
                  ...TYPO.hero(38),
                  lineHeight: 46,
                  marginBottom: 20,
                }}
              >
                {formatAmount(totalSpent, preferredCurrency.code)}
              </Typography>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { label: "Expenses", value: String(expenseCount) },
                  {
                    label: "Average",
                    value: formatAmount(averageExpense, preferredCurrency.code),
                  },
                  { label: "Top category", value: biggestCategoryLabel },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: 1,
                      backgroundColor: UI.color.control,
                      borderRadius: UI.radius.md,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                    }}
                  >
                    <Typography
                      numberOfLines={1}
                      style={{
                        ...TYPO.label(),
                        color: UI.color.muted,
                        marginBottom: 5,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        ...TYPO.semi(16),
                        color: UI.color.text,
                      }}
                    >
                      {item.value}
                    </Typography>
                  </View>
                ))}
              </View>
            </Card>

            {/* Spending Trend (Bar Chart) */}
            <Card padding={20}>
              <SectionLabel style={{ marginBottom: 12 }}>Spending over time</SectionLabel>
              {barChartData.length > 0 ? (
                <View
                  style={{
                    marginLeft: -8,
                    marginTop: 8,
                    paddingBottom: 8,
                  }}
                >
                  <BarChart
                    data={barChartData}
                    height={180}
                    width={chartWidth}
                    spacing={barSpacing}
                    barWidth={18}
                    barBorderRadius={4}
                    frontColor={UI.color.text}
                    gradientColor={UI.color.muted}
                    isAnimated
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={UI.color.border}
                    rulesColor={UI.color.border}
                    rulesThickness={1}
                    noOfSections={3}
                    showValuesAsTopLabel={false}
                    xAxisLabelTextStyle={{
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 10,
                    }}
                  />
                </View>
              ) : (
                <View style={{ paddingVertical: 28, alignItems: "center" }}>
                  <icons.BarChart3 size={38} color={UI.color.muted} strokeWidth={1.25} />
                  <Typography
                    style={{
                      ...TYPO.medium(15),
                      color: UI.color.muted,
                      marginTop: 12,
                      marginBottom: 16,
                    }}
                  >
                    No spending data for this period.
                  </Typography>
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => router.push("/expense/new")}
                    style={({ pressed }) => ({
                      paddingHorizontal: 18,
                      paddingVertical: 10,
                      borderRadius: UI.radius.pill,
                      backgroundColor: UI.color.text,
                      opacity: pressed ? 0.8 : 1,
                    })}
                  >
                    <Typography
                      style={{
                        ...TYPO.semi(14),
                        color: UI.color.textInverse,
                      }}
                    >
                      Log an expense
                    </Typography>
                  </Pressable>
                </View>
              )}
            </Card>

            <CategoryBreakdown
              data={categoryData}
              totalSpent={totalSpent}
              currencyCode={preferredCurrency.code}
              onLogExpense={() => router.push("/expense/new")}
            />
            <TopExpenses
              expenses={topExpenses}
              currencyCode={preferredCurrency.code}
              onLogExpense={() => router.push("/expense/new")}
            />
          </View>
        )}
      </ScrollView>
    </FocusAwareView>
  );
}
