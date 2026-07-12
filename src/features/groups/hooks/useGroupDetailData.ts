import { useMemo } from "react";
import { useGroups } from "@/features/groups/queries/useGroups";
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses";
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements";
import * as balancesUtil from "@/features/settlements/utils/balances";
import { calculateTotalGroupExpenses } from "@/features/groups/utils/calculations";
import { useUIStore } from "@/store/useUIStore";
import type { User } from "@/types";

export function useGroupDetailData(groupId: string, currentUserId: string | undefined) {
  const {
    data: groups = [],
    isLoading: isGroupsLoading,
    isError: isGroupsError,
    refetch: refetchGroups,
  } = useGroups(currentUserId);
  const {
    data: groupExpenses = [],
    isLoading: isExpensesLoading,
    isError: isExpensesError,
    refetch: refetchExpenses,
  } = useGroupExpenses(groupId);
  const {
    data: settlements = [],
    isLoading: isSettlementsLoading,
    isError: isSettlementsError,
    refetch: refetchSettlements,
  } = useGroupSettlements(groupId);

  const convertCurrency = useUIStore((s) => s.convertCurrency);
  const preferredCurrency = useUIStore((s) => s.preferredCurrency);

  const group = useMemo(() => groups.find((g) => g.id === groupId), [groups, groupId]);

  const expenses = useMemo(
    () =>
      groupExpenses.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
    [groupExpenses]
  );

  const totalExpensesInGroupCurrency = useMemo(
    () => calculateTotalGroupExpenses(expenses, group?.currency ?? "USD", convertCurrency),
    [expenses, group, convertCurrency]
  );

  const groupDebts = useMemo(() => {
    if (!group) return [];
    return group.simplifyDebts
      ? balancesUtil.getSimplifiedDebts(
          groupId,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        )
      : balancesUtil.getExactPairwiseDebts(
          groupId,
          expenses,
          settlements,
          group,
          preferredCurrency,
          convertCurrency
        );
  }, [group, groupId, expenses, settlements, preferredCurrency, convertCurrency]);

  const oweUsers = useMemo(() => {
    if (!group) return [];
    return groupDebts
      .filter((d) => d.fromUserId === currentUserId)
      .map((d) => group.members.find((m) => m.userId === d.toUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, currentUserId, group]);

  const owedUsers = useMemo(() => {
    if (!group) return [];
    return groupDebts
      .filter((d) => d.toUserId === currentUserId)
      .map((d) => group.members.find((m) => m.userId === d.fromUserId)?.user)
      .filter(Boolean) as User[];
  }, [groupDebts, currentUserId, group]);

  const youOwe = useMemo(
    () =>
      groupDebts
        .filter((d) => d.fromUserId === currentUserId)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, currentUserId]
  );

  const owedToYou = useMemo(
    () =>
      groupDebts
        .filter((d) => d.toUserId === currentUserId)
        .reduce((acc, curr) => acc + curr.amount, 0),
    [groupDebts, currentUserId]
  );

  const userById = useMemo(() => {
    const map = new Map<string, User>();
    group?.members.forEach((m) => map.set(m.userId, m.user));
    return map;
  }, [group]);

  const isLoading = isGroupsLoading || isExpensesLoading || isSettlementsLoading;
  const isError = isGroupsError || isExpensesError || isSettlementsError;
  const refetch = () => {
    refetchGroups();
    refetchExpenses();
    refetchSettlements();
  };

  return {
    group,
    expenses,
    totalExpensesInGroupCurrency,
    groupDebts,
    oweUsers,
    owedUsers,
    youOwe,
    owedToYou,
    userById,
    isLoading,
    isError,
    refetch,
  };
}
