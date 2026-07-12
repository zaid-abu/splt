import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { getUserBalances } from "@/features/settlements/utils/balances";
import type { Group, Expense, Settlement, Currency } from "@/types";
import type { CurrencyConverter } from "@/features/settlements/utils/balances";

export function useOverallBalances(
  userId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
) {
  return useQuery({
    queryKey: [
      ...queryKeys.userBalances(userId),
      {
        groupsHash: hashData(groups),
        expensesHash: hashData(expenses),
        settlementsHash: hashData(settlements),
      },
    ],
    queryFn: () =>
      getUserBalances(
        userId,
        undefined,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useGroupBalance(
  userId: string,
  groupId: string,
  groups: Group[],
  expenses: Expense[],
  settlements: Settlement[],
  preferredCurrency: Currency,
  convertCurrency: CurrencyConverter
) {
  return useQuery({
    queryKey: [
      ...queryKeys.groupBalances(groupId),
      {
        groupsHash: hashData(groups),
        expensesHash: hashData(expenses),
        settlementsHash: hashData(settlements),
      },
    ],
    queryFn: () =>
      getUserBalances(
        userId,
        groupId,
        groups,
        expenses,
        settlements,
        preferredCurrency,
        convertCurrency
      ),
    enabled: !!userId && !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

function hashData(data: unknown[]): number {
  let hash = 0;
  for (const item of data) {
    const id = (item as { id?: string }).id || "";
    for (let i = 0; i < id.length; i++) {
      hash = (hash << 5) - hash + id.charCodeAt(i);
      hash |= 0;
    }
  }
  return hash;
}
