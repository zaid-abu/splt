import { useQuery } from "@tanstack/react-query"
import { queryKeys } from "@/queries/keys"
import { balancesApi } from "@/features/balances/services/api"

export function useOpenBalances(userId?: string) {
  return useQuery({
    queryKey: queryKeys.openBalances(userId!),
    queryFn: () => balancesApi.fetchOpenBalances(),
    enabled: !!userId,
  })
}
