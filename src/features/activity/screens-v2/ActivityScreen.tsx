import type { JSX } from "react";
import { View, Text, ActivityIndicator, ScrollView, Pressable } from "react-native";

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
} from "@/components/coral";
import { useCoralColors } from "@/components/coral/useCoral";
import type { Activity as ActivityType } from "@/types";

function LoadingState() {
  const coral = useCoralColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={coral.muted} />
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const coral = useCoralColors();
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: coral.foreground,
        }}
      >
        Something went wrong
      </Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Tap to retry"
        onPress={onRetry}
        style={({ pressed }) => ({ opacity: pressed ? 0.65 : 1 })}
      >
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 15,
            color: coral.accent,
          }}
        >
          Tap to retry
        </Text>
      </Pressable>
    </View>
  );
}

function EmptyState() {
  const coral = useCoralColors();
  return (
    <View style={{ minHeight: 310, alignItems: "center", justifyContent: "center", padding: 30 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: coral.foreground,
          textAlign: "center",
        }}
      >
        No activity found
      </Text>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: coral.muted,
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
  const { isError, refetch, isAppLoading, activeFilter, setActiveFilter, groupedActivities } =
    useActivity();

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
      <CoralTopBar title="Activity" />

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
