import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { expensesApi } from "@/features/expenses/services/api";
import { activitiesApi } from "@/features/activity/services/api";
import { useAuth } from "@/context/AppContext";
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
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (expenseData: Partial<Expense>) => expensesApi.addExpense(expenseData),
    onMutate: async (newExpense) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses });

      const previousExpenses = queryClient.getQueryData(queryKeys.expenses);

      const optimisticExpense: Expense = {
        ...(newExpense as Expense),
        id: `temp-${Date.now()}`,
        createdAt: new Date(),
        date: newExpense.date ?? new Date(),
      };

      queryClient.setQueryData(queryKeys.expenses, (old: Expense[] = []) => [
        optimisticExpense,
        ...old,
      ]);

      if (newExpense.groupId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
        queryClient.setQueryData(
          queryKeys.groupExpenses(newExpense.groupId),
          (old: Expense[] = []) => [optimisticExpense, ...old]
        );
      }

      return { previousExpenses };
    },
    onError: (err, newExpense, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses, context.previousExpenses);
      }
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
    },
    onSettled: (_data, _error, newExpense) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      if (newExpense.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupExpenses(newExpense.groupId) });
      }
    },
    onSuccess: (newExpense) => {
      activitiesApi.logActivity({
        type: "expense",
        expense: { id: newExpense.id } as Expense,
        groupId: newExpense.groupId,
        userId: currentUser.id,
        user: newExpense.paidByUser,
        description: newExpense.title,
        amount: newExpense.amount,
        currency: newExpense.currency,
        date: newExpense.date,
      });
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
    onMutate: async (expenseId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.expenses });

      const previousExpenses = queryClient.getQueryData<Expense[]>(queryKeys.expenses);

      queryClient.setQueryData(queryKeys.expenses, (old: Expense[] = []) =>
        old.filter((e) => e.id !== expenseId)
      );

      return { previousExpenses };
    },
    onError: (err, expenseId, context) => {
      if (context?.previousExpenses) {
        queryClient.setQueryData(queryKeys.expenses, context.previousExpenses);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
    },
  });
}
