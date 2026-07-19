jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

import { supabase } from "@/services/supabase/client"
import { balancesApi } from "./api"

const rpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("balancesApi.fetchOpenBalances", () => {
  it("calls fetch_open_balances RPC and maps results", async () => {
    rpc.mockResolvedValueOnce({
      data: [
        {
          counterparty_id: "u2",
          context_type: "group",
          context_group_id: "g-1",
          currency: "USD",
          signed_amount_minor: 1500,
          last_activity_at: "2026-07-19T10:00:00.000Z",
        },
        {
          counterparty_id: "u3",
          context_type: "direct",
          context_friendship_id: "f-1",
          currency: "EUR",
          signed_amount_minor: -500,
          last_activity_at: "2026-07-18T10:00:00.000Z",
        },
      ],
      error: null,
    })

    const result = await balancesApi.fetchOpenBalances()

    expect(rpc).toHaveBeenCalledWith("fetch_open_balances", {})
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      counterpartyId: "u2",
      context: { type: "group", groupId: "g-1" },
      currency: "USD",
      signedAmountMinor: 1500,
      lastActivityAt: new Date("2026-07-19T10:00:00.000Z"),
    })
    expect(result[1]).toEqual({
      counterpartyId: "u3",
      context: { type: "direct", friendshipId: "f-1" },
      currency: "EUR",
      signedAmountMinor: -500,
      lastActivityAt: new Date("2026-07-18T10:00:00.000Z"),
    })
  })

  it("returns empty array when no open balances", async () => {
    rpc.mockResolvedValueOnce({ data: [], error: null })
    const result = await balancesApi.fetchOpenBalances()
    expect(result).toEqual([])
  })
})
