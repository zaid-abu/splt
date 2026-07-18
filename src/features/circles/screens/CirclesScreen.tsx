import type { JSX, ReactNode } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";

import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import {
  CoralButton,
  CoralScreen,
  CoralSearchField,
  CoralSegment,
  CoralTopBar,
  Eyebrow,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { useUI } from "@/components/ui";
import { useFriendsList, type DisplayItem } from "@/features/friends/hooks/useFriendsList";
import { useGroupsList } from "@/features/groups/hooks/useGroupsList";
import { parseCircleSegment, type CircleSegment } from "@/features/navigation/shell";

const SEGMENTS = [
  { label: "Groups", value: "groups" },
  { label: "People", value: "people" },
] as const;

function CenteredState({ children }: { children: ReactNode }) {
  return (
    <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
      {children}
    </View>
  );
}

function signedAmount(amount: number, currency: string): string {
  if (amount > 0) return `+${formatAmount(amount, currency)}`;
  if (amount < 0) return `-${formatAmount(Math.abs(amount), currency)}`;
  return formatAmount(0, currency);
}

export default function CirclesScreen(): JSX.Element {
  const params = useLocalSearchParams<{ segment?: string | string[] }>();
  const router = useRouter();
  const { color } = useUI();
  const segment = parseCircleSegment(params.segment);
  const groups = useGroupsList();
  const people = useFriendsList();

  const search = segment === "groups" ? groups.search : people.search;
  const setSearch = segment === "groups" ? groups.setSearch : people.setSearch;
  const isLoading = segment === "groups" ? groups.isLoading : people.isLoading;
  const isError = segment === "groups" ? groups.isError : people.isError;

  const selectSegment = (next: CircleSegment) => {
    router.setParams({ segment: next });
  };

  const retry = () => {
    if (segment === "groups") {
      groups.refetch();
    } else {
      people.refetchAll();
    }
  };

  const renderPersonItem = (item: DisplayItem) => {
    if (item.kind === "section") {
      return <Eyebrow key={item.id}>{`${item.title} · ${item.count}`}</Eyebrow>;
    }

    const { friend, balance, recentExpense } = item.item;
    const subtitle =
      balance > 0
        ? `${friend.name.split(" ")[0]} owes you ${formatAmount(balance, people.preferredCurrency.code)}`
        : balance < 0
          ? `You owe ${friend.name.split(" ")[0]} ${formatAmount(Math.abs(balance), people.preferredCurrency.code)}`
          : (recentExpense?.title ?? "Settled");

    return (
      <MoneyRow
        key={item.id}
        avatar={<AppUserAvatar user={friend} size="sm" />}
        title={friend.name}
        subtitle={subtitle}
        amount={
          Math.abs(balance) <= 0.005
            ? "Settled"
            : signedAmount(balance, people.preferredCurrency.code)
        }
        amountTone={balance > 0 ? "positive" : balance < 0 ? "negative" : "neutral"}
        onPress={() => router.push({ pathname: "/friend/[id]", params: { id: friend.id } })}
      />
    );
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Circles" />
      <LargeTitle>Your circles.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 16,
        }}
      >
        Groups and people with shared money.
      </Text>

      <CoralSegment
        options={[...SEGMENTS]}
        selected={segment}
        onSelect={(value) => selectSegment(value as CircleSegment)}
      />

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch("")}
        placeholder={segment === "groups" ? "Search groups" : "Search people"}
        style={{ marginTop: 14, marginBottom: 8 }}
      />

      {isError ? (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 18,
              color: color.text,
            }}
          >
            Could not load {segment}.
          </Text>
          <CoralButton label="Try again" variant="secondary" onPress={retry} />
        </CenteredState>
      ) : isLoading ? (
        <CenteredState>
          <ActivityIndicator color={color.text} accessibilityLabel={`Loading ${segment}`} />
        </CenteredState>
      ) : segment === "groups" ? (
        groups.filtered.length > 0 ? (
          <>
            <Eyebrow>{`${groups.filtered.length} groups`}</Eyebrow>
            {groups.filtered.map(({ group, netBalance }) => {
              const subtitle =
                netBalance > 0
                  ? `You are owed ${formatAmount(netBalance, groups.preferredCurrencyCode)}`
                  : netBalance < 0
                    ? `You owe ${formatAmount(Math.abs(netBalance), groups.preferredCurrencyCode)}`
                    : "Settled";

              return (
                <MoneyRow
                  key={group.id}
                  avatar={<GroupIconBadge group={group} size="sm" />}
                  title={group.name}
                  subtitle={`${group.members.length} people · ${subtitle}`}
                  amount={
                    Math.abs(netBalance) <= 0.005
                      ? "Settled"
                      : signedAmount(netBalance, groups.preferredCurrencyCode)
                  }
                  amountTone={netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral"}
                  onPress={() => groups.handleGroupPress(group.id)}
                />
              );
            })}
          </>
        ) : (
          <CenteredState>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 15,
                color: color.muted,
              }}
            >
              {search ? "No groups match your search." : "No groups yet."}
            </Text>
          </CenteredState>
        )
      ) : people.displayRows.length > 0 ? (
        people.displayRows.map(renderPersonItem)
      ) : (
        <CenteredState>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 15,
              color: color.muted,
            }}
          >
            {search ? "No people match your search." : "No people yet."}
          </Text>
        </CenteredState>
      )}

      <View style={{ marginTop: 20 }}>
        <CoralButton
          label={segment === "groups" ? "Create group" : "Add person"}
          variant="secondary"
          onPress={() => router.push(segment === "groups" ? "/group/new" : "/friend/new")}
        />
      </View>
    </CoralScreen>
  );
}
