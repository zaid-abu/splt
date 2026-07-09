import { useQuery } from "@tanstack/react-query";
import { FriendsService } from "@/features/friends/services/api";
import type { AppNotification } from "@/types";
import { queryKeys } from "@/queries/keys";

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: async () => {
      if (!userId) return [];

      const pendingRequests = await FriendsService.getPendingFriendRequests(userId);

      const notifications: AppNotification[] = pendingRequests.map((req) => ({
        id: `friend_req_${req.id}`,
        type: "friend_request",
        title: "New Friend Request",
        subtitle: `${req.friendUser?.name || "Someone"} wants to be your friend.`,
        date: req.createdAt,
        data: req,
      }));

      // In the future, we can add group invites, settlements, etc. here
      // and sort them by date descending

      return notifications.sort((a, b) => b.date.getTime() - a.date.getTime());
    },
    enabled: !!userId,
  });
}
