import type { JSX } from "react";
import { View, Text, ActivityIndicator, ScrollView, Pressable } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { GroupRouteParams } from "@/types/navigation";
import { Settings } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { useGroupDetail } from "@/features/groups/hooks/useGroupDetail";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar, AvatarStack } from "@/components/ui/MemberAvatar";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  Eyebrow,
  MoneyRow,
  StatPair,
  CoralChip,
  CoralButton,
} from "@/components/coral";
import { useUI } from "@/components/ui";
import type { User } from "@/types";

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
        Group not found
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

type FilterTab = "Overview" | "Activity" | "Currencies" | "Recurring";

const FILTER_TABS: FilterTab[] = ["Overview", "Activity", "Currencies", "Recurring"];

export default function GroupDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<GroupRouteParams>();
  const router = useRouter();
  const { color } = useUI();

  const {
    group,
    expenses,
    oweUsers,
    owedUsers,
    youOwe,
    owedToYou,
    userById,
    isLoading,
    isError,
    memberBalances,
    currentUserId,
    handleBack,
    handleSettingsPress,
    handleMemberPress,
    handleAddExpense,
    handleExpensePress,
    refetch,
  } = useGroupDetail(id || "");

  if (isLoading) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={() => refetch()} />
      </CoralScreen>
    );
  }

  if (!group) {
    return (
      <CoralScreen scroll={false}>
        <NotFoundState onGoBack={handleBack} />
      </CoralScreen>
    );
  }

  const currencyCode = group.currency;
  const memberUsers: User[] = group.members.map((m) => m.user);
  const netBalance = owedToYou - youOwe;
  const openBalanceCount = Array.from(memberBalances.values()).filter(
    (b) => Math.abs(b) > 0.005
  ).length;

  const balanceTone: "positive" | "negative" | "neutral" =
    netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral";

  const metaText = `${group.members.length} people`;

  return (
    <CoralScreen>
      <CoralTopBar
        title={group.name}
        onBack={handleBack}
        rightElement={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              handleSettingsPress();
            }}
            hitSlop={8}
          >
            <Settings size={22} color={color.text} strokeWidth={1.7} />
          </Pressable>
        }
      />

      <View style={{ marginTop: 18, marginBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 12 }}>
              <GroupIconBadge group={group} size="lg" />
            </View>
            <LargeTitle style={{ marginTop: 0, marginBottom: 4 }}>{group.name}</LargeTitle>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 14,
                color: color.muted,
              }}
            >
              {metaText}
            </Text>
          </View>

          {memberUsers.length > 0 && <AvatarStack users={memberUsers} max={4} />}
        </View>
      </View>

      <StatPair
        left={{
          label: balanceTone === "positive" ? "You're owed" : "You owe",
          value: formatSignedAmount(netBalance, currencyCode),
          tone: balanceTone,
        }}
        right={{
          label: "Open balances",
          value: String(openBalanceCount),
          tone: "neutral",
        }}
      />

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginTop: 12, marginBottom: 8 }}
        contentContainerStyle={{ gap: 8 }}
      >
        {FILTER_TABS.map((tab) => (
          <CoralChip
            key={tab}
            label={tab}
            isActive={tab === "Overview"}
            onPress={() => {
              Haptics.selectionAsync();
            }}
          />
        ))}
      </ScrollView>

      <Eyebrow>Balances</Eyebrow>
      {memberBalances.size > 0
        ? Array.from(memberBalances.entries())
            .filter(([, balance]) => Math.abs(balance) > 0.005)
            .sort(([, a], [, b]) => b - a)
            .map(([userId, balance]) => {
              const member = group.members.find((m) => m.userId === userId);
              if (!member) return null;
              const isCurrentUser = userId === currentUserId;
              const user = member.user;
              return (
                <MoneyRow
                  key={userId}
                  avatar={<AppUserAvatar user={user} size="sm" balance={balance} />}
                  title={isCurrentUser ? "You" : user.name}
                  subtitle={
                    balance > 0
                      ? `Owes ${formatAmount(balance, currencyCode)}`
                      : `You owe ${formatAmount(Math.abs(balance), currencyCode)}`
                  }
                  amount={formatSignedAmount(balance, currencyCode)}
                  amountTone={balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral"}
                  onPress={isCurrentUser ? undefined : () => handleMemberPress(userId)}
                />
              );
            })
        : null}

      {expenses.length > 0 && (
        <>
          <Eyebrow>Latest</Eyebrow>
          {expenses.slice(0, 5).map((expense) => {
            const isPayer = expense.paidBy === currentUserId;
            const userShare = expense.splits.find((s) => s.userId === currentUserId);
            return (
              <MoneyRow
                key={expense.id}
                avatar={<AppUserAvatar user={expense.paidByUser} size="sm" />}
                title={expense.title}
                subtitle={
                  isPayer
                    ? `You paid \u00B7 split with ${expense.splits.length} people`
                    : `${expense.paidByUser.name} paid`
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
                onPress={() => handleExpensePress(expense.id)}
              />
            );
          })}
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <CoralButton label="Add an expense" variant="primary" onPress={handleAddExpense} />
      </View>
    </CoralScreen>
  );
}
