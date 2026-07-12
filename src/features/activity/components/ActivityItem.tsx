import React, { useMemo, useCallback } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { useDeleteExpense } from "@/features/expenses/queries/useExpenses";
import { useDeleteSettlement } from "@/features/settlements/queries/useSettlements";
import { useDeleteActivity } from "@/features/activity/queries/useActivities";
import type { Activity } from "@/types";
import { useAuth } from "@/context/AppContext";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI } from "@/components/ui/native-ui";
import { SwipeableRow } from "@/components/layout/SwipeableRow";
import { useUIStore } from "@/store/useUIStore";

const TEXT_DANGER = UI.color.danger;
const TEXT_SUCCESS = UI.color.success;
const CARD_RADIUS = UI.radius.lg;

interface ActivityItemProps {
  activity: Activity;
  index: number;
  isLast?: boolean;
}

export const ActivityItem = React.memo(function ActivityItem({
  activity,
  index,
  isLast,
}: ActivityItemProps): React.JSX.Element {
  const { currentUser } = useAuth();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { mutateAsync: deleteSettlement } = useDeleteSettlement();
  const { mutateAsync: deleteActivity } = useDeleteActivity();
  const router = useRouter();
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);

  const involvement = useMemo(() => {
    if (activity.type === "group_created") {
      return { type: "neutral" as const, text: "Group created", amount: 0, showAmount: false };
    }
    if (activity.type === "member_joined") {
      return { type: "neutral" as const, text: "Joined group", amount: 0, showAmount: false };
    }

    if (activity.type === "expense" && activity.expense) {
      const exp = activity.expense;
      const mySplit = exp.splits.find((s) => s.userId === currentUser.id);

      if (!mySplit) {
        return { type: "neutral" as const, text: "Not involved", amount: 0, showAmount: false };
      }

      if (exp.paidBy === currentUser.id) {
        const owedToYou = exp.amount - mySplit.amount;
        if (owedToYou > 0) {
          return {
            type: "positive" as const,
            text: "You lent",
            amount: owedToYou,
            showAmount: true,
          };
        }
        return {
          type: "neutral" as const,
          text: "You paid your share",
          amount: 0,
          showAmount: false,
        };
      } else {
        return {
          type: "negative" as const,
          text: "You owe",
          amount: mySplit.amount,
          showAmount: true,
        };
      }
    }

    if (activity.type === "settlement" && activity.settlement) {
      const set = activity.settlement;
      if (set.fromUserId === currentUser.id) {
        return { type: "neutral" as const, text: "You paid", amount: set.amount, showAmount: true };
      }
      if (set.toUserId === currentUser.id) {
        return {
          type: "positive" as const,
          text: "You received",
          amount: set.amount,
          showAmount: true,
        };
      }
      return { type: "neutral" as const, text: "Not involved", amount: 0, showAmount: false };
    }

    return { type: "neutral" as const, text: "", amount: 0, showAmount: false };
  }, [activity, currentUser.id]);

  const subtitle = useMemo(() => {
    const dateStr = activity.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    if (activity.type === "expense" && activity.expense) {
      const paidByName =
        activity.expense.paidBy === currentUser.id
          ? "You"
          : activity.expense.paidByUser?.name?.split(" ")[0] || "Someone";
      return `${paidByName} paid \u2022 ${dateStr}`;
    }
    if (activity.type === "settlement" && activity.settlement) {
      const fromName =
        activity.settlement.fromUserId === currentUser.id
          ? "You"
          : activity.settlement.fromUser?.name?.split(" ")[0] || "Someone";
      const toName =
        activity.settlement.toUserId === currentUser.id
          ? "you"
          : activity.settlement.toUser?.name?.split(" ")[0] || "someone";
      return `${fromName} paid ${toName} \u2022 ${dateStr}`;
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
    neutral: UI.color.border,
  };

  const textColors: Record<string, string> = {
    positive: TEXT_SUCCESS,
    negative: TEXT_DANGER,
    neutral: UI.color.text,
  };

  const iconColors: Record<string, string> = {
    positive: TEXT_SUCCESS,
    negative: TEXT_DANGER,
    neutral: UI.color.text,
  };

  const canDelete = activity.type === "expense" || activity.type === "settlement";

  const handlePress = useCallback(() => {
    Haptics.selectionAsync();
    if (activity.expense) {
      router.push(`/expense/${activity.expense.id}`);
    } else if (activity.settlement) {
      if (activity.groupId) {
        router.push(`/group/${activity.groupId}`);
      } else {
        const otherUserId =
          activity.settlement.fromUserId === currentUser.id
            ? activity.settlement.toUserId
            : activity.settlement.fromUserId;
        router.push(`/friend/${otherUserId}`);
      }
    } else if (activity.groupId) {
      router.push(`/group/${activity.groupId}`);
    }
  }, [activity, router, currentUser.id]);

  const handleDelete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      if (activity.type === "expense" && activity.expense) {
        await deleteExpense(activity.expense.id);
      } else if (activity.type === "settlement" && activity.settlement) {
        await deleteSettlement(activity.settlement.id);
      }
      await deleteActivity(activity.id);
    } catch {
      // handled by query client
    }
  }, [activity, deleteExpense, deleteSettlement, deleteActivity]);

  return (
    <SwipeableRow onDelete={canDelete ? handleDelete : undefined}>
      <Pressable
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityLabel={`${activity.description}. ${involvement.text} ${involvement.showAmount ? formatAmount(involvement.amount, activity.currency || preferredCurrency?.code || "USD") : ""}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: UI.color.border,
          backgroundColor: pressed ? UI.color.subtle : "transparent",
        })}
      >
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: CARD_RADIUS,
            backgroundColor: bgColors[involvement.type],
            alignItems: "center",
            justifyContent: "center",
            marginRight: 14,
            flexShrink: 0,
          }}
        >
          <IconComponent size={22} color={iconColors[involvement.type]} strokeWidth={1.5} />
        </View>

        <View style={{ flex: 1, marginRight: 10 }}>
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 15,
              color: UI.color.text,
              fontFamily: "IBMPlexSans_600SemiBold",
              letterSpacing: -0.2,
            }}
          >
            {activity.description}
          </Typography>
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 13,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 3,
            }}
          >
            {subtitle}
          </Typography>
        </View>

        <View style={{ alignItems: "flex-end", maxWidth: 110 }}>
          {involvement.showAmount ? (
            <Typography
              numberOfLines={1}
              adjustsFontSizeToFit
              style={{
                fontSize: 15,
                color: textColors[involvement.type],
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: -0.2,
              }}
            >
              {involvement.type === "positive" ? "+" : ""}
              {formatAmount(
                involvement.amount,
                activity.currency || preferredCurrency?.code || "USD"
              )}
            </Typography>
          ) : null}
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: involvement.showAmount ? textColors[involvement.type] : UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 2,
            }}
          >
            {involvement.text}
          </Typography>
        </View>

        <icons.ChevronRight
          size={14}
          color={UI.color.muted}
          strokeWidth={1.75}
          style={{ marginLeft: 8 }}
        />
      </Pressable>
    </SwipeableRow>
  );
});
