import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import { useGroups } from "@/features/groups/queries/useGroups";
import {
  useRecurringExpense,
  useCreateRecurringExpense,
  useUpdateRecurringExpense,
} from "@/features/recurring/queries/useRecurringExpenses";
import { useAppToast } from "@/hooks/useAppToast";
import { RecurringSplitConfig, RecurringFormValues, type Group } from "@/types";

export interface UseRecurringFormReturn {
  mode: "create" | "edit";
  groups: Group[];
  selectedGroup: Group | undefined;
  isLoadingGroups: boolean;
  isLoadingRecurring: boolean;
  isSubmitting: boolean;
  isError: boolean;
  formValues: RecurringFormValues;
  formErrors: Partial<Record<keyof RecurringFormValues, string>>;
  setField: <K extends keyof RecurringFormValues>(field: K, value: RecurringFormValues[K]) => void;
  handleGroupSelect: (groupId: string) => void;
  handleMemberSelect: (userId: string) => void;
  handleSplitConfigChange: (config: RecurringSplitConfig) => void;
  handleBack: () => void;
  handleSubmit: () => Promise<boolean>;
}

function makeDefaultFormValues(groupId?: string): RecurringFormValues {
  return {
    groupId: groupId ?? "",
    paidByUserId: "",
    title: "",
    amount: null,
    currencyCode: "USD",
    splitMethod: "equal",
    splitConfig: null,
    frequency: "monthly",
    intervalValue: 1,
    dayOfWeek: null,
    dayOfMonth: 1,
    startDate: new Date().toISOString().split("T")[0],
    reminderDaysBefore: 0,
    autoPost: true,
    status: "active",
  };
}

function validate(values: RecurringFormValues): Partial<Record<keyof RecurringFormValues, string>> {
  const errors: Partial<Record<keyof RecurringFormValues, string>> = {};
  if (!values.groupId) errors.groupId = "Select a group";
  if (!values.paidByUserId) errors.paidByUserId = "Select who paid";
  if (!values.title.trim()) errors.title = "Enter a title";
  if (!values.currencyCode) errors.currencyCode = "Select a currency";
  if (values.intervalValue < 1) errors.intervalValue = "Interval must be at least 1";
  if (!values.startDate) errors.startDate = "Pick a start date";
  return errors;
}

export function useRecurringForm(
  recurringId?: string,
  initialGroupId?: string
): UseRecurringFormReturn {
  const router = useRouter();
  const { currentUser } = useAuth();
  const { toast } = useAppToast();

  const mode = recurringId ? "edit" : "create";

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    isError: isErrorGroups,
  } = useGroups(currentUser?.id);

  const {
    data: existingRecurring,
    isLoading: isLoadingRecurring,
    isError: isErrorRecurring,
  } = useRecurringExpense(mode === "edit" ? recurringId : undefined);

  const createMutation = useCreateRecurringExpense();
  const updateMutation = useUpdateRecurringExpense();

  const isSubmitting = createMutation.isPending || updateMutation.isPending;
  const isError = isErrorGroups || isErrorRecurring;

  const [formValues, setFormValues] = useState<RecurringFormValues>(() => {
    if (existingRecurring && mode === "edit") {
      return {
        groupId: existingRecurring.groupId,
        paidByUserId: existingRecurring.paidByUserId,
        title: existingRecurring.title,
        amount: existingRecurring.amount,
        currencyCode: existingRecurring.currencyCode,
        splitMethod: existingRecurring.splitMethod,
        splitConfig: existingRecurring.splitConfig,
        frequency: existingRecurring.frequency,
        intervalValue: existingRecurring.intervalValue,
        dayOfWeek: existingRecurring.dayOfWeek,
        dayOfMonth: existingRecurring.dayOfMonth,
        startDate: existingRecurring.startDate,
        reminderDaysBefore: existingRecurring.reminderDaysBefore,
        autoPost: existingRecurring.autoPost,
        status: existingRecurring.status,
      };
    }
    return makeDefaultFormValues(initialGroupId);
  });

  const [formErrors, setFormErrors] = useState<Partial<Record<keyof RecurringFormValues, string>>>(
    {}
  );

  const selectedGroup = useMemo(
    () => groups.find((g) => g.id === formValues.groupId),
    [groups, formValues.groupId]
  );

  const setField = useCallback(
    <K extends keyof RecurringFormValues>(field: K, value: RecurringFormValues[K]) => {
      setFormValues((prev) => ({ ...prev, [field]: value }));
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    },
    []
  );

  const handleGroupSelect = useCallback((groupId: string) => {
    setFormValues((prev) => ({
      ...prev,
      groupId,
      paidByUserId: "",
      splitConfig: null,
    }));
    setFormErrors((prev) => {
      const next = { ...prev };
      delete next.groupId;
      return next;
    });
  }, []);

  const handleMemberSelect = useCallback(
    (userId: string) => {
      setField("paidByUserId", userId);
    },
    [setField]
  );

  const handleSplitConfigChange = useCallback(
    (config: RecurringSplitConfig) => {
      setField("splitConfig", config);
    },
    [setField]
  );

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/home");
    }
  }, [router]);

  const handleSubmit = useCallback(async (): Promise<boolean> => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const errors = validate(formValues);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.show({
        label: "Validation Error",
        description: "Please fix the errors before submitting.",
        variant: "danger",
        placement: "top",
      });
      return false;
    }

    try {
      if (mode === "create") {
        await createMutation.mutateAsync({
          input: formValues,
          createdBy: currentUser!.id,
        });
        toast.show({
          label: "Recurring Expense Created",
          description: `${formValues.title} has been scheduled.`,
          variant: "success",
          placement: "top",
        });
      } else {
        await updateMutation.mutateAsync({
          id: recurringId!,
          input: formValues,
        });
        toast.show({
          label: "Recurring Expense Updated",
          description: `${formValues.title} has been updated.`,
          variant: "success",
          placement: "top",
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      return true;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Failed to save recurring expense.";
      toast.show({
        label: "Error",
        description: message,
        variant: "danger",
        placement: "top",
      });
      return false;
    }
  }, [formValues, mode, currentUser, recurringId, createMutation, updateMutation, toast]);

  return {
    mode,
    groups,
    selectedGroup,
    isLoadingGroups,
    isLoadingRecurring,
    isSubmitting,
    isError,
    formValues,
    formErrors,
    setField,
    handleGroupSelect,
    handleMemberSelect,
    handleSplitConfigChange,
    handleBack,
    handleSubmit,
  };
}
