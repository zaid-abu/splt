import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { settlementsApi } from "@/features/settlements/services/api";
import { activitiesApi } from "@/features/activity/services/api";
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
    mutationFn: (settlementData: Partial<Settlement>) =>
      settlementsApi.addSettlement(settlementData),
    onSuccess: (newSettlement) => {
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
      }
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      activitiesApi.logActivity({
        type: "settlement",
        settlement: { id: newSettlement.id } as Settlement,
        groupId: newSettlement.groupId,
        userId: newSettlement.fromUserId,
        user: newSettlement.fromUser,
        description: `Settlement of ${newSettlement.currency} ${newSettlement.amount}`,
        amount: newSettlement.amount,
        currency: newSettlement.currency,
        date: newSettlement.date,
      });
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
