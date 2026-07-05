import { Typography } from "heroui-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useRef, useCallback } from "react";
import * as icons from "lucide-react-native";
import * as Haptics from "expo-haptics";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";

import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses, useDeleteExpense } from "@/features/expenses/queries/useExpenses";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { AppLoader } from "@/components/ui/AppLoader";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { EXPENSE_CATEGORIES } from "@/types";

const BG = "#F5F0EB";
const TEXT_PRIMARY = "#000000";
const TEXT_SECONDARY = "#8A8782";
const SEPARATOR = "#E8E4DF";

const CATEGORY_COLORS: Record<string, { bg: string; icon: string }> = {
  food: { bg: "#FEF3C7", icon: "#F59E0B" },
  transport: { bg: "#DBEAFE", icon: "#3B82F6" },
  accommodation: { bg: "#FCE7F3", icon: "#EC4899" },
  entertainment: { bg: "#EDE9FE", icon: "#8B5CF6" },
  shopping: { bg: "#FEE2E2", icon: "#EF4444" },
  utilities: { bg: "#D1FAE5", icon: "#10B981" },
  health: { bg: "#CFFAFE", icon: "#06B6D4" },
  travel: { bg: "#E0E7FF", icon: "#6366F1" },
  other: { bg: "#F1F5F9", icon: "#64748B" },
};

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { data: expenses = [] } = useUserExpenses(currentUser?.id);
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { mutateAsync: deleteExpense } = useDeleteExpense();

  const isAppLoading = useUIStore((s) => s.isAppLoading);
  const deleteSheetRef = useRef<BottomSheetModal>(null);

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

  const expense = expenses.find((e) => e.id === id);
  const group = groups.find((g) => g.id === expense?.groupId);
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense?.category);

  if (!expense) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: BG,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <icons.AlertCircle size={48} color={TEXT_PRIMARY} />
        <Typography
          style={{
            fontSize: 24,
            color: TEXT_PRIMARY,
            marginTop: 16,
            fontFamily: "CrimsonText_700Bold",
          }}
        >
          Expense not found
        </Typography>
        <Typography
          style={{
            fontSize: 16,
            color: TEXT_SECONDARY,
            textAlign: "center",
            marginTop: 8,
            fontFamily: "CrimsonText_600SemiBold",
          }}
        >
          This expense may have been deleted or is unavailable.
        </Typography>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            marginTop: 24,
            paddingHorizontal: 24,
            paddingVertical: 12,
            backgroundColor: "#8C7A6B",
            borderRadius: 0,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Typography style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "CrimsonText_700Bold" }}>
            Go back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const sym = getCurrencySymbol(expense.currency);
  const isJPY = expense.currency === "JPY" || expense.currency === "KRW";
  const paidByMe = expense.paidBy === currentUser.id;
  const myShare = expense.splits.find((s: any) => s.userId === currentUser.id);

  const formatAmt = (n: number) =>
    `${sym}${n.toLocaleString("en-US", {
      minimumFractionDigits: isJPY ? 0 : 2,
      maximumFractionDigits: isJPY ? 0 : 2,
    })}`;

  const dateStr = expense.date.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const CategoryIcon = (icons as any)[category?.icon ?? "Package"] || icons.Package;
  const categoryColor = CATEGORY_COLORS[expense.category ?? "other"] || CATEGORY_COLORS.other;

  return (
    <View style={{ flex: 1, backgroundColor: BG }}>
      <StatusBar style="dark" />

      {/* ── Immersive Header ── */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: 24,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => router.back()}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: 0,
            backgroundColor: "transparent",
            borderWidth: 1,
            borderColor: SEPARATOR,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() =>
              router.push({ pathname: "/expense/new", params: { expenseId: expense.id } })
            }
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 0,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Edit2 size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => deleteSheetRef.current?.present()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: 0,
              backgroundColor: "transparent",
              borderWidth: 1,
              borderColor: SEPARATOR,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Trash2 size={20} color={TEXT_PRIMARY} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* ── Bill Section ── */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            paddingHorizontal: 24,
            paddingTop: 40,
            paddingBottom: 40,
            borderBottomWidth: 1,
            borderBottomColor: SEPARATOR,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 32,
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 14,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                {category?.label ?? "Expense"}
              </Typography>
              <Typography
                style={{
                  fontSize: 32,
                  color: TEXT_PRIMARY,
                  fontFamily: "UnicaOne_400Regular",
                  lineHeight: 40,
                }}
              >
                {expense.title}
              </Typography>
            </View>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 0,
                backgroundColor: categoryColor.bg,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CategoryIcon size={32} color={categoryColor.icon} strokeWidth={1.5} />
            </View>
          </View>

          <View style={{ marginBottom: 32 }}>
            <Typography
              style={{
                fontSize: 72,
                lineHeight: 80,
                color: TEXT_PRIMARY,
                fontFamily: "CrimsonText_700Bold",
                letterSpacing: -2,
              }}
            >
              {formatAmt(expense.amount)}
            </Typography>
          </View>

          <View style={{ gap: 16 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                }}
              >
                Date
              </Typography>
              <Typography
                style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                {dateStr}
              </Typography>
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Typography
                style={{
                  fontSize: 16,
                  color: TEXT_SECONDARY,
                  fontFamily: "CrimsonText_600SemiBold",
                }}
              >
                Paid by
              </Typography>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <AppUserAvatar user={expense.paidByUser} size="sm" />
                <Typography
                  style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
                >
                  {paidByMe ? "You" : expense.paidByUser.name}
                </Typography>
              </View>
            </View>

            {group && (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Typography
                  style={{
                    fontSize: 16,
                    color: TEXT_SECONDARY,
                    fontFamily: "CrimsonText_600SemiBold",
                  }}
                >
                  Group
                </Typography>
                <Typography
                  style={{ fontSize: 16, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
                >
                  {group.name}
                </Typography>
              </View>
            )}

            {expense.notes && (
              <View
                style={{
                  marginTop: 8,
                  paddingTop: 16,
                  borderTopWidth: 1,
                  borderTopColor: SEPARATOR,
                }}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: TEXT_SECONDARY,
                    fontFamily: "CrimsonText_600SemiBold",
                    lineHeight: 22,
                  }}
                >
                  &quot;{expense.notes}&quot;
                </Typography>
              </View>
            )}
          </View>
        </Animated.View>

        {/* ── Split Breakdown ── */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={{ paddingHorizontal: 24, paddingTop: 40 }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Typography
              style={{
                fontSize: 12,
                color: TEXT_SECONDARY,
                fontFamily: "CrimsonText_700Bold",
                textTransform: "uppercase",
                letterSpacing: 2,
              }}
            >
              Split Breakdown
            </Typography>
            <View
              style={{
                paddingHorizontal: 12,
                paddingVertical: 4,
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: SEPARATOR,
                borderRadius: 12,
              }}
            >
              <Typography
                style={{ fontSize: 11, color: TEXT_PRIMARY, fontFamily: "CrimsonText_700Bold" }}
              >
                {expense.splitMethod === "equal" ? "EQUAL" : "CUSTOM"}
              </Typography>
            </View>
          </View>

          <View>
            {isAppLoading ? (
              <View style={{ paddingTop: 24 }}>
                <AppLoader />
              </View>
            ) : (
              expense.splits.map((split: any, idx: number) => {
                const isPaid = split.paid;
                const isMe = split.userId === currentUser.id;
                const isPayer = split.userId === expense.paidBy;

                return (
                  <Pressable
                    key={split.userId}
                    onPress={() => {
                      if (!isMe) {
                        router.push(`/friend/${split.userId}`);
                      }
                    }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 16,
                      borderBottomWidth: idx < expense.splits.length - 1 ? 1 : 0,
                      borderBottomColor: SEPARATOR,
                      opacity: !isMe && pressed ? 0.5 : 1,
                    })}
                  >
                    <AppUserAvatar user={split.user} size="lg" />
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: "center" }}>
                      <Typography
                        style={{
                          fontSize: 18,
                          color: TEXT_PRIMARY,
                          fontFamily: "CrimsonText_700Bold",
                          marginBottom: 2,
                        }}
                      >
                        {isMe ? "You" : split.user.name}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 14,
                          color: TEXT_SECONDARY,
                          fontFamily: "CrimsonText_600SemiBold",
                        }}
                      >
                        {isPaid ? (isPayer ? "Paid the bill" : "Settled") : "Owes"}
                      </Typography>
                    </View>
                    <Typography
                      style={{
                        fontSize: 20,
                        color: TEXT_PRIMARY,
                        fontFamily: "CrimsonText_700Bold",
                      }}
                    >
                      {formatAmt(split.amount)}
                    </Typography>
                  </Pressable>
                );
              })
            )}
          </View>
        </Animated.View>

        {/* ── My Share Summary ── */}
        {myShare && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ paddingHorizontal: 24, paddingTop: 40 }}
          >
            <View
              style={{
                paddingVertical: 24,
                paddingHorizontal: 24,
                backgroundColor: "#8C7A6B",
                borderRadius: 0,
              }}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  opacity: 0.7,
                  fontFamily: "CrimsonText_700Bold",
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  marginBottom: 8,
                }}
              >
                {paidByMe ? "You paid" : "Your Share"}
              </Typography>
              <Typography
                style={{
                  fontSize: 32,
                  color: "#FFFFFF",
                  fontFamily: "CrimsonText_700Bold",
                  marginBottom: 8,
                }}
              >
                {paidByMe ? formatAmt(expense.amount) : formatAmt(myShare.amount)}
              </Typography>
              <Typography
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  opacity: 0.9,
                  fontFamily: "CrimsonText_600SemiBold",
                  lineHeight: 20,
                }}
              >
                {paidByMe
                  ? `Your share is ${formatAmt(myShare.amount)}. The rest is owed to you.`
                  : `You owe ${expense.paidByUser.name.split(" ")[0]} to settle up.`}
              </Typography>

              {!paidByMe && !myShare.paid && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: `/settle/${expense.paidBy}`,
                      params: {
                        amount: myShare.amount.toString(),
                        groupId: expense.groupId || undefined,
                      },
                    } as any)
                  }
                  style={({ pressed }) => ({
                    marginTop: 24,
                    height: 48,
                    backgroundColor: "#FFFFFF",
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Typography
                    style={{ fontSize: 15, color: "#8C7A6B", fontFamily: "CrimsonText_700Bold" }}
                  >
                    Settle Your Share
                  </Typography>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* ── Delete Confirmation Bottom Sheet ── */}
      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: BG, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: TEXT_SECONDARY, width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <Typography
            style={{
              fontSize: 22,
              fontFamily: "CrimsonText_700Bold",
              color: TEXT_PRIMARY,
              marginBottom: 8,
            }}
          >
            Delete Expense?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "CrimsonText_600SemiBold",
              color: TEXT_SECONDARY,
              marginBottom: 24,
            }}
          >
            Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
          </Typography>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => deleteSheetRef.current?.dismiss()}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderWidth: 1,
                borderColor: SEPARATOR,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 16, fontFamily: "CrimsonText_700Bold", color: TEXT_PRIMARY }}
              >
                Cancel
              </Typography>
            </Pressable>
            <Pressable
              onPress={() => {
                deleteSheetRef.current?.dismiss();
                setTimeout(() => {
                  router.back();
                  setTimeout(() => deleteExpense(expense.id), 400);
                }, 300);
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                backgroundColor: "#E02424",
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 16, fontFamily: "CrimsonText_700Bold", color: "#FFFFFF" }}
              >
                Delete
              </Typography>
            </Pressable>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
