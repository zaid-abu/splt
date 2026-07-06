import { BottomSheetModal, BottomSheetBackdrop, BottomSheetView } from "@gorhom/bottom-sheet";
import { useLocalSearchParams, useRouter } from "expo-router";
import type { ExpenseRouteParams } from "@/types/navigation";
import type { JSX } from "react";
import { StatusBar } from "expo-status-bar";
import { View, Pressable, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRef, useCallback } from "react";
import * as icons from "lucide-react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useDeleteExpense } from "@/features/expenses/mutations/useExpenseMutations";

import { Text } from "@/components/ui/Text";
import { Button } from "@/components/ui/Button";
import { Card, CardRow } from "@/components/ui/Card";

import { AppUserAvatar } from "@/components/ui/MemberAvatar";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useUIStore } from "@/store/useUIStore";
import { EXPENSE_CATEGORIES } from "@/types";

export default function ExpenseDetailScreen(): JSX.Element {
  const { id } = useLocalSearchParams<ExpenseRouteParams>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser } = useAuth();
  const userId = currentUser?.id ?? "";
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
      <View className="flex-1 bg-background items-center justify-center p-6">
        <StatusBar style="light" />
        <icons.AlertCircle size={48} color="#FB923C" />
        <Text variant="h3" color="primary" className="mt-4">
          Expense not found
        </Text>
        <Text variant="body-sm" color="muted" className="text-center mt-2">
          This expense may have been deleted or is unavailable.
        </Text>
        <Button variant="primary" className="mt-6" onPress={() => router.back()}>
          Go back
        </Button>
      </View>
    );
  }

  const sym = getCurrencySymbol(expense.currency);
  const isJPY = expense.currency === "JPY" || expense.currency === "KRW";
  const paidByMe = expense.paidBy === userId;
  const myShare = expense.splits.find((s: any) => s.userId === userId);

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

  if (!currentUser) return <></>;
  return (
    <View className="flex-1 bg-background">
      <StatusBar style="light" />

      <View className="flex-row justify-between px-6 z-10" style={{ paddingTop: insets.top + 16 }}>
        <Button variant="ghost" size="sm" className="w-11 h-11 p-0" onPress={() => router.back()}>
          <icons.ArrowLeft size={20} color="#FAFAFA" strokeWidth={1.5} />
        </Button>

        <View className="flex-row gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-11 h-11 p-0"
            onPress={() =>
              router.push({ pathname: "/expense/new", params: { expenseId: expense.id } })
            }
          >
            <icons.Edit2 size={20} color="#FAFAFA" strokeWidth={1.5} />
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="w-11 h-11 p-0"
            onPress={() => deleteSheetRef.current?.present()}
          >
            <icons.Trash2 size={20} color="#FAFAFA" strokeWidth={1.5} />
          </Button>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 60 }}
      >
        <Animated.View entering={FadeInDown.duration(400)} className="px-6 pt-10 pb-10 mb-8">
          <Card className="p-6">
            <View className="flex-row justify-between items-start mb-8">
              <View className="flex-1">
                <Text variant="body-xs" color="muted" className="uppercase mb-2">
                  {category?.label ?? "Expense"}
                </Text>
                <Text variant="h1" className="leading-10">
                  {expense.title}
                </Text>
              </View>
              <View className="w-16 h-16 rounded-2xl bg-surface-2 border border-border items-center justify-center">
                <CategoryIcon size={32} color="#FB923C" strokeWidth={1.5} />
              </View>
            </View>

            <Text className="text-7xl font-bold text-foreground tracking-tight leading-[80px] mb-8">
              {formatAmt(expense.amount)}
            </Text>

            <View className="flex-col gap-4">
              <View className="flex-row justify-between">
                <Text variant="body" weight="semibold" color="muted">
                  Date
                </Text>
                <Text variant="body" weight="bold">
                  {dateStr}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text variant="body" weight="semibold" color="muted">
                  Paid by
                </Text>
                <View className="flex-row gap-3">
                  <AppUserAvatar user={expense.paidByUser} size="sm" />
                  <Text variant="body" weight="bold">
                    {paidByMe ? "You" : expense.paidByUser.name}
                  </Text>
                </View>
              </View>

              {group && (
                <View className="flex-row justify-between">
                  <Text variant="body" weight="semibold" color="muted">
                    Group
                  </Text>
                  <Text variant="body" weight="bold">
                    {group.name}
                  </Text>
                </View>
              )}

              {expense.notes && (
                <View className="flex-col pt-4 border-t border-divider">
                  <Text variant="body-sm" weight="semibold" color="muted" className="leading-6">
                    &quot;{expense.notes}&quot;
                  </Text>
                </View>
              )}
            </View>
          </Card>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(100)} className="px-6 mb-10">
          <View className="flex-row justify-between items-center mb-4 px-1">
            <Text variant="label">Split Breakdown</Text>
            <View className="px-3 py-1 bg-surface border border-border rounded-xl">
              <Text variant="caption" color="foreground">
                {expense.splitMethod === "equal" ? "EQUAL" : "CUSTOM"}
              </Text>
            </View>
          </View>

          <Card>
            {expense.splits.map((split: any, idx: number) => {
              const isPaid = split.paid;
              const isMe = split.userId === userId;
              const isPayer = split.userId === expense.paidBy;
              const isLast = idx === expense.splits.length - 1;

              return (
                <CardRow
                  key={split.userId}
                  isLast={isLast}
                  onPress={!isMe ? () => router.push(`/friend/${split.userId}`) : undefined}
                >
                  <AppUserAvatar user={split.user} size="lg" />
                  <View className="flex-col flex-1 ml-4 justify-center">
                    <Text variant="body" weight="bold" className="mb-1">
                      {isMe ? "You" : split.user.name}
                    </Text>
                    <Text variant="body-sm" weight="semibold" color="muted">
                      {isPaid ? (isPayer ? "Paid the bill" : "Settled") : "Owes"}
                    </Text>
                  </View>
                  <Text variant="h4">
                    {formatAmt(split.amount)}
                  </Text>
                </CardRow>
              );
            })}
          </Card>
        </Animated.View>

        {myShare && (
          <Animated.View entering={FadeInDown.duration(400).delay(200)} className="px-6 mb-10">
            <Card className="bg-primary border-primary p-6" bordered={false}>
              <Text variant="label" color="foreground" className="opacity-70 mb-2">
                {paidByMe ? "You paid" : "Your Share"}
              </Text>
              <Text className="text-4xl text-primary-foreground font-bold mb-2">
                {paidByMe ? formatAmt(expense.amount) : formatAmt(myShare.amount)}
              </Text>
              <Text variant="body-sm" weight="semibold" className="text-primary-foreground opacity-90 leading-5 mb-2">
                {paidByMe
                  ? `Your share is ${formatAmt(myShare.amount)}. The rest is owed to you.`
                  : `You owe ${expense.paidByUser.name.split(" ")[0]} to settle up.`}
              </Text>

              {!paidByMe && !myShare.paid && (
                <Button
                  variant="secondary"
                  fullWidth
                  className="mt-6"
                  onPress={() =>
                    router.push({
                      pathname: `/settle/${expense.paidBy}`,
                      params: {
                        amount: myShare.amount.toString(),
                        groupId: expense.groupId || undefined,
                      },
                    } as any)
                  }
                >
                  Settle Your Share
                </Button>
              )}
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      <BottomSheetModal
        ref={deleteSheetRef}
        index={0}
        enableDynamicSizing={true}
        backdropComponent={renderBackdrop}
        backgroundStyle={{ backgroundColor: "#131316", borderRadius: 24 }}
        handleIndicatorStyle={{ backgroundColor: "#3F3F46", width: 40 }}
      >
        <BottomSheetView
          style={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: insets.bottom + 24 }}
        >
          <Text variant="h3" className="mb-2">
            Delete Expense?
          </Text>
          <Text variant="body-sm" weight="semibold" color="muted" className="mb-6">
            Are you sure you want to delete &quot;{expense.title}&quot;? This cannot be undone.
          </Text>

          <View className="flex-row gap-3">
            <Button
              variant="secondary"
              fullWidth
              onPress={() => deleteSheetRef.current?.dismiss()}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              fullWidth
              onPress={() => {
                deleteSheetRef.current?.dismiss();
                setTimeout(() => {
                  router.back();
                  setTimeout(() => deleteExpense(expense.id), 400);
                }, 300);
              }}
            >
              Delete
            </Button>
          </View>
        </BottomSheetView>
      </BottomSheetModal>
    </View>
  );
}
