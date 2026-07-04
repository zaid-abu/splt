import React, { useMemo } from "react";
import { View } from "react-native";
import { Typography, ListGroup } from "heroui-native";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useRouter } from "expo-router";
import {
  useGroups,
  useCreateGroup,
  useUpdateGroup,
  useDeleteGroup,
  useAddGroupMembers,
} from "@/queries/useGroups";
import {
  useUserExpenses,
  useAddExpense,
  useUpdateExpense,
  useDeleteExpense,
} from "@/queries/useExpenses";
import { useUserActivities, useLogActivity, useDeleteActivity } from "@/queries/useActivities";
import { useUserSettlements, useAddSettlement } from "@/queries/useSettlements";
import * as balancesUtil from "@/utils/balances";

import type { Activity } from "@/types";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { formatAmount } from "@/components/AmountDisplay";
import { SwipeableRow } from "@/components/SwipeableRow";

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

  const IconComponent = useMemo(() => {
    if (activity.type === "expense") return icons.Receipt;
    if (activity.type === "settlement") return icons.Banknote;
    if (activity.type === "group_created") return icons.Users;
    return icons.Activity;
  }, [activity.type]);

  const bgColors: Record<string, string> = {
    positive: "bg-success/10",
    negative: "bg-danger/10",
    neutral: "bg-secondary",
  };

  const textColors: Record<string, string> = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-foreground",
  };

  const iconColors: Record<string, string> = {
    positive: "text-success",
    negative: "text-danger",
    neutral: "text-muted-foreground",
  };

  return (
    <Animated.View entering={FadeInDown.delay(100 + index * 50).springify()}>
      <SwipeableRow onDelete={() => deleteActivity(activity.id)}>
        <ListGroup.Item
          onPress={() => {
            if (activity.expense) {
              router.push(`/expense/${activity.expense.id}`);
            } else if (activity.groupId) {
              router.push(`/group/${activity.groupId}`);
            }
          }}
          className={`p-4 ${!isLast ? "border-b border-border/50" : ""}`}
        >
          <ListGroup.ItemPrefix>
            <View
              className={`w-12 h-12 rounded-[16px] items-center justify-center mr-4 ${bgColors[involvement.type]}`}
            >
              <IconComponent size={24} className={iconColors[involvement.type]} strokeWidth={2.5} />
            </View>
          </ListGroup.ItemPrefix>

          <ListGroup.ItemContent>
            <ListGroup.ItemTitle className="font-bold text-foreground" numberOfLines={1}>
              {activity.description}
            </ListGroup.ItemTitle>
            <ListGroup.ItemDescription
              className="text-muted-foreground font-medium mt-0.5"
              numberOfLines={1}
            >
              {activity.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
            </ListGroup.ItemDescription>
          </ListGroup.ItemContent>

          <ListGroup.ItemSuffix className="items-end ml-4">
            {involvement.showAmount ? (
              <>
                <Typography type="body-xs" className="text-muted-foreground font-bold mb-0.5">
                  {involvement.text}
                </Typography>
                <Typography type="body" className={`font-black ${textColors[involvement.type]}`}>
                  {involvement.type === "positive" ? "+" : ""}
                  {formatAmount(involvement.amount, activity.currency || "USD")}
                </Typography>
              </>
            ) : (
              <Typography type="body-sm" className="text-muted-foreground font-medium">
                {involvement.text}
              </Typography>
            )}
          </ListGroup.ItemSuffix>
        </ListGroup.Item>
      </SwipeableRow>
    </Animated.View>
  );
}
