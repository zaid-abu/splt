import { Typography } from "heroui-native";
import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseRouteParams } from "@/types/navigation";
import { useCallback } from "react";
import type { JSX } from "react";
import { ThemedStatusBar } from "@/components/ui/ThemedStatusBar";
import { ScrollView, View, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { AppLoader } from "@/components/ui/AppLoader";
import { ErrorState } from "@/components/ui/ErrorState";
import { useUI } from "@/components/ui";

import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { useExpenseDetail } from "@/features/expenses/hooks/useExpenseDetail";
import { ExpenseSummary } from "@/features/expenses/components/ExpenseSummary";
import { ExpenseSplitBreakdown } from "@/features/expenses/components/ExpenseSplitBreakdown";
import { ExpenseComments } from "@/features/expenses/components/ExpenseComments";

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const { color, radius, space } = useUI();
  const isAppLoading = useUIStore((s) => s.isAppLoading);

  const {
    expense,
    group,
    category,
    isExpensesLoading,
    isExpensesError,
    refetchExpenses,
    formatAmt,
    dateStr,
    paidByMe,
    myShare,
    paidByLabel,
    deleteSheetRef,
    handleDelete,
    handleEdit,
    handleDeletePress,
    handleSettle,
    handleUserPress,
  } = useExpenseDetail(id);

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

  if (!expense && isExpensesLoading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    );
  }

  if (isExpensesError) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <ErrorState onRetry={() => refetchExpenses()} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: color.bg,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <icons.AlertCircle size={48} color={color.text} />
        <Typography
          style={{
            fontSize: 24,
            color: color.text,
            marginTop: 16,
            fontFamily: "IBMPlexSans_600SemiBold",
          }}
        >
          Expense not found
        </Typography>
        <Typography
          style={{
            fontSize: 16,
            color: color.muted,
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
            backgroundColor: color.brand,
            borderRadius: radius.pill,
            opacity: pressed ? 0.8 : 1,
          })}
        >
          <Typography
            style={{
              fontSize: 16,
              color: color.textInverse,
              fontFamily: "IBMPlexSans_600SemiBold",
            }}
          >
            Go back
          </Typography>
        </Pressable>
      </View>
    );
  }

  const splitMethodLabel = expense.splitMethod === "equal" ? "EQUAL" : "CUSTOM";
  const myShareSummaryLabel = paidByMe ? "You paid" : "Your Share";
  const myShareSummaryAmount = paidByMe
    ? formatAmt(expense.amount)
    : formatAmt(myShare?.amount ?? 0);
  const settleMessage = paidByMe
    ? `Your share is ${formatAmt(myShare?.amount ?? 0)}. The rest is owed to you.`
    : `You owe ${expense.paidByUser.name.split(" ")[0]} to settle up.`;
  const showSettleButton = !paidByMe && !myShare?.paid;

  return (
    <View style={{ flex: 1, backgroundColor: color.bg }}>
      <ThemedStatusBar />

      <View
        style={{
          paddingTop: insets.top + 16,
          paddingHorizontal: space.page,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 10,
        }}
      >
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={({ pressed }) => ({
            width: 44,
            height: 44,
            borderRadius: radius.pill,
            backgroundColor: color.control,
            borderWidth: 1,
            borderColor: color.border,
            alignItems: "center",
            justifyContent: "center",
            opacity: pressed ? 0.5 : 1,
          })}
        >
          <icons.ArrowLeft size={20} color={color.text} strokeWidth={1.5} />
        </Pressable>

        <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
          <Pressable
            accessibilityRole="button"
            onPress={handleEdit}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: color.control,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Edit2 size={20} color={color.text} strokeWidth={1.5} />
          </Pressable>

          <Pressable
            accessibilityRole="button"
            onPress={handleDeletePress}
            style={({ pressed }) => ({
              width: 44,
              height: 44,
              borderRadius: radius.pill,
              backgroundColor: color.control,
              borderWidth: 1,
              borderColor: color.border,
              alignItems: "center",
              justifyContent: "center",
              opacity: pressed ? 0.5 : 1,
            })}
          >
            <icons.Trash2 size={20} color={color.text} strokeWidth={1.5} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <ExpenseSummary
          categoryLabel={category?.label ?? "Expense"}
          title={expense.title}
          category={expense.category}
          formattedAmount={formatAmt(expense.amount)}
          dateStr={dateStr}
          paidByLabel={paidByLabel}
          paidByUser={expense.paidByUser}
          groupName={group?.name}
          notes={expense.notes}
          receiptUrl={expense.receiptUrl}
        />

        <ExpenseSplitBreakdown
          splits={expense.splits}
          splitMethod={splitMethodLabel}
          currentUserId={currentUser.id}
          formatAmt={formatAmt}
          paidByMe={paidByMe}
          myShareAmount={myShare?.amount}
          myShareSummaryLabel={myShareSummaryLabel}
          myShareSummaryAmount={myShareSummaryAmount}
          settleMessage={settleMessage}
          showSettleButton={showSettleButton}
          paidByFirstName={expense.paidByUser.name.split(" ")[0]}
          onSettlePress={handleSettle}
          onUserPress={handleUserPress}
          isAppLoading={isAppLoading}
        />

        <Animated.View
          entering={FadeInDown.duration(400).delay(200).springify()}
          style={{ paddingHorizontal: space.page, marginBottom: 40 }}
        >
          <ExpenseComments expenseId={expense.id} currentUserId={currentUser.id} />
        </Animated.View>
      </ScrollView>

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: color.bg, borderRadius: 0 }}
        handleIndicatorStyle={{ backgroundColor: color.muted, width: 40 }}
      >
        <BottomSheetView
          style={{
            paddingHorizontal: space.page,
            paddingTop: 24,
            paddingBottom: insets.bottom + 24,
          }}
        >
          <Typography
            style={{
              fontSize: 22,
              fontFamily: "IBMPlexSans_600SemiBold",
              color: color.text,
              marginBottom: 8,
            }}
          >
            Delete Expense?
          </Typography>
          <Typography
            style={{
              fontSize: 16,
              fontFamily: "IBMPlexSans_500Medium",
              color: color.muted,
              marginBottom: 24,
            }}
          >
            Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
          </Typography>

          <View style={{ flexDirection: "row", gap: 12 }}>
            <Pressable
              onPress={() => {
                Haptics.selectionAsync();
                deleteSheetRef.current?.dismiss();
              }}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                borderWidth: 1,
                borderColor: color.border,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.5 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: color.text,
                }}
              >
                Cancel
              </Typography>
            </Pressable>
            <Pressable
              onPress={handleDelete}
              style={({ pressed }) => ({
                flex: 1,
                height: 48,
                backgroundColor: color.danger,
                borderRadius: radius.pill,
                alignItems: "center",
                justifyContent: "center",
                opacity: pressed ? 0.8 : 1,
              })}
            >
              <Typography
                style={{
                  fontSize: 16,
                  fontFamily: "IBMPlexSans_600SemiBold",
                  color: color.textInverse,
                }}
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
