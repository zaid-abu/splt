import { PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useDeleteGroup } from "@/features/groups/queries/useGroups";

import { SwipeableRow } from "@/components/layout/SwipeableRow";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";

// ─── Design Tokens ───
const SURFACE = "#FEFDFA";
const TEXT_PRIMARY = "#1A1A1A";
const TEXT_SECONDARY = "#6E6D68";
const BORDER = "#E7E5DE";

const GROUP_BG_PALETTE = [
  "#E6D9F5", // lavender
  "#F7DCC8", // peach
  "#D6EDE1", // mint
  "#D9E6F2", // skyBlue
  "#F5DCE0", // blush
  "#EFE3CE", // sand
];

function getGroupColor(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
  return GROUP_BG_PALETTE[idx];
}

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  index?: number;
  isLast?: boolean;
  onPress?: () => void;
}

export function GroupCard({
  group,
  currentUserId,
  index = 0,
  isLast = false,
  onPress,
}: GroupCardProps): JSX.Element {
  const { mutateAsync: deleteGroup } = useDeleteGroup();

  const iconBg = getGroupColor(group.id);
  const memberCount = group.members.length;

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <SwipeableRow onDelete={() => deleteGroup(group.id)}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 14,
            paddingVertical: 12,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: BORDER,
            backgroundColor: pressed ? "#F1F0EB" : SURFACE,
          })}
        >
          {/* Leading Icon */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 0,
              backgroundColor: iconBg,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 14,
              flexShrink: 0,
            }}
          >
            <Typography
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: TEXT_PRIMARY,
                textAlign: "center",
              }}
              numberOfLines={1}
            >
              {(group.icon && group.icon.length <= 2)
                ? group.icon
                : group.name.substring(0, 1).toUpperCase()}
            </Typography>
          </View>

          {/* Title & Subtitle */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <Typography
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: TEXT_PRIMARY,
                fontFamily: "PlusJakartaSans_600SemiBold",
              }}
            >
              {group.name}
            </Typography>
            <Typography
              style={{
                fontSize: 12,
                color: TEXT_SECONDARY,
                fontFamily: "PlusJakartaSans_400Regular",
                marginTop: 2,
              }}
            >
              {memberCount} participant{memberCount !== 1 ? "s" : ""}
            </Typography>
          </View>

          {/* Trailing Icon */}
          <icons.ChevronRight size={16} color="#9B9A94" strokeWidth={2} />
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );
}
