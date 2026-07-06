import React, { useMemo } from "react";
import { View } from "react-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";

import { useDeleteActivity } from "@/features/activity/queries/useActivities";
import type { Activity } from "@/types";
import { useAuth } from "@/context/AppContext";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { Text } from "@/components/primitives/Text";
import { Pressable } from "@/components/primitives/Pressable";

interface ActivityItemProps {
  activity: Activity;
  index: number;
  isFirst?: boolean;
  isLast?: boolean;
}

export function ActivityItem({ activity, index, isFirst, isLast }: ActivityItemProps): React.JSX.Element {
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
  const { mutateAsync: deleteActivity } = useDeleteActivity();
  const router = useRouter();

  const involvement = useMemo(() => {
    if (activity.type === "group_created") {
      return { type: "neutral", text: "Group created", amount: 0, showAmount: false };
    }
    if (activity.type === "member_joined") {
      return { type: "neutral", text: "Joined group", amount: 0, showAmount: false };
    }

    if (activity.type === "expense" && activity.expense) {
      const exp = activity.expense;
      const mySplit = exp.splits.find((s) => s.userId === userId);

      if (!mySplit) {
        return { type: "neutral", text: "Not involved", amount: 0, showAmount: false };
      }

      if (exp.paidBy === userId) {
        const owedToYou = exp.amount - mySplit.amount;
        if (owedToYou > 0) {
          return { type: "positive", text: "You lent", amount: owedToYou, showAmount: true };
        } else {
          return { type: "neutral", text: "You paid your share", amount: 0, showAmount: false };
        }
      } else {
        return { type: "negative", text: "You owe", amount: mySplit.amount, showAmount: true };
      }
    }

    if (activity.type === "settlement" && activity.settlement) {
      const set = activity.settlement;
      if (set.fromUserId === userId) {
        return { type: "neutral", text: "You paid", amount: set.amount, showAmount: true };
      }
      if (set.toUserId === userId) {
        return { type: "positive", text: "You received", amount: set.amount, showAmount: true };
      }
      return { type: "neutral", text: "Not involved", amount: 0, showAmount: false };
    }

    return { type: "neutral", text: "", amount: 0, showAmount: false };
  }, [activity, userId]);

  const subtitle = useMemo(() => {
    const dateStr = activity.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (activity.type === "expense" && activity.expense) {
      const paidByName =
        activity.expense.paidBy === userId
          ? "You"
          : activity.expense.paidByUser?.name?.split(" ")[0] || "Someone";
      return `${paidByName} paid • ${dateStr}`;
    }
    if (activity.type === "settlement" && activity.settlement) {
      const fromName =
        activity.settlement.fromUserId === userId
          ? "You"
          : activity.settlement.fromUser?.name?.split(" ")[0] || "Someone";
      const toName =
        activity.settlement.toUserId === userId
          ? "you"
          : activity.settlement.toUser?.name?.split(" ")[0] || "someone";
      return `${fromName} paid ${toName} • ${dateStr}`;
    }
    return dateStr;
  }, [activity, userId]);

  const IconComponent = useMemo(() => {
    if (activity.type === "expense") return icons.Receipt;
    if (activity.type === "settlement") return icons.Banknote;
    if (activity.type === "group_created") return icons.Users;
    return icons.Activity;
  }, [activity.type]);

  const iconBgMap: Record<string, string> = {
    positive: "bg-success/10",
    negative: "bg-danger/10",
    neutral: "bg-surface-2",
  };

  const iconColorMap: Record<string, string> = {
    positive: "#22C55E",
    negative: "#EF4444",
    neutral: "#FB923C",
  };

  const textColorMap: Record<string, "success" | "danger" | "foreground"> = {
    positive: "success",
    negative: "danger",
    neutral: "foreground",
  };

  if (!currentUser) return <></>;
  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()} className="px-6">
      <View
        className={`bg-surface shadow-sm border-x border-border
          ${isFirst ? "rounded-t-2xl border-t mt-2" : ""}
          ${isLast ? "rounded-b-2xl border-b mb-6" : ""}
        `}
      >
        <Pressable
          onPress={() => {
            if (activity.expense) {
              router.push(`/expense/${activity.expense.id}`);
            } else if (activity.groupId) {
              router.push(`/group/${activity.groupId}`);
            }
          }}
          className={`flex-row items-center border-0 bg-transparent px-4 py-4 active:bg-surface-2 ${isLast ? "" : "border-b border-border"} ${isFirst ? "rounded-t-2xl" : ""} ${isLast ? "rounded-b-2xl" : ""}`}
        >
          <View className={`w-12 h-12 rounded-xl items-center justify-center mr-4 shrink-0 border border-border ${iconBgMap[involvement.type]}`}>
            <IconComponent size={24} color={iconColorMap[involvement.type]} strokeWidth={1.5} />
          </View>
          
          <View className="flex-1">
            <Text variant="body" className="font-bold mb-0.5">{activity.description}</Text>
            <Text variant="caption" color="muted">{subtitle}</Text>
          </View>

          <View className="items-end shrink-0 ml-2">
            {involvement.showAmount ? (
              <>
                <Text variant="body" className={`font-bold ${textColorMap[involvement.type] === "success" ? "text-success" : textColorMap[involvement.type] === "danger" ? "text-danger" : "text-foreground"}`}>
                  {involvement.type === "positive" ? "+" : ""}
                  {formatAmount(involvement.amount, activity.currency || "USD")}
                </Text>
                <Text variant="bodySmall" className={`font-semibold mt-1 ${textColorMap[involvement.type] === "success" ? "text-success" : textColorMap[involvement.type] === "danger" ? "text-danger" : "text-foreground"}`}>
                  {involvement.text}
                </Text>
              </>
            ) : (
              <Text variant="bodySmall" color="muted" className="font-semibold mt-1">
                {involvement.text}
              </Text>
            )}
          </View>
        </Pressable>
      </View>
    </Animated.View>
  );
}
