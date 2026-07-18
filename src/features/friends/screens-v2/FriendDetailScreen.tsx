import type { JSX } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { FriendRouteParams } from "@/types/navigation";
import * as Haptics from "expo-haptics";

import { useFriendDetail } from "@/features/friends/hooks/useFriendDetail";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralScreen,
  CoralTopBar,
  MoneyAmount,
  Eyebrow,
  MoneyRow,
  CoralButton,
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

function NotFoundState({ onGoBack }: { onGoBack: () => void }) {
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
        Friend not found
      </Text>
      <Text
        onPress={onGoBack}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Go back
      </Text>
    </View>
  );
}

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`;
  return formatAmount(amount, currencyCode);
}

function getBalanceLede(
  balance: number,
  isSettled: boolean,
  isPositive: boolean,
  friendName: string
): string {
  if (isSettled) return `You and ${friendName} are all settled.`;
  if (isPositive) return `${friendName} owes you across shared circles.`;
  return `You owe ${friendName}.`;
}

export default function FriendDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<FriendRouteParams>();
  const router = useRouter();
  const { color } = useUI();

  const {
    friend,
    isLoading,
    isError,
    refetchAll,
    netBalance,
    isPositive,
    isSettled,
    sharedActivities,
    sharedGroupsWithRecentActivity,
    preferredCurrency,
  } = useFriendDetail(id);

  const currencyCode = preferredCurrency.code;

  if (isLoading && !friend) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={refetchAll} />
      </CoralScreen>
    );
  }

  if (!friend) {
    return (
      <CoralScreen scroll={false}>
        <NotFoundState onGoBack={() => router.back()} />
      </CoralScreen>
    );
  }

  const lede = getBalanceLede(netBalance, isSettled, isPositive, friend.name.split(" ")[0]);

  return (
    <CoralScreen>
      <CoralTopBar
        title={friend.name}
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/people");
          }
        }}
      />

      <View style={{ alignItems: "center", marginTop: 24, marginBottom: 10 }}>
        <AppUserAvatar user={friend} size="lg" />
      </View>

      <View style={{ alignItems: "center", marginBottom: 6 }}>
        <MoneyAmount
          tone={isSettled ? "neutral" : isPositive ? "positive" : "negative"}
          size="hero"
        >
          {formatSignedAmount(netBalance, currencyCode)}
        </MoneyAmount>
      </View>

      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          color: color.muted,
          textAlign: "center",
          lineHeight: 21,
          marginHorizontal: 32,
          marginBottom: 18,
        }}
      >
        {lede}
      </Text>

      <View style={{ flexDirection: "row", gap: 12, marginBottom: 8 }}>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Settle up"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              if (!isSettled && !isPositive) {
                router.push({
                  pathname: "/settle/[id]",
                  params: { id: friend.id },
                });
              } else if (isPositive) {
                router.push({
                  pathname: "/settle/[id]",
                  params: { id: friend.id },
                });
              } else {
                router.push({
                  pathname: "/settle/[id]",
                  params: { id: friend.id },
                });
              }
            }}
          />
        </View>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Add expense"
            variant="secondary"
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(`/expense/new?friendId=${friend.id}`);
            }}
          />
        </View>
      </View>

      {sharedGroupsWithRecentActivity.length > 0 && (
        <>
          <Eyebrow>Together</Eyebrow>
          {sharedGroupsWithRecentActivity.map(({ group, latestExpense }) => (
            <MoneyRow
              key={group.id}
              avatar={
                <AppUserAvatar
                  user={
                    group.members.find((m) => m.userId !== group.createdBy)?.user ??
                    group.members[0]?.user
                  }
                  size="sm"
                />
              }
              title={group.name}
              subtitle={latestExpense ? latestExpense.title : `${group.members.length} people`}
              amount={formatAmount(netBalance, currencyCode)}
              amountTone={isSettled ? "neutral" : isPositive ? "positive" : "negative"}
              onPress={() => router.push(`/group/${group.id}`)}
            />
          ))}
        </>
      )}

      {sharedActivities.length > 0 && (
        <>
          <Eyebrow>History</Eyebrow>
          {sharedActivities.slice(0, 10).map((activity) => {
            if (activity.type === "expense" && activity.expense) {
              const expense = activity.expense;
              const isPayer = expense.paidBy === friend.id;
              const userShare = expense.splits.find((s) => s.userId === friend.id);
              return (
                <MoneyRow
                  key={activity.id}
                  avatar={<AppUserAvatar user={isPayer ? friend : expense.paidByUser} size="sm" />}
                  title={expense.title}
                  subtitle={isPayer ? `${friend.name} paid` : `You paid`}
                  amount={
                    isPayer
                      ? formatAmount(userShare?.amount ?? 0, expense.currency)
                      : formatAmount(expense.amount, expense.currency)
                  }
                  amountTone={isPayer ? "negative" : "positive"}
                  onPress={() => router.push(`/expense/${expense.id}`)}
                />
              );
            }
            if (activity.type === "settlement" && activity.settlement) {
              const settlement = activity.settlement;
              const fromFriend = settlement.fromUserId === friend.id;
              return (
                <MoneyRow
                  key={activity.id}
                  avatar={<AppUserAvatar user={friend} size="sm" />}
                  title={fromFriend ? `${friend.name} paid you` : `You paid ${friend.name}`}
                  subtitle="Settlement"
                  amount={formatAmount(settlement.amount, settlement.currency)}
                  amountTone={fromFriend ? "positive" : "negative"}
                />
              );
            }
            return null;
          })}
        </>
      )}
    </CoralScreen>
  );
}
