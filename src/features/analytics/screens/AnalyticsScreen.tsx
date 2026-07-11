import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  Pressable,
  LayoutAnimation,
  ActivityIndicator,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { Typography } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LineChart } from "react-native-gifted-charts";
import * as icons from "lucide-react-native";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

import { useAnalytics } from "../hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { TopExpenses } from "../components/TopExpenses";

import { UI } from "@/components/ui/native-ui";

const PERIODS: { key: AnalyticsPeriod; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "month", label: "Month" },
  { key: "3mo", label: "3 Months" },
  { key: "year", label: "Year" },
  { key: "all", label: "All Time" },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Typography
      style={{
        fontSize: 11,
        color: UI.color.text,
        fontFamily: "IBMPlexSans_600SemiBold",
        letterSpacing: 1.1,
        textTransform: "uppercase",
        marginBottom: 12,
      }}
    >
      {children}
    </Typography>
  );
}

function AnalyticsCard({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: UI.color.surface,
        borderRadius: UI.radius.lg,
        borderWidth: 1,
        borderColor: UI.color.border,
        padding: 16,
      }}
    >
      {children}
    </View>
  );
}

export default function AnalyticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { currentUser } = useAuth();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const { totalSpent, expenseCount, categoryData, trendData, topExpenses, isLoading, refetch } =
    useAnalytics(currentUser?.id, period, preferredCurrency.code, convertCurrency);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const averageExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;
  const biggestCategory = categoryData[0];
  const biggestCategoryLabel = biggestCategory
    ? biggestCategory.category.charAt(0).toUpperCase() + biggestCategory.category.slice(1)
    : "None";

  const trendChartData = useMemo(() => {
    const labelEvery = Math.max(1, Math.ceil(trendData.length / 4));
    return trendData.map((point, index) => ({
      value: point.value,
      label:
        index === 0 || index === trendData.length - 1 || index % labelEvery === 0
          ? point.label.replace(" ", "\n")
          : "",
    }));
  }, [trendData]);

  const trendMax = trendData.reduce((max, point) => Math.max(max, point.value), 0);
  const chartWidth = Math.max(220, width - UI.space.page * 2 - 56);

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: insets.top + 18,
          backgroundColor: UI.color.bg,
          zIndex: 10,
        }}
      >
        <View style={{ paddingHorizontal: UI.space.page, marginBottom: 18 }}>
          <Typography style={{ fontSize: 32, fontFamily: "Sora_600SemiBold", color: UI.color.text }}>
            Analytics
          </Typography>
        </View>

        {/* Period Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: UI.space.page, gap: 8, paddingBottom: 18 }}
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
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 8,
                  backgroundColor: isSelected ? UI.color.text : UI.color.control,
                  borderWidth: 1,
                  borderColor: isSelected ? UI.color.text : UI.color.border,
                  borderRadius: 999,
                }}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    fontFamily: "IBMPlexSans_600SemiBold",
                    color: isSelected ? "#FFFFFF" : UI.color.muted,
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
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color={UI.color.text} />
          </View>
        ) : (
          <View style={{ paddingHorizontal: UI.space.page, gap: 24 }}>
            <AnalyticsCard>
              <SectionLabel>Spending summary</SectionLabel>
              <Typography
                style={{
                  fontSize: 38,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  lineHeight: 46,
                  marginBottom: 16,
                }}
              >
                {formatAmount(totalSpent, preferredCurrency.code)}
              </Typography>

              <View style={{ flexDirection: "row", gap: 10 }}>
                {[
                  { label: "Expenses", value: String(expenseCount) },
                  { label: "Average", value: formatAmount(averageExpense, preferredCurrency.code) },
                  { label: "Top category", value: biggestCategoryLabel },
                ].map((item) => (
                  <View
                    key={item.label}
                    style={{
                      flex: 1,
                      backgroundColor: UI.color.control,
                      borderRadius: 14,
                      borderWidth: 1,
                      borderColor: UI.color.border,
                      paddingHorizontal: 12,
                      paddingVertical: 12,
                    }}
                  >
                    <Typography
                      numberOfLines={1}
                      style={{
                        fontSize: 11,
                        color: UI.color.muted,
                        fontFamily: "IBMPlexSans_600SemiBold",
                        textTransform: "uppercase",
                        letterSpacing: 0.8,
                        marginBottom: 5,
                      }}
                    >
                      {item.label}
                    </Typography>
                    <Typography
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      style={{
                        fontSize: 16,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
                      }}
                    >
                      {item.value}
                    </Typography>
                  </View>
                ))}
              </View>
            </AnalyticsCard>

            <AnalyticsCard>
              <SectionLabel>Trend</SectionLabel>
              {trendChartData.length > 0 && trendMax > 0 ? (
                <View style={{ marginLeft: -10, marginTop: 2 }}>
                  <LineChart
                    data={trendChartData}
                    areaChart
                    curved
                    isAnimated
                    height={170}
                    width={chartWidth}
                    spacing={Math.max(34, chartWidth / Math.max(4, trendChartData.length - 1))}
                    color={UI.color.text}
                    thickness={2}
                    startFillColor="#000000"
                    endFillColor="#000000"
                    startOpacity={0.1}
                    endOpacity={0.01}
                    hideDataPoints
                    hideYAxisText
                    yAxisThickness={0}
                    xAxisThickness={1}
                    xAxisColor={UI.color.border}
                    rulesColor={UI.color.border}
                    rulesThickness={1}
                    noOfSections={3}
                    maxValue={trendMax * 1.2}
                    xAxisLabelTextStyle={{
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      fontSize: 10,
                    }}
                  />
                </View>
              ) : (
                <View style={{ paddingVertical: 28, alignItems: "center" }}>
                  <icons.LineChart size={38} color={UI.color.muted} strokeWidth={1.25} />
                  <Typography
                    style={{
                      marginTop: 12,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                    }}
                  >
                    No spending trend for this period.
                  </Typography>
                </View>
              )}
            </AnalyticsCard>

            <CategoryBreakdown
              data={categoryData}
              totalSpent={totalSpent}
              currencyCode={preferredCurrency.code}
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
