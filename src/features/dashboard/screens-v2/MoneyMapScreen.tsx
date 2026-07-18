import type { JSX } from "react";
import { View, Text, ActivityIndicator, Pressable } from "react-native";
import { Bell, CircleUserRound } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useDashboard } from "@/features/dashboard/hooks/useDashboard";
import { GroupBalanceLedger } from "@/features/dashboard/components/GroupBalanceLedger";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getGreeting } from "@/utils/date";
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  BalanceHero,
  Eyebrow,
  MoneyRow,
  useCoralColors,
} from "@/components/coral";
import { useUI } from "@/components/ui";

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

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`;
  return formatAmount(amount, currencyCode);
}

function getLede(balanceTone: string, openGroupCount: number): string {
  if (openGroupCount > 1) return `${openGroupCount} circles need your attention.`;
  if (openGroupCount === 1) return "One circle needs your attention.";
  if (balanceTone === "success") return "You're in the green.";
  if (balanceTone === "danger") return "Time to settle up.";
  return "Everything is settled.";
}

export default function MoneyMapScreen(): JSX.Element {
  const dashboard = useDashboard();
  const coral = useCoralColors();
  const { color } = useUI();

  if (dashboard.isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={dashboard.onRefresh} />
      </CoralScreen>
    );
  }

  if (dashboard.isLoading && dashboard.activeGroups.length === 0) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  const netBalance = dashboard.owedToYou - dashboard.youOwe;
  const greeting = getGreeting();
  const userName = dashboard.currentUser?.name.split(" ")[0] ?? "there";
  const lede = getLede(dashboard.balanceTone, dashboard.openGroupCount);
  const currencyCode = dashboard.preferredCurrency.code;
  const topOweUsers = dashboard.oweUsers.slice(0, 2);
  const topOwedUsers = dashboard.owedUsers.slice(0, 2);

  return (
    <CoralScreen>
      <CoralTopBar
        leftElement={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open settings"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              dashboard.handleViewProfile();
            }}
            style={{
              width: 48,
              height: 48,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {dashboard.currentUser ? (
              <AppUserAvatar user={dashboard.currentUser} size="sm" />
            ) : (
              <CircleUserRound size={24} color={color.text} strokeWidth={1.7} />
            )}
          </Pressable>
        }
        rightElement={
          <View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Open notifications"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                dashboard.handleViewNotifications();
              }}
              style={{
                width: 48,
                height: 48,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bell size={22} color={color.text} strokeWidth={1.7} />
            </Pressable>
            {dashboard.hasNotifications && (
              <View
                style={{
                  position: "absolute",
                  top: 9,
                  right: 9,
                  width: 9,
                  height: 9,
                  borderRadius: 5,
                  backgroundColor: coral.negative,
                  borderWidth: 1.5,
                  borderColor: coral.surface,
                }}
              />
            )}
          </View>
        }
      />

      <LargeTitle>
        {greeting}, {userName}.
      </LargeTitle>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: color.muted,
          lineHeight: 21,
          marginBottom: 10,
        }}
      >
        {lede}
      </Text>

      <BalanceHero
        label="Across all your circles"
        value={formatSignedAmount(netBalance, currencyCode)}
        note={`You're owed ${formatAmount(dashboard.owedToYou, currencyCode)} \u00B7 You owe ${formatAmount(dashboard.youOwe, currencyCode)}`}
      />

      {(topOweUsers.length > 0 || topOwedUsers.length > 0) && (
        <>
          <Eyebrow>Needs attention</Eyebrow>
          {topOweUsers.map((user) => {
            const balance = dashboard.perUserBalances.get(user.id) ?? 0;
            return (
              <MoneyRow
                key={`owe-${user.id}`}
                avatar={<AppUserAvatar user={user} size="sm" />}
                title={user.name}
                subtitle={`You owe ${formatAmount(Math.abs(balance), currencyCode)}`}
                amount={formatAmount(balance, currencyCode)}
                amountTone="negative"
                onPress={() => dashboard.handleSettleUser(user.id)}
              />
            );
          })}
          {topOwedUsers.map((user) => {
            const balance = dashboard.perUserBalances.get(user.id) ?? 0;
            return (
              <MoneyRow
                key={`owed-${user.id}`}
                avatar={<AppUserAvatar user={user} size="sm" />}
                title={user.name}
                subtitle={`Owes you ${formatAmount(balance, currencyCode)}`}
                amount={formatSignedAmount(balance, currencyCode)}
                amountTone="positive"
                onPress={() => dashboard.handleSettleUser(user.id)}
              />
            );
          })}
        </>
      )}

      <GroupBalanceLedger
        items={dashboard.groupBalancePreview}
        currencyCode={currencyCode}
        onGroupPress={dashboard.handleGroupPress}
        onViewAll={dashboard.handleViewAllGroups}
      />

      {dashboard.recentExpenses.length > 0 && (
        <>
          <Eyebrow>Recent movement</Eyebrow>
          {dashboard.recentExpenses.slice(0, 4).map((expense) => {
            const isPayer = expense.paidBy === dashboard.currentUser?.id;
            const userShare = expense.splits.find((s) => s.userId === dashboard.currentUser?.id);
            const payerName = expense.paidByUser?.name ?? "Someone";
            return (
              <MoneyRow
                key={expense.id}
                avatar={<AppUserAvatar user={expense.paidByUser} size="sm" />}
                title={expense.title}
                subtitle={
                  isPayer
                    ? `You paid \u00B7 split with ${expense.splits.length} people`
                    : `${payerName} paid`
                }
                amount={
                  isPayer
                    ? formatSignedAmount(
                        expense.amount - (userShare?.amount ?? 0),
                        expense.currency
                      )
                    : formatAmount(userShare?.amount ?? 0, expense.currency)
                }
                amountTone={isPayer ? "positive" : "negative"}
                onPress={() => dashboard.handleExpensePress(expense.id)}
              />
            );
          })}
        </>
      )}
    </CoralScreen>
  );
}
