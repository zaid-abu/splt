import type { JSX } from "react";
import { View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useDeleteGroup } from "@/features/groups/queries/useGroups";

import { Text } from "@/components/primitives/Text";
import { Pressable } from "@/components/primitives/Pressable";
import { formatAmount } from "@/components/ui/AmountDisplay";
import type { Group } from "@/types";

const GROUP_BG_PALETTE = [
  "#2D1A0C", "#0C1A2D", "#2D0C1F", "#1C0C2D",
  "#0C2D1A", "#0C2D2D", "#2D0C0C", "#0C0C2D",
];

function getGroupColor(id: string): string {
  const idx = id.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % GROUP_BG_PALETTE.length;
  return GROUP_BG_PALETTE[idx];
}

interface GroupCardProps {
  group: Group;
  currentUserId: string;
  balance?: number;
  currency?: string;
  index?: number;
  isLast?: boolean;
  onPress?: () => void;
}

export function GroupCard({
  group,
  currentUserId,
  balance = 0,
  currency = "USD",
  index = 0,
  isLast = false,
  onPress,
}: GroupCardProps): JSX.Element {
  const { mutateAsync: deleteGroup } = useDeleteGroup();

  const iconBg = getGroupColor(group.id);
  const memberCount = group.members.length;

  let subAmountColor: "success" | "danger" | "muted" = "muted";
  let subAmountText = "";

  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = "danger";
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = "success";
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <Pressable 
        onPress={onPress} 
        className={`flex-row items-center py-4 px-4 active:bg-surface-2 ${!isLast ? "border-b border-border" : ""}`}
      >
        <View
          style={{ backgroundColor: iconBg }}
          className="w-12 h-12 rounded-xl items-center justify-center shrink-0 mr-4"
        >
          <Text variant="sectionLabel" className="text-center text-foreground" numberOfLines={1}>
            {group.icon && group.icon.length <= 2
              ? group.icon
              : group.name.substring(0, 1).toUpperCase()}
          </Text>
        </View>

        <View className="flex-1 mr-3">
          <Text variant="body" className="font-bold text-foreground mb-1" numberOfLines={1}>{group.name}</Text>
          <Text variant="bodySmall" color="muted">
            {memberCount} participant{memberCount !== 1 ? "s" : ""}
          </Text>
        </View>

        <View className="items-end">
          <Text variant="bodySmall" className={`font-bold ${subAmountColor === "success" ? "text-success" : subAmountColor === "danger" ? "text-danger" : "text-muted"}`}>
            {subAmountText}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}
