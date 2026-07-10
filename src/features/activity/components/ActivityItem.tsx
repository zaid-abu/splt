import React, { useMemo, useRef, useCallback } from "react";
import { View, Pressable } from "react-native";
import { Typography } from "heroui-native";
import * as icons from "lucide-react-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";

import { useDeleteExpense } from "@/features/expenses/queries/useExpenses";
import { useDeleteSettlement } from "@/features/settlements/queries/useSettlements";
import type { Activity } from "@/types";
import { useAuth } from "@/context/AppContext";
import { formatAmount } from "@/components/ui/AmountDisplay";
import { UI } from "@/components/ui/native-ui";
import { BlurredSheetBackground } from "@/components/ui/SheetBackground";

const TEXT_PRIMARY = UI.color.text;
const TEXT_SECONDARY = UI.color.muted;
const TEXT_DANGER = UI.color.danger;
const TEXT_SUCCESS = UI.color.success;
const SEPARATOR = UI.color.border;
const CARD_RADIUS = UI.radius.lg;

interface ActivityItemProps {
  activity: Activity;
  index: number;
  isLast?: boolean;
}

export const ActivityItem = React.memo(function ActivityItem({ activity, index, isLast }: ActivityItemProps): React.JSX.Element {
  const { currentUser } = useAuth();
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { mutateAsync: deleteSettlement } = useDeleteSettlement();
  const router = useRouter();
  const sheetRef = useRef<BottomSheetModal>(null);
  const confirmSheetRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();

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

  const renderBackdrop = useCallback(
    (props: any) => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={-1}
        appearsOnIndex={0}
        pressBehavior="close"
        opacity={0.4}
      />
    ),
    []
  );

  const handleTap = () => {
    Haptics.selectionAsync();
    sheetRef.current?.present();
  };

  const handleViewDetails = () => {
    sheetRef.current?.dismiss();
    if (activity.expense) {
      router.push(`/expense/${activity.expense.id}`);
    } else if (activity.groupId) {
      router.push(`/group/${activity.groupId}`);
    }
  };

  const handleDeleteTap = () => {
    sheetRef.current?.dismiss();
    setTimeout(() => {
      confirmSheetRef.current?.present();
    }, 350);
  };

  const handleConfirmDelete = async () => {
    confirmSheetRef.current?.dismiss();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    try {
      if (activity.type === "expense" && activity.expense) {
        await deleteExpense(activity.expense.id);
      } else if (activity.type === "settlement" && activity.settlement) {
        await deleteSettlement(activity.settlement.id);
      }
    } catch {
      // handled by query client
    }
  };

  const canDelete = activity.type === "expense" || activity.type === "settlement";

  return (
    <>
      <Pressable
        onPress={handleTap}
        accessibilityRole="button"
        accessibilityLabel={`${activity.description}. ${involvement.text} ${involvement.showAmount ? formatAmount(involvement.amount, activity.currency || "USD") : ""}`}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          borderBottomWidth: isLast ? 0 : 1,
          borderBottomColor: SEPARATOR,
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
              color: TEXT_PRIMARY,
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
              color: TEXT_SECONDARY,
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
              {formatAmount(involvement.amount, activity.currency || "USD")}
            </Typography>
          ) : null}
          <Typography
            numberOfLines={1}
            style={{
              fontSize: 12,
              color: involvement.showAmount ? textColors[involvement.type] : TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              marginTop: 2,
            }}
          >
            {involvement.text}
          </Typography>
        </View>

        <icons.ChevronRight
          size={14}
          color={TEXT_SECONDARY}
          strokeWidth={1.75}
          style={{ marginLeft: 8 }}
        />
      </Pressable>

      <BottomSheetModal
        ref={sheetRef}
        index={0}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundComponent={BlurredSheetBackground}
        handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: UI.space.page,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
            gap: 20,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <View
              style={{
                width: 52,
                height: 52,
                borderRadius: CARD_RADIUS,
                backgroundColor: bgColors[involvement.type],
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <IconComponent size={26} color={iconColors[involvement.type]} strokeWidth={1.5} />
            </View>
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 20,
                  color: TEXT_PRIMARY,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                {activity.description}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  fontFamily: "IBMPlexSans_500Medium",
                  marginTop: 4,
                }}
              >
                {subtitle}
              </Typography>
            </View>
          </View>

          {involvement.showAmount && (
            <View style={{ alignItems: "center", paddingVertical: 8 }}>
              <Typography
                style={{
                  fontSize: 36,
                  color: textColors[involvement.type],
                  fontFamily: "IBMPlexSans_600SemiBold",
                  letterSpacing: -1,
                }}
              >
                {involvement.type === "positive" ? "+" : ""}
                {formatAmount(involvement.amount, activity.currency || "USD")}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: textColors[involvement.type],
                  fontFamily: "IBMPlexSans_500Medium",
                  marginTop: 4,
                }}
              >
                {involvement.text}
              </Typography>
            </View>
          )}

          <View style={{ gap: 12 }}>
            {activity.type !== "group_created" && activity.type !== "member_joined" && (
              <Pressable
                onPress={handleViewDetails}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: UI.radius.pill,
                  backgroundColor: UI.color.text,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.75 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    color: "#FFFFFF",
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  View Details
                </Typography>
              </Pressable>
            )}
            {canDelete && (
              <Pressable
                onPress={handleDeleteTap}
                style={({ pressed }) => ({
                  height: 52,
                  borderRadius: UI.radius.pill,
                  backgroundColor: UI.color.control,
                  borderWidth: 1,
                  borderColor: UI.color.danger,
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: pressed ? 0.65 : 1,
                })}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.danger,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  Delete
                </Typography>
              </Pressable>
            )}
          </View>
        </BottomSheetView>
      </BottomSheetModal>

      {/* Confirmation sheet */}
      <BottomSheetModal
        ref={confirmSheetRef}
        index={0}
        enableDynamicSizing
        backdropComponent={renderBackdrop}
        backgroundComponent={BlurredSheetBackground}
        handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: UI.space.page,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Typography
            style={{
              fontSize: 22,
              color: TEXT_PRIMARY,
              fontFamily: "IBMPlexSans_600SemiBold",
              marginBottom: 8,
            }}
          >
            Delete {activity.type === "expense" ? "Expense" : "Payment"}?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              color: TEXT_SECONDARY,
              fontFamily: "IBMPlexSans_500Medium",
              marginBottom: 24,
              lineHeight: 22,
            }}
          >
            Are you sure you want to delete "{activity.description}"? This cannot be undone.
          </Typography>
          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => confirmSheetRef.current?.dismiss()}
              style={({ pressed }) => ({
                flex: 1,
                height: 52,
                borderRadius: UI.radius.pill,
                borderWidth: 1,
                borderColor: SEPARATOR,
                backgroundColor: UI.color.control,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.65 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: TEXT_PRIMARY,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Cancel
              </Typography>
            </Pressable>
            <Pressable
              onPress={handleConfirmDelete}
              style={({ pressed }) => ({
                flex: 1,
                height: 52,
                borderRadius: UI.radius.pill,
                backgroundColor: UI.color.danger,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: "#FFFFFF",
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
              >
                Delete
              </Typography>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </>
  );
});
