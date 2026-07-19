import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { queryKeys } from "@/queries/keys"
import { groupsApi } from "@/features/groups/services/api"
import type { CreateGroupInput, UpdateGroupSettingsInput } from "@/features/groups/services/api"

export function useGroups(userId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groups,
    queryFn: () => groupsApi.fetchGroups(userId!),
    enabled: !!userId,
  })
}

export function useGroupDetails(groupId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.groupDetails(groupId!),
    queryFn: () => groupsApi.fetchGroup(groupId!),
    enabled: !!groupId,
  })
}

export function useCreateGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CreateGroupInput) => groupsApi.createGroup(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    },
  })
}

export function useUpdateGroupSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: UpdateGroupSettingsInput) => groupsApi.updateSettings(input),
    onSuccess: (_, input) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(input.groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    },
  })
}

export function useArchiveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.archiveGroup(groupId),
    onSuccess: (_, groupId) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
      queryClient.removeQueries({ queryKey: queryKeys.groupDetails(groupId) })
    },
  })
}

export function useInviteMembers() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userIds }: { groupId: string; userIds: string[] }) =>
      groupsApi.inviteMembers(groupId, userIds),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(variables.groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    },
  })
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      groupsApi.removeMember(groupId, userId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetails(variables.groupId) })
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    },
  })
}

export function useLeaveGroup() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (groupId: string) => groupsApi.leaveGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
    },
  })
}

export function useRespondToInvitation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: "accept" | "decline" }) =>
      groupsApi.respondToInvitation(id, decision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })
}
