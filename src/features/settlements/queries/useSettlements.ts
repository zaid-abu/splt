import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { settlementsApi } from "@/features/settlements/services/api";
import type { Settlement } from "@/types";
import type { SettlementMutationInput } from "@/features/money/types";

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
    onSuccess: (newSettlement) => {
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useAddSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementData: Partial<Settlement>) =>
      settlementsApi.addSettlement(settlementData),
    onSuccess: (newSettlement) => {
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementId: string) => settlementsApi.deleteSettlement(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      queryClient.invalidateQueries({ queryKey: ["balances"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    },
  });
}
