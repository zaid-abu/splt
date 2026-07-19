import { supabase } from "@/services/supabase/client"

export interface ReminderInput {
  clientOperationId: string
  groupId?: string
  friendshipId?: string
  currency: string
  message?: string
}

export const notificationsApi = {
  async sendReminder(input: ReminderInput): Promise<string> {
    const { data, error } = await supabase.rpc("send_balance_reminder", {
      p_client_operation_id: input.clientOperationId,
      p_group_id: input.groupId ?? "",
      p_friendship_id: input.friendshipId ?? "",
      p_currency: input.currency,
      p_message: input.message ?? "",
    })

    if (error) throw error
    return data as string
  },
}
