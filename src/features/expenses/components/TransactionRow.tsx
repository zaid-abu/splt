import React, { type JSX } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { formatActivityDate } from "@/utils/date";
import { UI } from "@/components/ui/native-ui";
import type { Expense, User } from "@/types";

interface TransactionRowProps {
  expense: Expense;
  currentUserId: string;
  paidByUser?: User;
  myShare: number;
  isLast: boolean;
  onPress: () => void;
  /** Show paid-by avatar badge on the icon */
  showAvatarBadge?: boolean;
  /** Use compact padding for dashboard lists */
  compact?: boolean;
}

export const TransactionRow = React.memo(function TransactionRow({
  expense,
  currentUserId,
  paidByUser,
  myShare,
  isLast,
  onPress,
  showAvatarBadge = false,
  compact = false,
}: TransactionRowProps): JSX.Element {
  const iPaid = expense.paidBy === currentUserId;
  const paidByName = iPaid ? "You" : (paidByUser?.name.split(" ")[0] ?? "Someone");

  let subAmountText = "";
  let subAmountColor: string = UI.color.text;

  if (iPaid) {
    const lentAmount = expense.amount - myShare;
    if (lentAmount > 0) {
      subAmountText = `Lent ${formatAmount(lentAmount, expense.currency)}`;
      subAmountColor = UI.color.success;
    }
  } else if (myShare > 0) {
    subAmountText = `You owe ${formatAmount(myShare, expense.currency)}`;
    subAmountColor = UI.color.danger;
  }

  const dateStr = expense.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: compact ? 14 : 16,
        paddingHorizontal: compact ? 0 : 16,
        borderRadius: compact ? 0 : UI.radius.lg,
        backgroundColor: compact ? "transparent" : pressed ? "#FBF7F2" : "transparent",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: UI.color.border,
        opacity: pressed ? 0.62 : 1,
      })}
    >
      <View style={{ marginRight: compact ? 14 : 16, flexShrink: 0 }}>
        <CategoryIconBadge category={expense.category} size="md" />
        {showAvatarBadge && paidByUser && (
          <View
            style={{
              position: "absolute",
              bottom: -4,
              right: -4,
              width: 20,
              height: 20,
              borderRadius: UI.radius.pill,
              backgroundColor: UI.color.bg,
              borderWidth: 2,
              borderColor: UI.color.bg,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Typography
              style={{ fontSize: 10, color: UI.color.text, textAlign: "center", lineHeight: 14 }}
            >
              {paidByUser.name.charAt(0).toUpperCase()}
            </Typography>
          </View>
        )}
      </View>

      <View style={{ flex: 1, marginRight: 10 }}>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: compact ? 15 : 16,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {expense.title}
        </Typography>
        <Typography
          numberOfLines={1}
          style={{
            fontSize: compact ? 12 : 14,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            marginTop: compact ? 1 : 4,
          }}
        >
          {compact
            ? `${paidByName} paid - ${formatActivityDate(expense.date ?? expense.createdAt)}`
            : `${paidByName} paid`}
        </Typography>
      </View>

      <View style={{ alignItems: "flex-end", flexShrink: 0 }}>
        <Typography
          style={{
            fontSize: compact ? 15 : 16,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            letterSpacing: -0.2,
          }}
        >
          {formatAmount(expense.amount, expense.currency)}
        </Typography>
        {!!subAmountText && (
          <Typography
            style={{
              fontSize: compact ? 12 : 14,
              color: subAmountColor,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginTop: compact ? 1 : 4,
            }}
          >
            {subAmountText}
          </Typography>
        )}
        {!subAmountText && !compact && (
          <Typography
            style={{
              fontSize: 14,
              color: UI.color.muted,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 4,
            }}
          >
            {dateStr}
          </Typography>
        )}
      </View>

      {compact && (
        <icons.ChevronRight
          size={14}
          color={UI.color.muted}
          strokeWidth={1.75}
          style={{ marginLeft: 8 }}
        />
      )}
    </Pressable>
  );
});