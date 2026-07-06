import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { expensesApi } from "@/features/expenses/services/api";

export function useGroupExpenses(groupId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.groupExpenses(groupId!),
    queryFn: ({ pageParam = 0 }) => expensesApi.fetchGroupExpenses(groupId!, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      // If we got fewer than 20 items, there are no more pages
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    select: (data) => data.pages.flat(),
    enabled: !!groupId,
  });
}

export function useUserExpenses(userId: string | undefined) {
  return useInfiniteQuery({
    queryKey: queryKeys.expenses,
    queryFn: ({ pageParam = 0 }) => expensesApi.fetchUserExpenses(userId!, pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      return lastPage.length === 20 ? allPages.length : undefined;
    },
    select: (data) => data.pages.flat(),
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
