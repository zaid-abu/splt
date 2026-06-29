import { PressableFeedback, Typography } from "heroui-native";
import type { JSX } from "react";
import { View } from "react-native";

import { AmountDisplay } from "@/components/AmountDisplay";
import { AppUserAvatar } from "@/components/MemberAvatar";
import * as icons from "lucide-react-native";
import type { Expense } from "@/types";
import { EXPENSE_CATEGORIES } from "@/types";

interface ExpenseItemProps {
  expense: Expense;
  currentUserId: string;
  onPress?: () => void;
  showGroup?: boolean;
  groupName?: string;
  groupIcon?: string;
}

export function ExpenseItem({
  expense,
  currentUserId,
  onPress,
  showGroup = false,
  groupName,
  groupIcon,
}: ExpenseItemProps): JSX.Element {
  const myShare = expense.splits.find((s) => s.userId === currentUserId);
  const paidByMe = expense.paidBy === currentUserId;
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense.category);

  // Net relative to me: positive if I'm owed, negative if I owe
  const myNetAmount = paidByMe
    ? expense.amount - (myShare?.amount ?? 0)
    : -(myShare?.amount ?? 0);

  const dateStr = expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const CategoryIcon = (icons as any)[category?.icon ?? "Package"] || icons.Package;
  const GroupIcon = groupIcon ? (icons as any)[groupIcon] || icons.HelpCircle : null;

  return (
    <View className="mb-3">
      <PressableFeedback onPress={onPress}>
        <View className="bg-white rounded-[24px] p-4 shadow-sm border border-border flex-row items-center gap-4">
          {/* Category icon badge */}
          <View className="w-12 h-12 rounded-[16px] bg-secondary items-center justify-center">
            <CategoryIcon size={24} className="text-primary" strokeWidth={2} />
          </View>

          {/* Content */}
          <View className="flex-1 justify-center">
            <Typography type="body" className="font-bold text-foreground mb-1" numberOfLines={1}>
              {expense.title}
            </Typography>
            <View className="flex-row items-center gap-1.5 flex-wrap">
              <AppUserAvatar user={expense.paidByUser} size="sm" />
              <Typography type="body-sm" className="text-muted-foreground font-medium">
                {paidByMe ? "You" : expense.paidByUser.name.split(" ")[0]} paid
              </Typography>
              {showGroup && groupName && (
                <>
                  <Typography type="body-sm" className="text-muted-foreground">·</Typography>
                  {GroupIcon && <GroupIcon size={12} color="#8A8798" />}
                  <Typography type="body-sm" className="text-muted-foreground font-medium" numberOfLines={1}>
                    {groupName}
                  </Typography>
                </>
              )}
            </View>
          </View>

          {/* Amount + date */}
          <View className="items-end gap-1">
            <AmountDisplay amount={myNetAmount} currency={expense.currency} size="sm" colored />
            <Typography type="body-sm" className="text-muted-foreground font-medium">
              {dateStr}
            </Typography>
          </View>
        </View>
      </PressableFeedback>
    </View>
  );
}
