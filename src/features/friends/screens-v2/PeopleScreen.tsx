import type { JSX } from "react";
import { useCallback } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import Animated from "react-native-reanimated";
import { useRouter } from "expo-router";

import { useFriendsList, type DisplayItem } from "@/features/friends/hooks/useFriendsList";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  Eyebrow,
  MoneyRow,
  CoralSearchField,
  CoralButton,
  ContextBar,
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

export default function PeopleScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();

  const {
    isLoading,
    isError,
    refetchAll,
    displayRows,
    refreshing,
    search,
    setSearch,
    onRefresh,
    handlePrimaryFriendAction,
    preferredCurrency,
  } = useFriendsList();

  const currencyCode = preferredCurrency.code;

  const renderItem = useCallback(
    (item: DisplayItem) => {
      if (item.kind === "section") {
        return null;
      }

      const { friend, balance, recentExpense } = item.item;
      const isPositive = balance > 0;
      const isNegative = balance < 0;
      const subtitle = recentExpense ? recentExpense.title : balance === 0 ? "All settled" : "";

      return (
        <Animated.View key={item.id}>
          <MoneyRow
            avatar={<AppUserAvatar user={friend} size="sm" />}
            title={friend.name}
            subtitle={subtitle}
            amount={
              isPositive
                ? formatSignedAmount(balance, currencyCode)
                : isNegative
                  ? formatAmount(balance, currencyCode)
                  : "$0"
            }
            amountTone={isPositive ? "positive" : isNegative ? "negative" : "neutral"}
            onPress={() => {
              handlePrimaryFriendAction(item.item);
            }}
          />
        </Animated.View>
      );
    },
    [currencyCode, handlePrimaryFriendAction]
  );

  if (isError) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={refetchAll} />
      </CoralScreen>
    );
  }

  if (isLoading) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    );
  }

  return (
    <CoralScreen>
      <CoralTopBar
        title="Friends"
        onBack={() => {
          if (router.canGoBack()) {
            router.back();
          } else {
            router.replace("/home");
          }
        }}
      />
      <ContextBar title="People" backTo={{ label: "Home", route: "/home" }} />

      <LargeTitle>People</LargeTitle>

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder="Search by name or email"
      />

      <Eyebrow>Balances</Eyebrow>

      {displayRows.map((item) => renderItem(item))}

      <View style={{ marginTop: 18 }}>
        <CoralButton
          label="Invite a friend"
          variant="secondary"
          onPress={() => {
            router.push("/friend/new");
          }}
        />
      </View>
    </CoralScreen>
  );
}
