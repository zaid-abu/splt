import { useMemo, type JSX } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import { CircleCheckBig } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  EmptyState,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { SHELL_HREFS } from "@/features/navigation/shell";
import { useOpenBalances } from "@/features/balances/queries/useBalances";
import { useFriendsList } from "@/features/friends/hooks/useFriendsList";
import { useAuth } from "@/context/AppContext";
import type { OpenBalance } from "@/features/money/types";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { minorToMajor } from "@/features/money/splits";
import { useGroups } from "@/features/groups/queries/useGroups";
import { openSettlementComposer } from "@/features/settlements/utils/navigation";

type CounterpartyGroup = {
  counterpartyId: string;
  counterpartyName: string;
  counterpartyAvatar?: string;
  entries: OpenBalance[];
};

export default function NewSettlementScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ groupId?: string; counterpartyId?: string }>();
  const { color } = useUI();
  const { currentUser } = useAuth();
  const filterGroupId = params.groupId ?? undefined;
  const filterCounterpartyId = params.counterpartyId ?? undefined;
  const { data: balances, isLoading, isError, refetch } = useOpenBalances(currentUser?.id);
  const { friendRows } = useFriendsList();
  const { data: groups } = useGroups(currentUser?.id);

  const friendshipByCounterparty = useMemo(() => {
    const map = new Map<string, string>();
    for (const row of friendRows) {
      if (row.friendship?.id) map.set(row.friend.id, row.friendship.id);
    }
    return map;
  }, [friendRows]);

  const userNameMap = useMemo(() => {
    const map = new Map<string, { name: string; avatar?: string }>();
    for (const row of friendRows) {
      map.set(row.friend.id, { name: row.friend.name, avatar: row.friend.avatar });
    }
    if (groups) {
      for (const group of groups) {
        for (const member of group.members) {
          if (!map.has(member.user.id)) {
            map.set(member.user.id, { name: member.user.name, avatar: member.user.avatar });
          }
        }
      }
    }
    return map;
  }, [friendRows, groups]);

  const candidates = useMemo(() => {
    if (!balances) return [];
    const filtered = filterGroupId
      ? balances.filter((b) => b.context.type === "group" && b.context.groupId === filterGroupId)
      : filterCounterpartyId
        ? balances.filter((b) => b.counterpartyId === filterCounterpartyId)
        : balances;
    const flat: CounterpartyGroup[] = [];
    for (let b of filtered) {
      if (b.signedAmountMinor === 0) continue;
      if (b.context.type === "direct" && !b.context.friendshipId) {
        const friendshipId = friendshipByCounterparty.get(b.counterpartyId);
        if (!friendshipId) continue;
        b = { ...b, context: { type: "direct", friendshipId } };
      }
      const userDetails = userNameMap.get(b.counterpartyId);
      flat.push({
        counterpartyId: b.counterpartyId,
        counterpartyName: userDetails?.name || b.counterpartyId,
        counterpartyAvatar: userDetails?.avatar,
        entries: [b],
      });
    }
    return flat;
  }, [balances, userNameMap, friendshipByCounterparty, filterGroupId, filterCounterpartyId]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(SHELL_HREFS.home);
    }
  };

  const handleSelectCounterparty = (group: CounterpartyGroup) => {
    const entry = group.entries[0];
    if (!entry) return;
    openSettlementComposer(router, group.counterpartyId, entry);
  };

  const counterpartyName = candidates[0]?.counterpartyName ?? "";

  return (
    <CoralScreen>
      <CoralTopBar
        title={
          filterGroupId
            ? "Settle in group"
            : filterCounterpartyId
              ? `Settle with ${counterpartyName}`
              : "Settle up"
        }
        onBack={goBack}
      />

      <>
        <LargeTitle>
          {filterCounterpartyId ? `Balances with ${counterpartyName}` : "Choose a balance."}
        </LargeTitle>
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 15,
            lineHeight: 22,
            color: color.muted,
            marginBottom: 12,
          }}
        >
          {filterCounterpartyId
            ? "Choose a balance to record a payment."
            : "Select a balance to settle."}
        </Text>

        {isError ? (
          <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center", gap: 14 }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 18,
                color: color.text,
              }}
            >
              Could not load balances.
            </Text>
            <CoralButton label="Try again" variant="secondary" onPress={() => refetch()} />
          </View>
        ) : isLoading ? (
          <View style={{ minHeight: 280, alignItems: "center", justifyContent: "center" }}>
            <ActivityIndicator color={color.text} accessibilityLabel="Loading balances" />
          </View>
        ) : candidates.length === 0 ? (
          <EmptyState
            visual={<CircleCheckBig size={48} color={color.muted} strokeWidth={1.4} />}
            title="No open balances"
            subtitle="Everyone is settled. Open People to review your circles."
          >
            <View style={{ width: "100%", marginTop: 18 }}>
              <CoralButton
                label="View people"
                variant="secondary"
                onPress={() => router.replace(SHELL_HREFS.circlesPeople)}
              />
            </View>
          </EmptyState>
        ) : (
          candidates.map((group, idx) => {
            const entry = group.entries[0];
            if (!entry) return null;
            const isOwed = entry.signedAmountMinor > 0;
            const contextName =
              entry.context.type === "group"
                ? groups?.find((g) => g.id === entry.context.groupId)?.name
                : "Direct";
            return (
              <MoneyRow
                key={`${group.counterpartyId}-${idx}`}
                avatar={
                  <AppUserAvatar
                    user={{
                      id: group.counterpartyId,
                      name: group.counterpartyName,
                      initials: group.counterpartyName.charAt(0).toUpperCase(),
                    }}
                    size="sm"
                  />
                }
                title={group.counterpartyName}
                subtitle={
                  contextName
                    ? `${isOwed ? "Owes you" : "You owe"} \u00B7 ${contextName}`
                    : isOwed
                      ? `${group.counterpartyName.split(" ")[0]} pays you`
                      : `You pay ${group.counterpartyName.split(" ")[0]}`
                }
                amount={formatAmount(
                  minorToMajor(Math.abs(entry.signedAmountMinor), entry.currency),
                  entry.currency
                )}
                amountTone={isOwed ? "positive" : "negative"}
                onPress={() => handleSelectCounterparty(group)}
              />
            );
          })
        )}
      </>
    </CoralScreen>
  );
}
