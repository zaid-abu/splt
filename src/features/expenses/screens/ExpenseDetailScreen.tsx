import { Typography } from "heroui-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { ScrollView, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useCallback } from "react";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses, useDeleteExpense } from "@/features/expenses/queries/useExpenses";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { CategoryIconBadge } from "@/components/ui/CategoryIconBadge";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { AppLoader } from "@/components/ui/AppLoader";
import { UI, MetricCell } from "@/components/ui/native-ui";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { EXPENSE_CATEGORIES } from "@/types";

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
          backgroundColor: UI.color.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <icons.AlertCircle size={48} color={UI.color.text} />
        <Typography
          style={{
            fontSize: 24,
            color: UI.color.text,
            marginTop: 16,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Expense not found
        </Typography>
        <Typography
          style={{
            fontSize: 16,
            color: UI.color.muted,
            textAlign: "center",
            marginTop: 8,
            fontFamily: "IBMPlexSans_500Medium",
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
            backgroundColor: UI.color.brand,
            borderRadius: UI.radius.pill,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Typography
            style={{ fontSize: 16, color: "#FFFFFF", fontFamily: "IBMPlexSans_600SemiBold" }}
          >
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

  return (
    <View style={{ flex: 1, backgroundColor: UI.color.bg }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: UI.space.page,
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
            borderRadius: UI.radius.pill,
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={UI.color.text} strokeWidth={1.5} />
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
              borderRadius: UI.radius.pill,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: UI.color.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Edit2 size={20} color={UI.color.text} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={() => deleteSheetRef.current?.present()}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: UI.radius.pill,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: UI.color.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Trash2 size={20} color={UI.color.text} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        {/* Bill Section */}
        <Animated.View
          entering={FadeInDown.duration(400)}
          style={{
            paddingHorizontal: UI.space.page,
            paddingTop: 32,
            paddingBottom: 32,
            borderBottomWidth: 1,
            borderBottomColor: UI.color.border,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "flex-start",
              marginBottom: 24,
            }}
          >
            <View style={{ flex: 1 }}>
              <Typography
                style={{
                  fontSize: 12,
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 2,
                  marginBottom: 8,
                }}
              >
                {category?.label ?? "Expense"}
              </Typography>
              <Typography
                style={{
                  fontSize: 28,
                  color: UI.color.text,
                  fontFamily: "Sora_600SemiBold",
                  lineHeight: 34,
                }}
              >
                {expense.title}
              </Typography>
            </View>
            <CategoryIconBadge category={expense.category} size="lg" />
          </View>

          <View style={{ marginBottom: 24 }}>
            <Typography
              style={{
                fontSize: 48,
                lineHeight: 54,
                color: UI.color.textStrong,
                fontFamily: "IBMPlexSans_600SemiBold",
                letterSpacing: -1.5,
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
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                Date
              </Typography>
              <Typography
                style={{
                  fontSize: 16,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
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
                  color: UI.color.muted,
                  fontFamily: "IBMPlexSans_500Medium",
                }}
              >
                Paid by
              </Typography>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                <AppUserAvatar user={expense.paidByUser} size="sm" />
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
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
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  Group
                </Typography>
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
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
                  borderTopColor: UI.color.border,
                }}
              >
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                    lineHeight: 22,
                  }}
                >
                  &quot;{expense.notes}&quot;
                </Typography>
              </View>
            )}
          </View>
        </Animated.View>

        {/* Split Breakdown */}
        <Animated.View
          entering={FadeInDown.duration(400).delay(100)}
          style={{ paddingHorizontal: UI.space.page, paddingTop: 32 }}
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
                color: UI.color.muted,
                fontFamily: "IBMPlexSans_600SemiBold",
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
                borderColor: UI.color.border,
                borderRadius: 12,
              }}
            >
              <Typography
                style={{
                  fontSize: 11,
                  color: UI.color.text,
                  fontFamily: "IBMPlexSans_600SemiBold",
                }}
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
                      borderBottomColor: UI.color.border,
                      opacity: !isMe && pressed ? 0.5 : 1,
                    })}
                  >
                    <AppUserAvatar user={split.user} size="lg" />
                    <View style={{ flex: 1, marginLeft: 16, justifyContent: "center" }}>
                      <Typography
                        style={{
                          fontSize: 18,
                          color: UI.color.text,
                          fontFamily: "IBMPlexSans_600SemiBold",
                          marginBottom: 2,
                        }}
                      >
                        {isMe ? "You" : split.user.name}
                      </Typography>
                      <Typography
                        style={{
                          fontSize: 14,
                          color: UI.color.muted,
                          fontFamily: "IBMPlexSans_500Medium",
                        }}
                      >
                        {isPaid ? (isPayer ? "Paid the bill" : "Settled") : "Owes"}
                      </Typography>
                    </View>
                    <Typography
                      style={{
                        fontSize: 20,
                        color: UI.color.text,
                        fontFamily: "IBMPlexSans_600SemiBold",
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

        {/* My Share Summary */}
        {myShare && (
          <Animated.View
            entering={FadeInDown.duration(400).delay(200)}
            style={{ paddingHorizontal: UI.space.page, paddingTop: 32 }}
          >
            <View
              style={{
                paddingVertical: 24,
                paddingHorizontal: 24,
                backgroundColor: UI.color.brand,
                borderRadius: UI.radius.lg,
              }}
            >
              <Typography
                style={{
                  fontSize: 14,
                  color: "#FFFFFF",
                  opacity: 0.7,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  textTransform: "uppercase",
                  letterSpacing: 1.4,
                  marginBottom: 8,
                }}
              >
                {paidByMe ? "You paid" : "Your Share"}
              </Typography>
              <Typography
                style={{
                  fontSize: 28,
                  color: "#FFFFFF",
                  fontFamily: "IBMPlexSans_600SemiBold",
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
                  fontFamily: "IBMPlexSans_500Medium",
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
                    borderRadius: UI.radius.pill,
                    alignItems: "center",
                    justifyContent: "center",
                    opacity: pressed ? 0.8 : 1,
                  })}
                >
                  <Typography
                    style={{
                      fontSize: 15,
                      color: UI.color.brand,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Settle Your Share
                  </Typography>
                </Pressable>
              )}
            </View>
          </Animated.View>
        )}
      </ScrollView>

      {/* Delete Confirmation Bottom Sheet */}
      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: UI.color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: UI.color.muted, width: 40 }}
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
              fontFamily: "IBMPlexSans_600SemiBold",
              color: UI.color.text,
              marginBottom: 8,
            }}
          >
            Delete Expense?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "IBMPlexSans_500Medium",
              color: UI.color.muted,
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
                borderColor: UI.color.border,
                borderRadius: UI.radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: UI.color.text,
                }}
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
                borderRadius: UI.radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{ fontSize: 16, fontFamily: "IBMPlexSans_600SemiBold", color: "#FFFFFF" }}
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
