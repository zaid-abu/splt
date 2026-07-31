import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { settlementsApi } from "@/features/settlements/services/api";
import type { SettlementMutationInput } from "@/features/money/types";

type DeleteSettlementInput = string | { settlementId: string; groupId?: string };

function invalidateSettlementQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  settlement?: { groupId?: string; fromUserId?: string; toUserId?: string }
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
  queryClient.invalidateQueries({ queryKey: queryKeys.activities });
  queryClient.invalidateQueries({ queryKey: queryKeys.groups });
  queryClient.invalidateQueries({ queryKey: ["balances"] });
  queryClient.invalidateQueries({ queryKey: ["home"] });
  queryClient.invalidateQueries({ queryKey: ["people"] });
  queryClient.invalidateQueries({ queryKey: ["circles"] });

  if (settlement?.groupId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.groupSettlements(settlement.groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groupActivities(settlement.groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groupBalances(settlement.groupId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.groupSnapshot(settlement.groupId) });
  }

  for (const userId of [settlement?.fromUserId, settlement?.toUserId]) {
    if (!userId) continue;
    queryClient.invalidateQueries({ queryKey: queryKeys.home(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.personSnapshot(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.personDetail(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.userBalances(userId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.openBalances(userId) });
  }
}

export function useGroupSettlements(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupSettlements(groupId!),
    queryFn: () => settlementsApi.fetchGroupSettlements(groupId!),
    enabled: !!groupId,
  });
}

export function useUserSettlements(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settlements,
    queryFn: () => settlementsApi.fetchUserSettlements(userId!),
    enabled: !!userId,
  });
}

export function useCreateSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SettlementMutationInput) => settlementsApi.createSettlement(input),
    onSuccess: (newSettlement) => invalidateSettlementQueries(queryClient, newSettlement),
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: DeleteSettlementInput) => {
      const details =
        typeof input === "string" ? await settlementsApi.fetchSettlement(input) : input;
      const settlementId = typeof input === "string" ? input : input.settlementId;
      await settlementsApi.deleteSettlement(settlementId);
      return typeof input === "string" ? details : input;
    },
    onSuccess: (deletedSettlement) => invalidateSettlementQueries(queryClient, deletedSettlement),
  });
}
