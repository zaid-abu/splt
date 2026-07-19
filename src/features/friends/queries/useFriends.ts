import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { FriendsService } from "../services/api"
import { useGroups } from "@/features/groups/queries/useGroups"
import type { User } from "@/types"
import { useMemo } from "react"
import { queryKeys } from "@/queries/keys"
import type { FriendshipAction } from "../services/api"

export function useFriends(userId?: string) {
  const friendsQuery = useQuery({
    queryKey: queryKeys.friendList(userId),
    queryFn: () => FriendsService.getFriends(userId!),
    enabled: !!userId,
  })

  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(userId)

  const combinedFriends = useMemo(() => {
    const friendsMap = new Map<string, User>()

    groups.forEach((g) => {
      g.members.forEach((m) => {
        if (m.userId !== userId) {
          friendsMap.set(m.userId, m.user)
        }
      })
    })

    if (friendsQuery.data) {
      friendsQuery.data.forEach((f) => {
        if (f.friendUser && f.friendUser.id !== userId) {
          friendsMap.set(f.friendUser.id, f.friendUser)
        }
      })
    }

    return Array.from(friendsMap.values())
  }, [groups, friendsQuery.data, userId])

  return {
    data: combinedFriends,
    isLoading: friendsQuery.isLoading || isLoadingGroups,
    isError: friendsQuery.isError,
    error: friendsQuery.error,
    refetch: friendsQuery.refetch,
  }
}

export function useAllFriendships(userId?: string) {
  return useQuery({
    queryKey: queryKeys.allFriendships(userId),
    queryFn: () => FriendsService.getAllFriendships(userId!),
    enabled: !!userId,
  })
}

export function useTransitionFriendship() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({
      counterpartyId,
      action,
    }: {
      counterpartyId: string
      action: FriendshipAction
    }) => FriendsService.transition(counterpartyId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.friends })
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications() })
    },
  })
}

export function useSearchFriends() {
  return useMutation({
    mutationFn: (email: string) => FriendsService.searchExactEmail(email),
  })
}
