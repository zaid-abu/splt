import React, { useMemo } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";

import { useDeleteActivity } from "@/features/activity/queries/useActivities";
import type { Activity } from "@/types";
import { useAuth } from "@/context/AppContext";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { SwipeableRow } from "@/components/layout/SwipeableRow";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const TEXT_DANGER = "#000000";
const TEXT_SUCCESS = "#4CAF82";
const SEPARATOR = "#E8E4DF";

interface ActivityItemProps {
  activity: Activity;
  index: number;
  isLast?: boolean;
}

export function ActivityItem({ activity, index, isLast }: ActivityItemProps): React.JSX.Element {
  const { currentUser } = useAuth();
  const { mutateAsync: deleteActivity } = useDeleteActivity();
  const router = useRouter();

  // Determine financial involvement
  const involvement = useMemo(() => {
    if (activity.type === "group_created") {
      return { type: "neutral", text: "Group created", amount: 0, showAmount: false };
    }
    if (activity.type === "member_joined") {
      return { type: "neutral", text: "Joined group", amount: 0, showAmount: false };
    }

    if (activity.type === "expense" && activity.expense) {
      const exp = activity.expense;
      const mySplit = exp.splits.find((s) => s.userId === currentUser.id);

      if (!mySplit) {
        return { type: "neutral", text: "Not involved", amount: 0, showAmount: false };
      }

      if (exp.paidBy === currentUser.id) {
        // You paid for it.
        const owedToYou = exp.amount - mySplit.amount;
        if (owedToYou > 0) {
          return { type: "positive", text: "You lent", amount: owedToYou, showAmount: true };
        } else {
          return { type: "neutral", text: "You paid your share", amount: 0, showAmount: false };
        }
      } else {
        // Someone else paid
        return { type: "negative", text: "You owe", amount: mySplit.amount, showAmount: true };
      }
    }

    if (activity.type === "settlement" && activity.settlement) {
      const set = activity.settlement;
      if (set.fromUserId === currentUser.id) {
        return { type: "neutral", text: "You paid", amount: set.amount, showAmount: true };
      }
      if (set.toUserId === currentUser.id) {
        return { type: "positive", text: "You received", amount: set.amount, showAmount: true };
      }
      return { type: "neutral", text: "Not involved", amount: 0, showAmount: false };
    }

    return { type: "neutral", text: "", amount: 0, showAmount: false };
  }, [activity, currentUser.id]);

  const subtitle = useMemo(() => {
    const dateStr = activity.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (activity.type === "expense" && activity.expense) {
      const paidByName = activity.expense.paidBy === currentUser.id ? "You" : (activity.expense.paidByUser?.name?.split(" ")[0] || "Someone");
      return `${paidByName} paid • ${dateStr}`;
    }
    if (activity.type === "settlement" && activity.settlement) {
       const fromName = activity.settlement.fromUserId === currentUser.id ? "You" : (activity.settlement.fromUser?.name?.split(" ")[0] || "Someone");
       const toName = activity.settlement.toUserId === currentUser.id ? "you" : (activity.settlement.toUser?.name?.split(" ")[0] || "someone");
       return `${fromName} paid ${toName} • ${dateStr}`;
    }
    return dateStr;
  }, [activity, currentUser.id]);

  const IconComponent = useMemo(() => {
    if (activity.type === "expense") return icons.Receipt;
    if (activity.type === "settlement") return icons.Banknote;
    if (activity.type === "group_created") return icons.Users;
    return icons.Activity;
  }, [activity.type]);

  const bgColors: Record<string, string> = {
    positive: "#E6F4EA",
    negative: "#FCE8E8",
    neutral: SEPARATOR,
  };

  const textColors: Record<string, string> = {
    positive: TEXT_SUCCESS,
    negative: TEXT_DANGER,
    neutral: TEXT_PRIMARY,
  };

  const iconColors: Record<string, string> = {
    positive: TEXT_SUCCESS,
    negative: TEXT_DANGER,
    neutral: TEXT_PRIMARY,
  };

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <SwipeableRow onDelete={() => deleteActivity(activity.id)}>
        <Pressable
          onPress={() => {
            if (activity.expense) {
              router.push(`/expense/${activity.expense.id}`);
            } else if (activity.groupId) {
              router.push(`/group/${activity.groupId}`);
            }
          }}
          accessibilityRole="button"
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            paddingVertical: 16,
            borderBottomWidth: isLast ? 0 : 1,
            borderBottomColor: SEPARATOR,
            opacity: pressed ? 0.5 : 1,
            backgroundColor: "transparent",
            paddingHorizontal: 24, // Optional if global padding applies, but we usually pad inside
          })}
        >
          {/* Icon Box */}
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: 0,
              backgroundColor: bgColors[involvement.type],
              alignItems: "center",
              justifyContent: "center",
              marginRight: 16,
              flexShrink: 0,
            }}
          >
            <IconComponent size={24} color={iconColors[involvement.type]} strokeWidth={1.5} />
          </View>

          {/* Title & Subtitle */}
          <View style={{ flex: 1, marginRight: 12 }}>
            <Typography numberOfLines={1} style={{ fontSize: 16, fontWeight: "700", color: TEXT_PRIMARY, fontFamily: "PlusJakartaSans_700Bold" }}>
              {activity.description}
            </Typography>
            <Typography style={{ fontSize: 14, color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
              {subtitle}
            </Typography>
          </View>

          {/* Amount / Involvement */}
          <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
            {involvement.showAmount ? (
              <>
                <Typography style={{ fontSize: 16, fontWeight: "700", color: textColors[involvement.type], fontFamily: "PlusJakartaSans_700Bold" }}>
                  {involvement.type === "positive" ? "+" : ""}
                  {formatAmount(involvement.amount, activity.currency || "USD")}
                </Typography>
                <Typography style={{ fontSize: 14, fontWeight: "700", color: textColors[involvement.type], fontFamily: "PlusJakartaSans_700Bold", marginTop: 4 }}>
                  {involvement.text}
                </Typography>
              </>
            ) : (
              <Typography style={{ fontSize: 14, fontWeight: "500", color: TEXT_SECONDARY, fontFamily: "PlusJakartaSans_500Medium", marginTop: 4 }}>
                {involvement.text}
              </Typography>
            )}
          </View>
        </Pressable>
      </SwipeableRow>
    </Animated.View>
  );
}
