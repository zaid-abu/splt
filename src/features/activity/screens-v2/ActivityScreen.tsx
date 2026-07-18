import type { JSX } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import { useRouter } from "expo-router";

import { useActivity, ACTIVITY_FILTERS } from "@/features/activity/hooks/useActivity";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  Eyebrow,
  MoneyRow,
  CoralChip,
  ContextBar,
} from "@/components/coral";
import { useUI } from "@/components/ui";
import type { Activity as ActivityType } from "@/types";

function LoadingState() {
  const { color } = useUI();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={color.muted} />
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { color } = useUI();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: color.text,
        }}
      >
        Something went wrong
      </Text>
      <Text
        onPress={onRetry}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Tap to retry
      </Text>
    </View>
  );
}

function EmptyState() {
  const { color } = useUI();
  return (
    <View style={{ minHeight: 310, alignItems: "center", justifyContent: "center", padding: 30 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: color.text,
          textAlign: "center",
        }}
      >
        No activity found
      </Text>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: color.muted,
          textAlign: "center",
          lineHeight: 21,
          marginTop: 8,
        }}
      >
        Expenses and settlements will appear here as you use Splt.
      </Text>
    </View>
  );
}

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`;
  return formatAmount(amount, currencyCode);
}

function renderActivityRow(activity: ActivityType) {
  if (activity.type === "expense" && activity.expense) {
    const expense = activity.expense;
    return (
      <MoneyRow
        key={activity.id}
        avatar={<AppUserAvatar user={activity.user} size="sm" />}
        title={expense.title}
        subtitle={activity.description}
        amount={formatAmount(expense.amount, expense.currency)}
        amountTone="neutral"
      />
    );
  }

  if (activity.type === "settlement" && activity.settlement) {
    const settlement = activity.settlement;
    return (
      <MoneyRow
        key={activity.id}
        avatar={<AppUserAvatar user={activity.user} size="sm" />}
        title={activity.description}
        subtitle={`${settlement.fromUser.name} → ${settlement.toUser.name}`}
        amount={formatAmount(settlement.amount, activity.currency ?? settlement.currency)}
        amountTone="positive"
      />
    );
  }

  return (
    <MoneyRow
      key={activity.id}
      avatar={<AppUserAvatar user={activity.user} size="sm" />}
      title={activity.description}
      amount=""
      amountTone="neutral"
    />
  );
}

export default function ActivityScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();

  const {
    isError,
    refetch,
    isAppLoading,
    searchQuery,
    setSearchQuery,
    activeFilter,
    setActiveFilter,
    groupedActivities,
  } = useActivity();

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={() => refetch()} />
      </CoralScreen>
    );
  }

  if (isAppLoading && groupedActivities.length === 0) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  const totalActivities = groupedActivities.reduce((sum, section) => sum + section.data.length, 0);

  return (
    <CoralScreen>
      <CoralTopBar
        title="Activity"
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/home");
          }
        }}
      />
      <ContextBar title="Activity" backTo={{ label: "Home", route: "/home" }} />

      <LargeTitle>Everything that moved.</LargeTitle>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginBottom: 8 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {ACTIVITY_FILTERS.map((filter) => (
          <CoralChip
            key={filter}
            label={filter}
            isActive={activeFilter === filter}
            onPress={() => setActiveFilter(filter)}
          />
        ))}
      </ScrollView>

      {totalActivities === 0 ? (
        <EmptyState />
      ) : (
        groupedActivities.map((section) => (
          <View key={section.title}>
            <Eyebrow>{section.title}</Eyebrow>
            {section.data.map((activity) => renderActivityRow(activity))}
          </View>
        ))
      )}
    </CoralScreen>
  );
}
