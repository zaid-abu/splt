import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { settlementsApi } from "@/features/settlements/services/api";
import { activitiesApi } from "@/features/activity/services/api";
import { useAuth } from "@/context/AppContext";
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
  const { currentUser } = useAuth();

  return useMutation({
    mutationFn: (settlementData: Partial<Settlement>) =>
      settlementsApi.addSettlement(settlementData),
    onMutate: async (newSettlement) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.settlements });

      const previousSettlements = queryClient.getQueryData(queryKeys.settlements);

      const optimisticSettlement: Settlement = {
        ...(newSettlement as Settlement),
        id: `temp-${Date.now()}`,
        date: newSettlement.date ?? new Date(),
      };

      queryClient.setQueryData(queryKeys.settlements, (old: Settlement[] = []) => [
        optimisticSettlement,
        ...old,
      ]);

      if (newSettlement.groupId) {
        await queryClient.cancelQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
        queryClient.setQueryData(
          queryKeys.groupSettlements(newSettlement.groupId),
          (old: Settlement[] = []) => [optimisticSettlement, ...old]
        );
      }

      return { previousSettlements };
    },
    onError: (err, newSettlement, context) => {
      if (context?.previousSettlements) {
        queryClient.setQueryData(queryKeys.settlements, context.previousSettlements);
      }
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
      }
    },
    onSettled: (_data, _error, newSettlement) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settlements });
      if (newSettlement.groupId) {
        queryClient.invalidateQueries({
          queryKey: queryKeys.groupSettlements(newSettlement.groupId),
        });
      }
    },
    onSuccess: (newSettlement) => {
      activitiesApi.logActivity({
        type: "settlement",
        settlement: { id: newSettlement.id } as Settlement,
        groupId: newSettlement.groupId,
        userId: currentUser.id,
        user: newSettlement.fromUser,
        description: `Settlement`,
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
