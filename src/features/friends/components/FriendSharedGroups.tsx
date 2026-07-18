import * as icons from "lucide-react-native";
import { View, Text } from "react-native";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { MoneyRow, Eyebrow, useCoralColors } from "@/components/coral";
import { useUI } from "@/components/ui";
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
  const coral = useCoralColors();
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(50).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <View style={{ marginBottom: 28 }}>
        <Eyebrow style={{ marginTop: 0 }}>Shared Groups</Eyebrow>
        <View
          style={{
            backgroundColor: coral.surface,
            borderRadius: 16,
            borderWidth: 1,
            borderColor: coral.border,
            overflow: "hidden",
          }}
        >
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
              <MoneyRow
                avatar={<GroupIconBadge group={group} size="sm" />}
                title={group.name}
                subtitle={
                  latestExpense ? `Latest: ${latestExpense.title}` : "No shared group expenses yet"
                }
                amount=""
                rightElement={<icons.ChevronRight size={18} color={color.muted} />}
                onPress={() => {
                  Haptics.selectionAsync();
                  router.push(`/group/${group.id}`);
                }}
              />
            </View>
          ))}
        </View>
      </View>
    </Animated.View>
  );
}
