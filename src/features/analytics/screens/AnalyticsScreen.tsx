import React, { useState, useCallback } from "react";
import {
  View,
  ScrollView,
  Pressable,
  LayoutAnimation,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Typography } from "heroui-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FocusAwareView } from "@/components/animations/PageAnimator";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";

import { useAnalytics, type AnalyticsPeriod } from "../hooks/useAnalytics";
import { CategoryBreakdown } from "../components/CategoryBreakdown";
import { TopExpenses } from "../components/TopExpenses";

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

  const BG = "#F5F0EB";
  const TEXT_PRIMARY = "#1A1817";
  const TEXT_SECONDARY = "#A39B93";

  return (
    <FocusAwareView style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />
      <View
        style={{
          paddingTop: insets.top + 24,
          backgroundColor: BG,
          borderBottomWidth: 1,
          borderBottomColor: "#E5DFD9",
          zIndex: 10,
        }}
      >
        <View style={{ paddingHorizontal: 24, marginBottom: 24 }}>
          <Typography
            style={{ fontSize: 32, fontFamily: "UnicaOne_400Regular", color: TEXT_PRIMARY }}
          >
            Analytics
          </Typography>
        </View>

        {/* Period Selector */}
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
                style={{
                  paddingHorizontal: 16,
                  paddingVertical: 8,
                  backgroundColor: isSelected ? "#8C7A6B" : "transparent",
                  borderWidth: 1,
                  borderColor: isSelected ? "#8C7A6B" : "#E5DFD9",
                }}
              >
                <Typography
                  style={{
                    fontSize: 13,
                    fontFamily: "CrimsonText_700Bold",
                    color: isSelected ? "#FFFFFF" : TEXT_PRIMARY,
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
        contentContainerStyle={{ paddingBottom: insets.bottom + 120, paddingTop: 24 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={TEXT_PRIMARY}
            progressViewOffset={10}
          />
        }
      >
        {isLoading ? (
          <View style={{ padding: 40, alignItems: "center" }}>
            <ActivityIndicator size="large" color="#8C7A6B" />
          </View>
        ) : (
          <View style={{ paddingHorizontal: 24, gap: 24 }}>
            {/* Total Spent Hero */}
            <View style={{ backgroundColor: "transparent", paddingVertical: 16 }}>
              <Typography
                style={{
                  fontSize: 12,
                  color: "#A39B93",
                  fontFamily: "CrimsonText_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1,
                  marginBottom: 8,
                }}
              >
                Total Spent
              </Typography>
              <Typography
                style={{
                  fontSize: 36,
                  color: "#1A1817",
                  fontFamily: "CrimsonText_700Bold",
                  lineHeight: 44,
                }}
              >
                {formatAmount(totalSpent, preferredCurrency.code)}
              </Typography>
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
