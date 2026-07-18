import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { recurringApi } from "@/features/recurring/services/recurringApi";
import type { RecurringFormValues } from "@/types";

export function useRecurringExpenses(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recurring.list(userId!),
    queryFn: () => recurringApi.fetchRecurringExpenses(userId!),
    enabled: !!userId,
  });
}

export function useRecurringExpense(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recurring.detail(id!),
    queryFn: () => recurringApi.fetchRecurringExpense(id!),
    enabled: !!id,
  });
}

export function useRecurringOccurrences(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.recurring.occurrences(id!),
    queryFn: () => recurringApi.fetchOccurrences(id!),
    enabled: !!id,
  });
}

export function useCreateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ input, createdBy }: { input: RecurringFormValues; createdBy: string }) =>
      recurringApi.createRecurringExpense(input, createdBy),
    onSuccess: (newRecurring, { createdBy }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.list(createdBy) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useUpdateRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Partial<RecurringFormValues> }) =>
      recurringApi.updateRecurringExpense(id, input),
    onSuccess: (updated, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useSetRecurringStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "active" | "paused" }) =>
      recurringApi.setRecurringStatus(id, status),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.detail(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useDeleteRecurringExpense() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => recurringApi.deleteRecurringExpense(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.recurring.all });
      queryClient.removeQueries({ queryKey: queryKeys.recurring.detail(id) });
      queryClient.removeQueries({ queryKey: queryKeys.recurring.occurrences(id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}

export function useReviewOccurrence() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      occurrenceId,
      action,
      recurringExpenseId,
    }: {
      occurrenceId: string;
      action: "generate" | "skip";
      recurringExpenseId: string;
    }) => recurringApi.reviewOccurrence(occurrenceId, action),
    onSuccess: (_, { recurringExpenseId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.recurring.occurrences(recurringExpenseId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.recurring.detail(recurringExpenseId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.expenses });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: ["activities"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
    },
  });
}
