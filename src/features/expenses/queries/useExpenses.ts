import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { expensesApi } from "@/features/expenses/services/api";
import type { Expense } from "@/types";

export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupExpenses(groupId!),
    queryFn: () => expensesApi.fetchGroupExpenses(groupId!),
    enabled: !!groupId,
  });
}

export function useUserExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses, // Could refine this key
    queryFn: () => expensesApi.fetchUserExpenses(userId!),
    enabled: !!userId,
  });
}

export function useExpenseDetails(expenseId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenseDetails(expenseId!),
    queryFn: () => expensesApi.fetchExpense(expenseId!),
    enabled: !!expenseId,
  });
}

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: Partial<Expense>) => expensesApi.addExpense(expenseData),
    onSuccess: (newExpense) => {
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Expense> }) =>
      expensesApi.updateExpense(id, updates),
    onSuccess: (updatedExpense, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseDetails(variables.id) });
      if (updatedExpense.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupExpenses(updatedExpense.groupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onSuccess: (_, expenseId) => {
      // We don't have the groupId here easily without returning it from delete or passing it,
      // so invalidate broadly or require groupId to be passed.
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.removeQueries({ queryKey: queryKeys.expenseDetails(expenseId) });
    },
  });
}
