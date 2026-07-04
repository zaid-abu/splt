import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { groupsApi } from "@/services/api/groups";
import type { Group } from "@/types";

export function useGroups(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => groupsApi.fetchGroups(userId!),
    enabled: !!userId,
  });
}

export function useGroupDetails(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupDetails(groupId!),
    queryFn: () => groupsApi.fetchGroup(groupId!),
    enabled: !!groupId,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupData: any) => groupsApi.createGroup(groupData),
    onSuccess: (newGroup) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<Group> }) =>
      groupsApi.updateGroup(id, updates),
    onSuccess: (updatedGroup, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(variables.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
    },
  });
}

export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.deleteGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.removeQueries({ queryKey: queryKeys.groupDetails(groupId) });
    },
  });
}

export function useAddGroupMembers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      groupsApi.addMembers(groupId, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(variables.groupId) });
    },
  });
}
