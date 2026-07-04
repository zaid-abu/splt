import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { settlementsApi } from "@/services/api/settlements";
import type { Settlement } from "@/types";

export function useGroupSettlements(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupSettlements(groupId!),
    queryFn: () => settlementsApi.fetchGroupSettlements(groupId!),
    enabled: !!groupId,
  });
}

export function useUserSettlements(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.settlements, // Could refine based on user
    queryFn: () => settlementsApi.fetchUserSettlements(userId!),
    enabled: !!userId,
  });
}

export function useAddSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementData: Partial<Settlement>) => settlementsApi.addSettlement(settlementData),
    onSuccess: (newSettlement) => {
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.groupSettlements(newSettlement.groupId) });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
    },
  });
}

export function useDeleteSettlement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (settlementId: string) => settlementsApi.deleteSettlement(settlementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
    },
  });
}
