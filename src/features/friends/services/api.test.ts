jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      or: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn(),
    })),
  },
}))

import { supabase } from "@/services/supabase/client"
import { FriendsService } from "./api"

const rpc = supabase.rpc as jest.Mock
const from = supabase.from as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("FriendsService.searchExactEmail", () => {
  it("calls search_user_by_email RPC and maps found result", async () => {
    rpc.mockResolvedValueOnce({
      data: { state: "found", user_id: "u-1", name: "Alice", initials: "A", avatar: null },
      error: null,
    })

    const result = await FriendsService.searchExactEmail("alice@example.com")

    expect(rpc).toHaveBeenCalledWith("search_user_by_email", {
      p_email: "alice@example.com",
    })
    expect(result).toEqual({
      state: "found",
      userId: "u-1",
      name: "Alice",
      initials: "A",
      avatar: undefined,
    })
  })

  it("maps not_found result", async () => {
    rpc.mockResolvedValueOnce({
      data: { state: "not_found" },
      error: null,
    })

    const result = await FriendsService.searchExactEmail("missing@example.com")
    expect(result).toEqual({ state: "not_found" })
  })
})

describe("FriendsService.transition", () => {
  it("calls transition_friendship RPC with request action", async () => {
    rpc.mockResolvedValueOnce({ data: "pending", error: null })

    const result = await FriendsService.transition("u2", "request")

    expect(rpc).toHaveBeenCalledWith("transition_friendship", {
      p_counterparty_id: "u2",
      p_action: "request",
    })
    expect(result).toBe("pending")
  })

  it("calls RPC with accept action", async () => {
    rpc.mockResolvedValueOnce({ data: "accepted", error: null })
    await FriendsService.transition("u2", "accept")
    expect(rpc).toHaveBeenCalledWith("transition_friendship", {
      p_counterparty_id: "u2",
      p_action: "accept",
    })
  })

  it("calls RPC with block action", async () => {
    rpc.mockResolvedValueOnce({ data: "blocked", error: null })
    const result = await FriendsService.transition("u2", "block")
    expect(rpc).toHaveBeenCalledWith("transition_friendship", {
      p_counterparty_id: "u2",
      p_action: "block",
    })
    expect(result).toBe("blocked")
  })

  it("throws on RPC error", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("Not found") })
    await expect(FriendsService.transition("u2", "accept")).rejects.toThrow("Not found")
  })
})

describe("FriendsService.getFriends / getAllFriendships / getPendingFriendRequests", () => {
  it("keeps existing query-based methods unchanged", async () => {
    const resolvedValue = Promise.resolve({ data: [], error: null })

    const queryProxy = new Proxy(
      {},
      {
        get(_target, prop) {
          if (prop === "then") return resolvedValue.then.bind(resolvedValue)
          return jest.fn(() => queryProxy)
        },
      }
    )

    from.mockReturnValue(queryProxy)

    const result = await FriendsService.getFriends("user-1")
    expect(result).toEqual([])
    expect(from).toHaveBeenCalledWith("friendships")
  })
})
