import { View, ScrollView, Pressable } from "react-native";
import { Typography } from "heroui-native";
import { UI, SectionLabel } from "@/components/ui/native-ui";
import { GroupIconBadge } from "@/components/ui/GroupIconBadge";
import type { Group } from "@/types";

interface MutualGroupsProps {
  groups: Group[];
  onGroupPress: (groupId: string) => void;
}

export function MutualGroups({ groups, onGroupPress }: MutualGroupsProps) {
  if (groups.length === 0) return null;

  return (
    <View style={{ marginBottom: 32 }}>
      <View style={{ paddingHorizontal: 24, marginBottom: 14 }}>
        <SectionLabel>Mutual Groups</SectionLabel>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 24, gap: 18 }}
      >
        {groups.map((group) => (
          <Pressable
            key={group.id}
            onPress={() => onGroupPress(group.id)}
            style={({ pressed }) => ({
              alignItems: "center",
              gap: 8,
              width: 76,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <GroupIconBadge group={group} size="md" />
            <Typography
              numberOfLines={2}
              style={{
                fontSize: 11,
                color: UI.color.text,
                fontFamily: "IBMPlexSans_500Medium",
                textAlign: "center",
                lineHeight: 14,
              }}
            >
              {group.name}
            </Typography>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
