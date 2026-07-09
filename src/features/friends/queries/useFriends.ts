import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FriendsService } from "../services/api";
import { useGroups } from "@/features/groups/queries/useGroups";
import type { User } from "@/types";
import { useMemo } from "react";

export const friendKeys = {
  all: ["friends"] as const,
  lists: () => [...friendKeys.all, "list"] as const,
  list: (userId?: string) => [...friendKeys.lists(), userId] as const,
};

// This hook returns the combined list of explicit friends + group-derived friends
export function useFriends(userId?: string) {
  // 1. Fetch explicit friendships
  const friendsQuery = useQuery({
    queryKey: friendKeys.list(userId),
    queryFn: () => FriendsService.getFriends(userId!),
    enabled: !!userId,
  });

  // 2. Fetch groups to derive implicit friends
  const { data: groups = [], isLoading: isLoadingGroups } = useGroups(userId);

  const combinedFriends = useMemo(() => {
    const friendsMap = new Map<string, User>();

    // Add friends from groups
    groups.forEach((g) => {
      g.members.forEach((m) => {
        if (m.userId !== userId) {
          friendsMap.set(m.userId, m.user);
        }
      });
    });

    // Add explicit friends (will overwrite group-derived with the same ID, which is fine)
    if (friendsQuery.data) {
      friendsQuery.data.forEach((f) => {
        if (f.friendUser && f.friendUser.id !== userId) {
          friendsMap.set(f.friendUser.id, f.friendUser);
        }
      });
    }

    return Array.from(friendsMap.values());
  }, [groups, friendsQuery.data, userId]);

  return {
    data: combinedFriends,
    isLoading: friendsQuery.isLoading || isLoadingGroups,
    error: friendsQuery.error,
  };
}

export function useAllFriendships(userId?: string) {
  return useQuery({
    queryKey: [...friendKeys.list(userId), "all-friendships"],
    queryFn: () => FriendsService.getAllFriendships(userId!),
    enabled: !!userId,
  });
}

export function useAddFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      friendId,
      groupId,
    }: {
      userId: string;
      friendId: string;
      groupId?: string;
    }) => FriendsService.addFriend(userId, friendId, groupId),
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: friendKeys.list(userId) });
    },
  });
}

export function useAcceptFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      FriendsService.acceptFriendship(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRejectFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      FriendsService.rejectFriendship(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}

export function useRemoveFriend() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ friendshipId }: { friendshipId: string }) =>
      FriendsService.removeFriendship(friendshipId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: friendKeys.all });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });
}
