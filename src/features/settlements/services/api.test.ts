const mockReturns = jest.fn().mockResolvedValue({ data: null, error: null })

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      single: jest.fn().mockReturnThis(),
      returns: mockReturns,
    })),
  },
}))

import { supabase } from "@/services/supabase/client"
import { settlementsApi } from "./api"
import type { SettlementMutationInput } from "@/features/money/types"

const rpc = supabase.rpc as jest.Mock

function makeSettlementRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "s-1",
    group_id: "g-1",
    friendship_id: null,
    from_user_id: "u1",
    to_user_id: "u2",
    amount: 10,
    amount_minor: 1000,
    currency: "USD",
    method: "cash",
    date: "2024-01-15T00:00:00.000Z",
    note: null,
    client_operation_id: "op-1",
    created_at: "2024-01-15T00:00:00.000Z",
    ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("settlementsApi.createSettlement", () => {
  it("calls create_settlement_v2 RPC with group context", async () => {
    rpc.mockResolvedValueOnce({ data: "s-1", error: null })
    mockReturns.mockResolvedValueOnce({
      data: makeSettlementRow(),
      error: null,
    })

    const input: SettlementMutationInput = {
      clientOperationId: "op-1",
      counterpartyId: "u2",
      context: { type: "group", groupId: "g-1" },
      amountMinor: 1000,
      currency: "USD",
      method: "cash",
    }

    const result = await settlementsApi.createSettlement(input)

    expect(rpc).toHaveBeenCalledWith("create_settlement_v2", {
      p_client_operation_id: "op-1",
      p_counterparty_id: "u2",
      p_group_id: "g-1",
      p_friendship_id: "",
      p_amount_minor: 1000,
      p_currency: "USD",
      p_method: "cash",
      p_note: "",
    })
    expect(result).toMatchObject({ id: "s-1", groupId: "g-1" })
  })

  it("calls create_settlement_v2 RPC with direct/friendship context", async () => {
    rpc.mockResolvedValueOnce({ data: "s-2", error: null })
    mockReturns.mockResolvedValueOnce({
      data: makeSettlementRow({ id: "s-2", group_id: null, friendship_id: "f-1" }),
      error: null,
    })

    const input: SettlementMutationInput = {
      clientOperationId: "op-2",
      counterpartyId: "u2",
      context: { type: "direct", friendshipId: "f-1" },
      amountMinor: 500,
      currency: "USD",
      method: "bank_transfer",
      note: "Thanks!",
    }

    await settlementsApi.createSettlement(input)

    expect(rpc).toHaveBeenCalledWith("create_settlement_v2", {
      p_client_operation_id: "op-2",
      p_counterparty_id: "u2",
      p_group_id: "",
      p_friendship_id: "f-1",
      p_amount_minor: 500,
      p_currency: "USD",
      p_method: "bank_transfer",
      p_note: "Thanks!",
    })
  })

  it("throws when RPC errors", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("RPC failed") })

    const input: SettlementMutationInput = {
      clientOperationId: "op-3",
      counterpartyId: "u2",
      context: { type: "group", groupId: "g-1" },
      amountMinor: 1000,
      currency: "USD",
      method: "cash",
    }

    await expect(settlementsApi.createSettlement(input)).rejects.toThrow("RPC failed")
  })
})
