import { PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View, Pressable } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useDeleteGroup } from "@/features/groups/queries/useGroups";

import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { formatAmount } from "@/components/ui/AmountDisplay";
import * as icons from "lucide-react-native";
import type { Group } from "@/types";

// ─── Design Tokens ───
const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

const GROUP_BG_PALETTE = ["#FAFAFA", "#F8F8F8"];

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

  let subAmountText = "";
  let subAmountColor = TEXT_SECONDARY;
  
  if (balance < 0) {
    subAmountText = `You owe ${formatAmount(Math.abs(balance), currency)}`;
    subAmountColor = TEXT_DANGER;
  } else if (balance > 0) {
    subAmountText = `Owes you ${formatAmount(balance, currency)}`;
    subAmountColor = TEXT_SUCCESS;
  } else {
    subAmountText = "Settled up";
  }

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <SwipeableRow onDelete={() => deleteGroup(group.id)}>
        <Pressable
          accessibilityRole="button"
          onPress={onPress}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 24,
            paddingVertical: 16,
            borderBottomWidth: 1,
            borderBottomColor: SEPARATOR,
            backgroundColor: BG,
            opacity: pressed ? 0.5 : 1,
          })}
        >
          {/* Leading Icon */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 0,
              backgroundColor: iconBg,
              borderWidth: 1,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              flexShrink: 0,
            }}
          >
            <Typography
              style={{
                fontSize: 20,
                textAlign: "center",
                color: TEXT_PRIMARY,
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
                fontSize: 16,
                fontWeight: "700",
                color: TEXT_PRIMARY,
                fontFamily: "PlusJakartaSans_700Bold",
                letterSpacing: -0.3,
              }}
            >
              {group.name}
            </Typography>
            <Typography
              style={{
                fontSize: 14,
                color: TEXT_SECONDARY,
                fontFamily: "PlusJakartaSans_500Medium",
                marginTop: 4,
              }}
            >
              {memberCount} participant{memberCount !== 1 ? "s" : ""}
            </Typography>
          </View>

          {/* Trailing Balance */}
          <View style={{ alignItems: "flex-end" }}>
            <Typography
              style={{
                fontSize: 14,
                fontWeight: "700",
                color: subAmountColor,
                fontFamily: "PlusJakartaSans_700Bold",
              }}
            >
              {subAmountText}
            </Typography>
          </View>
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );
}
