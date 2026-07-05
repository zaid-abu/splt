import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/services/api/users";
// Extend queryKeys dynamically or just use a custom array if it's localized
export const userQueryKeys = {
  search: (query: string, currentUserId: string) =>
    ["users", "search", query, currentUserId] as const,
};

export function useSearchUsers(query: string, currentUserId: string) {
  return useQuery({
    queryKey: userQueryKeys.search(query, currentUserId),
    queryFn: () => UsersService.searchUsers(query, currentUserId),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 60 * 1000, // 1 minute cache for search results
  });
}
