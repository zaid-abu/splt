import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import {
  useRecurringExpense,
  useRecurringOccurrences,
  useSetRecurringStatus,
  useDeleteRecurringExpense,
  useReviewOccurrence,
} from "@/features/recurring/queries/useRecurringExpenses";
import { queryKeys } from "@/queries/keys";
import type { RecurringExpense } from "@/types";

export interface UseRecurringDetailReturn {
  recurring: RecurringExpense | undefined;
  occurrences: ReturnType<typeof useRecurringOccurrences>["data"];
  frequencyLabel: string;
  nextRunDateLabel: string;
  scheduleSummary: string;
  reminderLabel: string;
  isLoading: boolean;
  isError: boolean;
  refreshing: boolean;
  isTogglingStatus: boolean;
  isDeleting: boolean;
  isReviewing: boolean;
  handleRefresh: () => Promise<void>;
  handleBack: () => void;
  handleEdit: () => void;
  handleToggleStatus: () => void;
  handleDelete: () => void;
  handleReviewOccurrence: (occurrenceId: string, action: "generate" | "skip") => void;
}

const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

function formatRecurrenceLabel(recurring: RecurringExpense): string {
  const freq = FREQUENCY_LABELS[recurring.frequency] ?? recurring.frequency;
  if (recurring.intervalValue > 1) {
    return `Every ${recurring.intervalValue} ${freq.toLowerCase().replace(/ly$/, "")}s`;
  }
  return freq;
}

function formatScheduleSummary(recurring: RecurringExpense): string {
  if (recurring.frequency === "weekly" && recurring.dayOfWeek !== null) {
    const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    return `on ${days[recurring.dayOfWeek]}`;
  }
  if (
    (recurring.frequency === "monthly" || recurring.frequency === "yearly") &&
    recurring.dayOfMonth !== null
  ) {
    const ordinal =
      recurring.dayOfMonth === 1
        ? "1st"
        : recurring.dayOfMonth === 2
          ? "2nd"
          : recurring.dayOfMonth === 3
            ? "3rd"
            : `${recurring.dayOfMonth}th`;
    return `on the ${ordinal}`;
  }
  return "";
}

export function useRecurringDetail(recurringId: string): UseRecurringDetailReturn {
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: recurring,
    isLoading: isLoadingRecurring,
    isError: isErrorRecurring,
  } = useRecurringExpense(recurringId);

  const {
    data: occurrences = [],
    isLoading: isLoadingOccurrences,
    isError: isErrorOccurrences,
  } = useRecurringOccurrences(recurringId);

  const statusMutation = useSetRecurringStatus();
  const deleteMutation = useDeleteRecurringExpense();
  const reviewMutation = useReviewOccurrence();

  const [refreshing, setRefreshing] = useState(false);

  const frequencyLabel = useMemo(
    () => (recurring ? formatRecurrenceLabel(recurring) : ""),
    [recurring]
  );

  const nextRunDateLabel = useMemo(() => {
    if (!recurring) return "";
    return new Date(recurring.nextRunDate).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [recurring]);

  const scheduleSummary = useMemo(
    () => (recurring ? formatScheduleSummary(recurring) : ""),
    [recurring]
  );

  const reminderLabel = useMemo(() => {
    if (!recurring) return "";
    if (recurring.reminderDaysBefore === 0) return "No reminder";
    if (recurring.reminderDaysBefore === 1) return "1 day before";
    return `${recurring.reminderDaysBefore} days before`;
  }, [recurring]);

  const isLoading = isLoadingRecurring || isLoadingOccurrences;
  const isError = isErrorRecurring || isErrorOccurrences;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({
      queryKey: queryKeys.recurring.detail(recurringId),
    });
    await queryClient.refetchQueries({
      queryKey: queryKeys.recurring.occurrences(recurringId),
    });
    setRefreshing(false);
  }, [queryClient, recurringId]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }, [router]);

  const handleEdit = useCallback(() => {
    Haptics.selectionAsync();
    router.push(`/recurring/${recurringId}/edit`);
  }, [router, recurringId]);

  const handleToggleStatus = useCallback(() => {
    if (!recurring) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newStatus = recurring.status === "active" ? "paused" : "active";
    statusMutation.mutate({ id: recurringId, status: newStatus });
  }, [recurring, recurringId, statusMutation]);

  const handleDelete = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    deleteMutation.mutate(recurringId, {
      onSuccess: () => {
        router.back();
      },
    });
  }, [recurringId, deleteMutation, router]);

  const handleReviewOccurrence = useCallback(
    (occurrenceId: string, action: "generate" | "skip") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      reviewMutation.mutate({
        occurrenceId,
        action,
        recurringExpenseId: recurringId,
      });
    },
    [recurringId, reviewMutation]
  );

  return {
    recurring,
    occurrences,
    frequencyLabel,
    nextRunDateLabel,
    scheduleSummary,
    reminderLabel,
    isLoading,
    isError,
    refreshing,
    isTogglingStatus: statusMutation.isPending,
    isDeleting: deleteMutation.isPending,
    isReviewing: reviewMutation.isPending,
    handleRefresh,
    handleBack,
    handleEdit,
    handleToggleStatus,
    handleDelete,
    handleReviewOccurrence,
  };
}
