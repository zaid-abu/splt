import { supabase } from "@/services/supabase/client"
import type { OpenBalance } from "@/features/money/types"

function mapOpenBalanceRow(row: {
  counterparty_id: string
  context_type: "group" | "direct"
  context_group_id?: string | null
  context_friendship_id?: string | null
  currency: string
  signed_amount_minor: number
  last_activity_at: string
}): OpenBalance {
  const context =
    row.context_type === "group"
      ? { type: "group" as const, groupId: row.context_group_id! }
      : { type: "direct" as const, friendshipId: row.context_friendship_id! }

  return {
    counterpartyId: row.counterparty_id,
    context,
    currency: row.currency,
    signedAmountMinor: row.signed_amount_minor,
    lastActivityAt: new Date(row.last_activity_at),
  }
}

export const balancesApi = {
  async fetchOpenBalances(): Promise<OpenBalance[]> {
    const { data, error } = await supabase.rpc("fetch_open_balances", {})

    if (error) throw error

    const rows = data as {
      counterparty_id: string
      context_type: "group" | "direct"
      context_group_id?: string | null
      context_friendship_id?: string | null
      currency: string
      signed_amount_minor: number
      last_activity_at: string
    }[]

    return (rows ?? []).map(mapOpenBalanceRow)
  },
}
