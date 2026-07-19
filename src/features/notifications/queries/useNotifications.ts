import { useQuery } from "@tanstack/react-query"
import { supabase } from "@/services/supabase/client"
import { queryKeys } from "@/queries/keys"
import { mapNotification } from "@/services/api/mappers"
import type { Tables } from "@/services/supabase/database.types"

export function useNotifications(userId?: string) {
  return useQuery({
    queryKey: queryKeys.notifications(userId),
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("recipient_id", userId)
        .is("read_at", null)
        .order("created_at", { ascending: false })

      if (error) throw error

      return (data ?? []).map((row) => mapNotification(row as Tables<"notifications">))
    },
    enabled: !!userId,
  })
}
