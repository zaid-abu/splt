import { useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { expensesApi } from "@/features/expenses/services/api";
import type { Expense } from "@/types";

export function useAddExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseData: Partial<Expense>) => expensesApi.addExpense(expenseData),
    onMutate: async (newExpense) => {
      if (newExpense.groupId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
        const previousExpenses = queryClient.getQueryData(queryKeys.groupExpenses(newExpense.groupId));
        
        // Optimistic update
        queryClient.setQueryData(queryKeys.groupExpenses(newExpense.groupId), (old: any) => {
          if (!old) return old;
          return {
            ...old,
            pages: [[{ ...newExpense, id: 'temp-id', date: new Date().toISOString() }], ...old.pages],
          };
        });
        
        return { previousExpenses };
      }
    },
    onError: (err, newExpense, context) => {
      // Toast.show is not available statically, you'd need a context/hook
      if (newExpense.groupId && context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.groupExpenses(newExpense.groupId), context.previousExpenses);
      }
    },
    onSettled: (newExpense) => {
      if (newExpense?.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
    onSuccess: () => {
      // Success
    }
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
      // Success
    },
    onError: () => {
      // Error
    }
  });
}

export function useDeleteExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (expenseId: string) => expensesApi.deleteExpense(expenseId),
    onSuccess: (_, expenseId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.removeQueries({ queryKey: queryKeys.expenseDetails(expenseId) });
      // We don't have groupId here, so we might need to invalidate all group expenses to be safe
      queryClient.invalidateQueries({ queryKey: ['expenses', 'group'] });
      // Success
    },
    onError: () => {
      // Error
    }
  });
}
