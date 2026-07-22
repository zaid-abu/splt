import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { expensesApi } from "@/features/expenses/services/api";
import type { Expense } from "@/types";
import type { ExpenseMutationInput } from "@/features/money/types";

export function useGroupExpenses(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupExpenses(groupId!),
    queryFn: () => expensesApi.fetchGroupExpenses(groupId!),
    enabled: !!groupId,
  });
}

export function useUserExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.expenses,
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

export function useCreateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: ExpenseMutationInput) => expensesApi.createExpense(input),
    onSuccess: (newExpense) => {
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useUpdateExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Omit<ExpenseMutationInput, "clientOperationId" | "context">;
    }) => expensesApi.updateExpense(id, input),
    onSuccess: (updatedExpense, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenseDetails(variables.id) });
      if (updatedExpense.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupExpenses(updatedExpense.groupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onSuccess: (_, expenseId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.removeQueries({ queryKey: queryKeys.expenseDetails(expenseId) });
    },
  });
}
