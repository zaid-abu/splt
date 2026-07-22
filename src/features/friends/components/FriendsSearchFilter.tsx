import { View, ScrollView } from "react-native";
import { SearchField, FilterPill, useUI } from "@/components/ui";
import type { FriendFilter } from "@/types";

interface FriendsSearchFilterProps {
  search: string;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
  filter: FriendFilter;
  onFilterChange: (filter: FriendFilter) => void;
  filterCounts: Record<FriendFilter, number>;
}

const FILTER_OPTIONS: readonly FriendFilter[] = ["all", "owes_you", "you_owe", "settled"];

const FILTER_LABELS: Record<FriendFilter, string> = {
  all: "All",
  owes_you: "Owes you",
  you_owe: "You owe",
  settled: "Settled",
};

export function FriendsSearchFilter({
  search,
  onSearchChange,
  onSearchClear,
  filter,
  onFilterChange,
  filterCounts,
}: FriendsSearchFilterProps): React.JSX.Element {
  const { space } = useUI();

  return (
    <View>
      <View style={{ paddingHorizontal: space.page, marginBottom: 12 }}>
        <SearchField
          value={search}
          onChangeText={onSearchChange}
          onClear={onSearchClear}
          placeholder="Search friends or email"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: space.page,
          paddingBottom: 4,
          gap: 8,
        }}
      >
        {FILTER_OPTIONS.map((value) => (
          <FilterPill
            key={value}
            label={`${FILTER_LABELS[value]} ${filterCounts[value]}`}
            isActive={filter === value}
            onPress={() => {
              onFilterChange(value);
            }}
          />
        ))}
      </ScrollView>
    </View>
  );
}
