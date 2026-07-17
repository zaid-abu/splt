import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { useRouter } from "expo-router";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import { SectionLabel, useUI } from "@/components/ui";
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
  const { color, radius } = useUI();
  const router = useRouter();

  return (
    <Animated.View
      entering={FadeInDown.duration(400).delay(50).springify()}
      style={{ paddingHorizontal: 24, marginBottom: 40 }}
    >
      <SectionLabel>Shared Groups</SectionLabel>
      <View
        style={{
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: color.border,
          backgroundColor: color.surface,
        }}
      >
        {sharedGroupsWithRecentActivity.map(({ group, latestExpense }, idx) => (
          <Pressable
            key={group.id}
            accessibilityRole="button"
            onPress={() => {
              Haptics.selectionAsync();
              router.push(`/group/${group.id}`);
            }}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              borderBottomWidth:
                idx < sharedGroupsWithRecentActivity.length - 1 ? 1 : 0,
              borderBottomColor: color.border,
              backgroundColor: pressed ? color.subtle : "transparent",
              borderTopLeftRadius: idx === 0 ? radius.lg : 0,
              borderTopRightRadius: idx === 0 ? radius.lg : 0,
              borderBottomLeftRadius:
                idx === sharedGroupsWithRecentActivity.length - 1 ? radius.lg : 0,
              borderBottomRightRadius:
                idx === sharedGroupsWithRecentActivity.length - 1 ? radius.lg : 0,
            })}
          >
            <GroupIconBadge group={group} size="sm" />
            <View style={{ flex: 1, minWidth: 0, marginLeft: 12, marginRight: 12 }}>
              <Typography
                numberOfLines={1}
                style={{
                  fontSize: 16,
                  color: color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {group.name}
              </Typography>
              <Typography
                numberOfLines={1}
                style={{
                  marginTop: 3,
                  fontSize: 13,
                  color: color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                {latestExpense
                  ? `Latest: ${latestExpense.title}`
                  : "No shared group expenses yet"}
              </Typography>
            </View>
            <icons.ChevronRight size={18} color={color.muted} strokeWidth={1.8} />
          </Pressable>
        ))}
      </View>
    </Animated.View>
  );
}
