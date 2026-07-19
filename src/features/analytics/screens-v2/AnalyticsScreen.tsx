import React, { useState } from "react";
import { View, Text } from "react-native";
import { useRouter } from "expo-router";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { BalanceHero } from "@/components/coral/BalanceHero";
import { StatPair } from "@/components/coral/StatPair";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { CoralSegment } from "@/components/coral/CoralSegment";
import { Eyebrow } from "@/components/coral/Eyebrow";
import { useCoralColors } from "@/components/coral/useCoral";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useAnalytics } from "@/features/analytics/hooks/useAnalytics";
import type { AnalyticsPeriod } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";
import * as icons from "lucide-react-native";

const PERIOD_OPTIONS = [
  { label: "Week", value: "week" },
  { label: "Month", value: "month" },
  { label: "3 months", value: "3mo" },
  { label: "Year", value: "year" },
];

export default function AnalyticsScreen() {
  const router = useRouter();
  const coral = useCoralColors();
  const { currentUser } = useAuth();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);

  const [period, setPeriod] = useState<AnalyticsPeriod>("month");

  const { totalSpent, expenseCount, categoryData, trendData, topExpenses, isError } = useAnalytics(
    currentUser?.id,
    period,
    preferredCurrency.code,
    convertCurrency
  );

  const averagePerExpense = expenseCount > 0 ? totalSpent / expenseCount : 0;

  const formatAmount = (amount: number) => `${preferredCurrency.symbol}${amount.toFixed(0)}`;

  const averageStr = `${preferredCurrency.symbol}${averagePerExpense.toFixed(0)}`;

  const sortedCategories = [...categoryData].sort((a, b) => b.amount - a.amount).slice(0, 5);

  const totalSpentStr = `${preferredCurrency.symbol}${totalSpent.toFixed(0)}`;

  const getBalanceNote = () => {
    switch (period) {
      case "week":
        return "Last 7 days";
      case "month":
        return "Last 30 days";
      case "3mo":
        return "Last 3 months";
      case "year":
        return "Last 12 months";
      case "all":
        return "All time";
    }
  };

  const renderCategoryIcon = (category: string) => {
    const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === category);
    const IconComp = catInfo ? (icons as any)[catInfo.icon] : icons.Package;
    if (!IconComp) return <icons.Package size={20} color={coral.avatarInk} strokeWidth={1.5} />;
    return <IconComp size={20} color={coral.avatarInk} strokeWidth={1.5} />;
  };

  return (
    <CoralScreen contentContainerStyle={{ gap: 4 }}>
      <CoralTopBar title="Analytics" onBack={() => router.back()} />

      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 30,
          color: coral.foreground,
          letterSpacing: -0.035 * 30,
          lineHeight: 30 * 1.08,
          marginBottom: 2,
        }}
      >
        Insights
      </Text>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 14,
          color: coral.muted,
          lineHeight: 20,
          marginBottom: 8,
        }}
      >
        Every aggregate below represents your share unless explicitly stated otherwise.
      </Text>

      <BalanceHero label="Total spent" value={totalSpentStr} note={getBalanceNote()} />

      <StatPair
        left={{ label: "Expenses", value: String(expenseCount) }}
        right={{ label: "Average", value: averageStr }}
      />

      <View style={{ marginTop: 8 }}>
        <CoralSegment
          options={PERIOD_OPTIONS}
          selected={period}
          onSelect={(v) => setPeriod(v as AnalyticsPeriod)}
        />
      </View>

      {trendData.length > 0 && (
        <>
          <View
            style={{
              backgroundColor: coral.surface,
              borderWidth: 1,
              borderColor: coral.border,
              borderRadius: 16,
              padding: 16,
              gap: 8,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
                marginBottom: 4,
              }}
            >
              Spending trend
            </Text>
            {trendData.map((point, idx) => {
              const maxVal = Math.max(...trendData.map((d) => d.value), 1);
              const barWidth = `${Math.max((point.value / maxVal) * 100, 2)}%`;
              return (
                <View key={idx} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                  <Text
                    style={{
                      fontFamily: "IBMPlexMono_400Regular",
                      fontSize: 11,
                      color: coral.muted,
                      width: 50,
                    }}
                  >
                    {point.label}
                  </Text>
                  <View style={{ flex: 1, height: 20, justifyContent: "center" }}>
                    <View
                      style={{
                        height: 16,
                        width: barWidth as any,
                        borderRadius: 8,
                        backgroundColor: coral.accent,
                        opacity: 0.6 + (idx / trendData.length) * 0.4,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontFamily: "IBMPlexMono_500Medium",
                      fontSize: 11,
                      color: coral.muted,
                      fontVariant: ["tabular-nums"],
                      width: 56,
                      textAlign: "right",
                    }}
                  >
                    {preferredCurrency.symbol}
                    {point.value.toFixed(0)}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}

      {sortedCategories.length > 0 && (
        <>
          <View
            style={{
              backgroundColor: coral.surface,
              borderWidth: 1,
              borderColor: coral.border,
              borderRadius: 16,
              overflow: "hidden",
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 14,
                color: coral.foreground,
                padding: 12,
                paddingBottom: 4,
              }}
            >
              Top categories
            </Text>
            {sortedCategories.map((cat) => {
              const catInfo = EXPENSE_CATEGORIES.find((c) => c.key === cat.category);
              return (
                <MoneyRow
                  key={cat.category}
                  avatar={
                    <View
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 14,
                        backgroundColor: coral.avatarSoft,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {renderCategoryIcon(cat.category)}
                    </View>
                  }
                  title={catInfo?.label ?? cat.category}
                  amount={formatAmount(cat.amount)}
                />
              );
            })}
          </View>
        </>
      )}

      {isError && (
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              color: coral.muted,
            }}
          >
            Couldn't load analytics
          </Text>
        </View>
      )}

      <View style={{ height: 40 }} />
    </CoralScreen>
  );
}
