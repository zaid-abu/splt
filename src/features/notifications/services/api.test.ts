jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

import { supabase } from "@/services/supabase/client"
import { notificationsApi } from "./api"
import type { ReminderInput } from "./api"

const rpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("notificationsApi.sendReminder", () => {
  it("calls send_balance_reminder RPC with group_id", async () => {
    rpc.mockResolvedValueOnce({ data: "n-1", error: null })

    const input: ReminderInput = {
      clientOperationId: "op-1",
      groupId: "g-1",
      currency: "USD",
      message: "Please settle up",
    }

    const result = await notificationsApi.sendReminder(input)

    expect(rpc).toHaveBeenCalledWith("send_balance_reminder", {
      p_client_operation_id: "op-1",
      p_group_id: "g-1",
      p_friendship_id: null,
      p_currency: "USD",
      p_message: "Please settle up",
    })
    expect(result).toBe("n-1")
  })

  it("calls RPC with friendship_id", async () => {
    rpc.mockResolvedValueOnce({ data: "n-2", error: null })

    const input: ReminderInput = {
      clientOperationId: "op-2",
      friendshipId: "f-1",
      currency: "EUR",
    }

    const result = await notificationsApi.sendReminder(input)

    expect(rpc).toHaveBeenCalledWith("send_balance_reminder", {
      p_client_operation_id: "op-2",
      p_group_id: null,
      p_friendship_id: "f-1",
      p_currency: "EUR",
      p_message: null,
    })
    expect(result).toBe("n-2")
  })

  it("throws on RPC error", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("RPC failed") })
    await expect(
      notificationsApi.sendReminder({
        clientOperationId: "op-1",
        currency: "USD",
      })
    ).rejects.toThrow("RPC failed")
  })
})
