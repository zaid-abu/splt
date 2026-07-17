import { View } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { GlassSection, GlassRow, useUI } from "@/components/ui";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { Group, Expense } from "@/types";

interface SharedGroupWithActivity {
  group: Group;
  latestExpense: Expense | null;
}

interface FriendSharedGroupsProps {
  sharedGroupsWithRecentActivity: SharedGroupWithActivity[];
}

export function FriendSharedGroups({
  sharedGroupsWithRecentActivity,
}: FriendSharedGroupsProps): React.JSX.Element {
  const { color } = useUI();
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(50).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <GlassSection title="Shared Groups">
        {sharedGroupsWithRecentActivity.map(({ group, latestExpense }, idx) => (
          <View key={group.id}>
            {idx > 0 ? (
              <View
                style={{
                  height: 1,
                  backgroundColor: color.borderSoft,
                  marginHorizontal: 14,
                }}
              />
            ) : null}
            <GlassRow
              icon={<GroupIconBadge group={group} size="sm" />}
              title={group.name}
              subtitle={
                latestExpense
                  ? `Latest: ${latestExpense.title}`
                  : "No shared group expenses yet"
              }
              showChevron
              onPress={() => {
                Haptics.selectionAsync();
                router.push(`/group/${group.id}`);
              }}
            />
          </View>
        ))}
      </GlassSection>
    </Animated.View>
  );
}
