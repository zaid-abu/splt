import { useCallback } from "react";
import { useAuth } from "@/context/AppContext";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useUserExpenses } from "@/features/expenses/queries/useExpenses";
import { useUserSettlements } from "@/features/settlements/queries/useSettlements";
import { useSignOut, useDeleteAccount } from "@/features/auth/hooks/useAuthMutations";
import { useUIStore } from "@/store/useUIStore";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { Uniwind } from "uniwind";
import type { Currency } from "@/types";

export function useProfile() {
  const { currentUser } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: groups = [],
    isLoading: isLoadingGroups,
    error: groupsError,
    refetch: refetchGroups,
  } = useGroups(currentUser?.id);
  const {
    data: expenses = [],
    isLoading: isLoadingExpenses,
    error: expensesError,
    refetch: refetchExpenses,
  } = useUserExpenses(currentUser?.id);
  const {
    data: settlements = [],
    isLoading: isLoadingSettlements,
    error: settlementsError,
    refetch: refetchSettlements,
  } = useUserSettlements(currentUser?.id);

  const isFirstLoad = isLoadingGroups || isLoadingExpenses || isLoadingSettlements;
  const hasError = !!groupsError || !!expensesError || !!settlementsError;

  const preferredCurrency = useUIStore((s) => s.preferredCurrency);
  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const setCurrency = useUIStore((s) => s.setCurrency);
  const isDarkMode = useUIStore((s) => s.isDarkMode);
  const setDarkMode = useUIStore((s) => s.setDarkMode);

  const { mutate: signOut } = useSignOut();
  const { mutateAsync: deleteAccount } = useDeleteAccount();

  const owedToYou = balancesUtil.getTotalOwedToMe(
    currentUser.id,
    groups,
    expenses,
    settlements,
    preferredCurrency,
    convertCurrency
  );
  const youOwe = Math.abs(
    balancesUtil.getTotalIOwe(
      currentUser.id,
      groups,
      expenses,
      settlements,
      preferredCurrency,
      convertCurrency
    )
  );

  const onRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await queryClient.invalidateQueries({
      queryKey: ["groups", "expenses", "settlements"],
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, [queryClient]);

  const handleThemeToggle = (value: boolean) => {
    Haptics.selectionAsync();
    setDarkMode(value);
    Uniwind.setTheme(value ? "dark" : "light");
  };

  const handleCurrencyChange = (currency: Currency) => {
    setCurrency(currency);
  };

  return {
    currentUser,
    groups,
    owedToYou,
    youOwe,
    isFirstLoad,
    hasError,
    preferredCurrency,
    isDarkMode,
    signOut,
    deleteAccount,
    onRefresh,
    handleThemeToggle,
    handleCurrencyChange,
    refetchGroups,
    refetchExpenses,
    refetchSettlements,
  };
}
