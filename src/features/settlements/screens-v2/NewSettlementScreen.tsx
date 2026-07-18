import type { JSX } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { CircleCheckBig } from "lucide-react-native";

import {
  CoralButton,
  CoralScreen,
  CoralTopBar,
  EmptyState,
  LargeTitle,
  MoneyRow,
} from "@/components/coral";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { useUI } from "@/components/ui";
import { useFriendsList } from "@/features/friends/hooks/useFriendsList";
import { SHELL_HREFS, settlementHref } from "@/features/navigation/shell";

export default function NewSettlementScreen(): JSX.Element {
  const router = useRouter();
  const { color } = useUI();
  const { friendRows, isLoading, isError, refetchAll, preferredCurrency } = useFriendsList();
  const candidates = friendRows.filter((row) => Math.abs(row.balance) > 0.005);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(SHELL_HREFS.home);
    }
  };

  return (
    <CoralScreen>
      <CoralTopBar title="Settle up" onBack={goBack} />
      <LargeTitle>Choose a balance.</LargeTitle>
      <Text
        style={{
          fontFamily: "InstrumentSans_400Regular",
          fontSize: 15,
          lineHeight: 22,
          color: color.muted,
          marginBottom: 12,
        }}
      >
        Select who you are recording an external payment with.
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
          <CoralButton label="Try again" variant="secondary" onPress={refetchAll} />
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
        candidates.map(({ friend, balance }) => {
          const isOwed = balance > 0;
          return (
            <MoneyRow
              key={friend.id}
              avatar={<AppUserAvatar user={friend} size="sm" />}
              title={friend.name}
              subtitle={
                isOwed
                  ? `${friend.name.split(" ")[0]} pays you`
                  : `You pay ${friend.name.split(" ")[0]}`
              }
              amount={formatAmount(Math.abs(balance), preferredCurrency.code)}
              amountTone={isOwed ? "positive" : "negative"}
              onPress={() => router.replace(settlementHref(friend.id))}
            />
          );
        })
      )}
    </CoralScreen>
  );
}
