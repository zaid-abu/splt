import type { JSX } from "react";
import { View, FlatList, RefreshControl } from "react-native";
import { useRouter } from "expo-router";
import { Repeat } from "lucide-react-native";
import * as Haptics from "expo-haptics";

import { CoralScreen } from "@/components/coral/CoralScreen";
import { CoralTopBar } from "@/components/coral/CoralTopBar";
import { LargeTitle } from "@/components/coral/LargeTitle";
import { MoneyRow } from "@/components/coral/MoneyRow";
import { CoralButton } from "@/components/coral/CoralButton";
import { CoralChip } from "@/components/coral/CoralChip";
import { CoralSearchField } from "@/components/coral/CoralSearchField";
import { useCoralColors } from "@/components/coral/useCoral";
import { EmptyState } from "@/components/coral/EmptyState";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { useUI } from "@/components/ui";
import { useUIStore } from "@/store/useUIStore";

import { useRecurringList } from "@/features/recurring/hooks/useRecurringList";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useAuth } from "@/context/AppContext";

const CADENCE_LABELS: Record<string, string> = {
  weekly: "weekly",
  monthly: "monthly",
  yearly: "yearly",
};

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function RecurringListScreen(): JSX.Element {
  const router = useRouter();
  const coral = useCoralColors();
  const { color } = useUI();
  const { currentUser } = useAuth();
  const { data: groups = [] } = useGroups(currentUser?.id);
  const isDark = useUIStore((s) => s.isDarkMode);

  const {
    filtered,
    filter,
    setFilter,
    isLoading,
    isError,
    refreshing,
    onRefresh,
    refetch,
    search,
    setSearch,
    handleCreateRecurring,
    handleRecurringPress,
  } = useRecurringList();

  const getGroupName = (groupId: string): string => {
    const group = groups.find((g) => g.id === groupId);
    return group?.name ?? "";
  };

  const handleCreate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push("/recurring/new");
  };

  const handlePress = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/recurring/${id}`);
  };

  const subtitleFor = (item: {
    frequency: string;
    intervalValue: number;
    dayOfWeek: number | null;
    dayOfMonth: number | null;
    groupId: string;
    status: string;
  }) => {
    const freqLabel =
      item.intervalValue > 1
        ? `Every ${item.intervalValue} ${CADENCE_LABELS[item.frequency] ?? item.frequency}`
        : (CADENCE_LABELS[item.frequency] ?? item.frequency);

    let dayLabel = "";
    if (item.frequency === "monthly" && item.dayOfMonth !== null) {
      dayLabel =
        item.dayOfMonth === 1
          ? "1st"
          : item.dayOfMonth === 2
            ? "2nd"
            : item.dayOfMonth === 3
              ? "3rd"
              : `${item.dayOfMonth}th`;
    } else if (item.frequency === "weekly" && item.dayOfWeek !== null) {
      dayLabel = DAYS_OF_WEEK[item.dayOfWeek] ?? "";
    }

    const groupName = getGroupName(item.groupId);
    const parts = [
      dayLabel ? `${dayLabel} ${freqLabel}` : freqLabel,
      groupName,
      item.status === "paused" ? "Paused" : "",
    ].filter(Boolean);
    return parts.join(" · ");
  };

  const amountFor = (item: { amount: number | null; currencyCode: string; status: string }) => {
    if (item.amount !== null) {
      return formatAmount(item.amount, item.currencyCode);
    }
    return "Variable";
  };

  return (
    <CoralScreen scroll={false}>
      <CoralTopBar title="Recurring" onBack={() => router.canGoBack() && router.back()} />

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View>
            <LargeTitle>The things that repeat.</LargeTitle>
            <MoneyRow
              title=""
              subtitle="Splt prepares the expense and reminds the payer before it posts."
              amount=""
              amountTone="neutral"
            />

            <View style={{ marginBottom: 10 }}>
              <CoralSearchField
                value={search}
                onChangeText={setSearch}
                onClear={() => setSearch("")}
                placeholder="Search recurring..."
              />
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 14 }}>
              {[
                { key: "all" as const, label: "All" },
                { key: "active" as const, label: "Active" },
                { key: "paused" as const, label: "Paused" },
              ].map((f) => (
                <CoralChip
                  key={f.key}
                  label={f.label}
                  isActive={filter === f.key}
                  onPress={() => setFilter(f.key)}
                />
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              visual={<Repeat size={48} color={coral.muted} strokeWidth={1.2} />}
              title="No recurring expenses"
              subtitle="Set up a schedule to automatically split rent, bills, and subscriptions."
            />
          )
        }
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={color.text} />
        }
        renderItem={({ item }) => (
          <MoneyRow
            title={item.title}
            subtitle={subtitleFor(item)}
            amount={amountFor(item)}
            amountTone={item.status === "paused" ? "negative" : "neutral"}
            onPress={() => handlePress(item.id)}
          />
        )}
        ListFooterComponent={
          <View style={{ marginTop: 18 }}>
            <CoralButton label="Add recurring expense" onPress={handleCreate} variant="secondary" />
          </View>
        }
      />
    </CoralScreen>
  );
}
