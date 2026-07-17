import { useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { BottomSheetModal } from "@gorhom/bottom-sheet";
import * as Haptics from "expo-haptics";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses, useDeleteExpense } from "@/features/expenses/queries/useExpenses";
import { getCurrencySymbol } from "@/components/ui/AmountDisplay";
import { useAuth } from "@/context/AppContext";
import { useAppToast } from "@/hooks/useAppToast";
import { EXPENSE_CATEGORIES } from "@/types";

export function useExpenseDetail(expenseId: string) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const {
    data: expenses = [],
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const { data: groups = [] } = useGroups(currentUser?.id);
  const { mutateAsync: deleteExpense } = useDeleteExpense();
  const { toast } = useAppToast();
  const deleteSheetRef = useRef<BottomSheetModal>(null);

  const expense = expenses.find((e) => e.id === expenseId);
  const group = groups.find((g) => g.id === expense?.groupId);
  const category = EXPENSE_CATEGORIES.find((c) => c.key === expense?.category);

  const sym = expense ? getCurrencySymbol(expense.currency) : "";
  const isJPY = expense?.currency === "JPY" || expense?.currency === "KRW";

  const formatAmt = useCallback(
    (n: number) =>
      `${sym}${n.toLocaleString("en-US", {
        minimumFractionDigits: isJPY ? 0 : 2,
        maximumFractionDigits: isJPY ? 0 : 2,
      })}`,
    [sym, isJPY]
  );

  const dateStr = expense?.date
    ? expense.date.toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const paidByMe = expense?.paidBy === currentUser.id;
  const myShare = expense?.splits.find((s: any) => s.userId === currentUser.id);

  const paidByLabel = expense
    ? paidByMe
      ? "You"
      : expense.paidByUser.name
    : "";

  const handleDelete = useCallback(async () => {
    if (!expense) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    deleteSheetRef.current?.dismiss();
    try {
      await deleteExpense(expense.id);
      router.back();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to delete expense";
      toast.show({
        label: "Error",
        description: msg,
        variant: "danger",
        placement: "top",
      });
    }
  }, [expense, deleteExpense, router, toast]);

  const handleEdit = useCallback(() => {
    if (!expense) return;
    Haptics.selectionAsync();
    router.push({ pathname: "/expense/new", params: { expenseId: expense.id } });
  }, [expense, router]);

  const handleDeletePress = useCallback(() => {
    Haptics.selectionAsync();
    deleteSheetRef.current?.present();
  }, []);

  const handleSettle = useCallback(() => {
    if (!expense || !myShare) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: `/settle/${expense.paidBy}`,
      params: {
        amount: myShare.amount.toString(),
        groupId: expense.groupId || undefined,
      },
    } as any);
  }, [expense, myShare, router]);

  const handleUserPress = useCallback(
    (userId: string) => {
      if (userId === currentUser.id) return;
      Haptics.selectionAsync();
      router.push(`/friend/${userId}`);
    },
    [currentUser.id, router]
  );

  return {
    expense,
    group,
    category,
    isExpensesLoading,
    isExpensesError,
    refetchExpenses,
    sym,
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
  };
}
