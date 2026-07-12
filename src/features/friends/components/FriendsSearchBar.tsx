import { memo } from "react";
import type { JSX } from "react";
import { View, ScrollView, LayoutAnimation } from "react-native";
import { SearchField, FilterPill, UI } from "@/components/ui/native-ui";
import type { FriendFilter } from "@/types";

interface FriendsSearchBarProps {
  search: string;
  onSearchChange: (text: string) => void;
  onSearchClear: () => void;
  filter: FriendFilter;
  onFilterChange: (filter: FriendFilter) => void;
  filterCounts: { all: number; owes_you: number; you_owe: number; settled: number };
}

const FILTERS = ["all", "owes_you", "you_owe", "settled"] as const;
const LABELS: Record<FriendFilter, string> = {
  all: "All", owes_you: "Owes you", you_owe: "You owe", settled: "Settled",
};

export const FriendsSearchBar = memo(function FriendsSearchBar({
  search, onSearchChange, onSearchClear, filter, onFilterChange, filterCounts,
}: FriendsSearchBarProps): JSX.Element {
  return (
    <>
      <View style={{ paddingHorizontal: UI.space.page, marginBottom: 12 }}>
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
        contentContainerStyle={{ paddingHorizontal: UI.space.page, paddingBottom: 4, gap: 8 }}
      >
        {FILTERS.map((value) => (
          <FilterPill
            key={value}
            label={`${LABELS[value]} ${filterCounts[value]}`}
            isActive={filter === value}
            onPress={() => {
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
              onFilterChange(value);
            }}
          />
        ))}
      </ScrollView>
    </>
  );
});
