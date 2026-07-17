import { useCallback, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AppContext";
import { useGroupDetailData } from "./useGroupDetailData";
import { queryKeys } from "@/queries/keys";
import type { User } from "@/types";

export interface UseGroupDetailReturn {
  group: ReturnType<typeof useGroupDetailData>["group"];
  expenses: ReturnType<typeof useGroupDetailData>["expenses"];
  totalExpensesInGroupCurrency: number;
  groupDebts: ReturnType<typeof useGroupDetailData>["groupDebts"];
  oweUsers: User[];
  owedUsers: User[];
  youOwe: number;
  owedToYou: number;
  userById: Map<string, User>;
  isLoading: boolean;
  isError: boolean;
  isAllSettled: boolean;
  memberBalances: Map<string, number>;
  refreshing: boolean;
  currentUserId?: string;
  handleRefresh: () => Promise<void>;
  handleBack: () => void;
  handleSettingsPress: () => void;
  handleMemberPress: (userId: string) => void;
  handleSettleUp: () => void;
  handleAddExpense: () => void;
  handleExpensePress: (expenseId: string) => void;
  refetch: () => void;
}

export function useGroupDetail(groupId: string): UseGroupDetailReturn {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { currentUser } = useAuth();

  const data = useGroupDetailData(groupId, currentUser?.id);

  const [refreshing, setRefreshing] = useState(false);

  const isAllSettled = useMemo(
    () => data.youOwe === 0 && data.owedToYou === 0,
    [data.youOwe, data.owedToYou],
  );

  const memberBalances = useMemo(() => {
    const map = new Map<string, number>();
    if (!data.group) return map;
    data.group.members.forEach((m) => map.set(m.userId, 0));
    data.groupDebts.forEach((debt) => {
      map.set(debt.fromUserId, (map.get(debt.fromUserId) || 0) - debt.amount);
      map.set(debt.toUserId, (map.get(debt.toUserId) || 0) + debt.amount);
    });
    return map;
  }, [data.group, data.groupDebts]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.refetchQueries({ queryKey: queryKeys.groupDetails(groupId) });
    setRefreshing(false);
  }, [queryClient, groupId]);

  const handleBack = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(tabs)");
    }
  }, [router]);

  const handleSettingsPress = useCallback(() => {
    Haptics.selectionAsync();
    router.push(`/group/${groupId}/settings`);
  }, [router, groupId]);

  const handleMemberPress = useCallback(
    (userId: string) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push(`/friend/${userId}`);
    },
    [router],
  );

  const handleSettleUp = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/group/${groupId}/settle`);
  }, [router, groupId]);

  const handleAddExpense = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/expense/new?groupId=${groupId}`);
  }, [router, groupId]);

  const handleExpensePress = useCallback(
    (expenseId: string) => {
      router.push(`/expense/${expenseId}`);
    },
    [router],
  );

  return {
    ...data,
    isAllSettled,
    memberBalances,
    refreshing,
    currentUserId: currentUser?.id,
    handleRefresh,
    handleBack,
    handleSettingsPress,
    handleMemberPress,
    handleSettleUp,
    handleAddExpense,
    handleExpensePress,
  };
}
