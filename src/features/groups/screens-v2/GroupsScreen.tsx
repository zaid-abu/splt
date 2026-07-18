import type { JSX } from "react";
import { View, Text, ActivityIndicator } from "react-native";
import { useGroupsList } from "@/features/groups/hooks/useGroupsList";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  MoneyRow,
  CoralSearchField,
  ContextBar,
} from "@/components/coral";
import { useUI } from "@/components/ui";

export default function GroupsScreen(): JSX.Element {
  const { color } = useUI();
  const { activeGroups, search, setSearch, isLoading, preferredCurrencyCode, handleGroupPress } =
    useGroupsList();

  const filtered = search
    ? activeGroups.filter((g) => g.group.name.toLowerCase().includes(search.toLowerCase()))
    : activeGroups;

  if (isLoading && activeGroups.length === 0) {
    return (
      <CoralScreen scroll={false}>
        <CoralTopBar title="Groups" />
        <ContextBar title="Groups" backTo={{ label: "Home", route: "/home" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" color={color.muted} />
        </View>
      </CoralScreen>
    );
  }

  return (
    <CoralScreen>
      <CoralTopBar title="Groups" />
      <ContextBar title="Groups" backTo={{ label: "Home", route: "/home" }} />
      <LargeTitle>Groups</LargeTitle>

      <CoralSearchField
        value={search}
        onChangeText={setSearch}
        placeholder="Search groups..."
        style={{ marginBottom: 16 }}
      />

      {filtered.length === 0 ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", minHeight: 200 }}>
          <Text
            style={{ fontFamily: "InstrumentSans_400Regular", fontSize: 15, color: color.muted }}
          >
            {search ? "No groups match your search" : "No groups yet"}
          </Text>
        </View>
      ) : (
        filtered.map(({ group, netBalance }) => {
          const balanceCopy =
            netBalance > 0
              ? `You're owed ${formatAmount(netBalance, preferredCurrencyCode)}`
              : netBalance < 0
                ? `You owe ${formatAmount(Math.abs(netBalance), preferredCurrencyCode)}`
                : "Settled";

          return (
            <MoneyRow
              key={group.id}
              avatar={<GroupIconBadge group={group} size="sm" />}
              title={group.name}
              subtitle={`${group.members.length} people · ${balanceCopy}`}
              amount=""
              onPress={() => handleGroupPress(group.id)}
            />
          );
        })
      )}
    </CoralScreen>
  );
}
