import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/queries/keys";
import { activitiesApi } from "@/features/activity/services/api";
import type { Activity } from "@/types";

export function useUserActivities(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.activities,
    queryFn: () => activitiesApi.fetchActivities(userId!),
    enabled: !!userId,
  });
}

export function useLogActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityData: Partial<Activity>) => activitiesApi.logActivity(activityData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
    },
  });
}

export function useDeleteActivity() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (activityId: string) => activitiesApi.deleteActivity(activityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.activities });
    },
  });
}
