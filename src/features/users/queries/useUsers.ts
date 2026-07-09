import { useQuery } from "@tanstack/react-query";
import { UsersService } from "@/services/api/users";
import { queryKeys } from "@/queries/keys";

export function useSearchUsers(query: string, currentUserId: string) {
  return useQuery({
    queryKey: queryKeys.userSearch(query, currentUserId),
    queryFn: () => UsersService.searchUsers(query, currentUserId),
    enabled: !!query && query.trim().length >= 2,
    staleTime: 60 * 1000, // 1 minute cache for search results
  });
}
