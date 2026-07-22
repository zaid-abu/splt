import { supabase } from "@/services/supabase/client"
import { invitationsApi } from "./api"

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

const rpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("invitationsApi.createFriendInvite", () => {
  it("calls create_friend_invite RPC", async () => {
    rpc.mockResolvedValueOnce({
      data: {
        invite_id: "inv-1",
        raw_token: "tok_secret",
        expires_at: "2026-07-26T10:00:00.000Z",
      },
      error: null,
    })

    const result = await invitationsApi.createFriendInvite("op-1")

    expect(rpc).toHaveBeenCalledWith("create_friend_invite", {
      p_client_operation_id: "op-1",
    })
    expect(result).toEqual({
      inviteId: "inv-1",
      rawToken: "tok_secret",
      expiresAt: new Date("2026-07-26T10:00:00.000Z"),
    })
  })
})

describe("invitationsApi.revokeFriendInvite", () => {
  it("calls revoke_friend_invite RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await invitationsApi.revokeFriendInvite("inv-1")
    expect(rpc).toHaveBeenCalledWith("revoke_friend_invite", {
      p_invite_id: "inv-1",
    })
  })
})

describe("invitationsApi.resolveFriendInvite", () => {
  it("calls resolve_friend_invite RPC with valid result", async () => {
    rpc.mockResolvedValueOnce({
      data: {
        state: "valid",
        inviter_id: "u-1",
        expires_at: "2026-07-26T10:00:00.000Z",
      },
      error: null,
    })

    const result = await invitationsApi.resolveFriendInvite("tok_valid")

    expect(rpc).toHaveBeenCalledWith("resolve_friend_invite", {
      p_token: "tok_valid",
    })
    expect(result).toEqual({
      state: "valid",
      inviterId: "u-1",
      expiresAt: new Date("2026-07-26T10:00:00.000Z"),
    })
  })

  it("maps expired state", async () => {
    rpc.mockResolvedValueOnce({
      data: { state: "expired" },
      error: null,
    })
    const result = await invitationsApi.resolveFriendInvite("tok_expired")
    expect(result).toEqual({ state: "expired" })
  })
})

describe("invitationsApi.redeemFriendInvite", () => {
  it("calls redeem_friend_invite RPC", async () => {
    rpc.mockResolvedValueOnce({ data: "friendship-id-1", error: null })
    const result = await invitationsApi.redeemFriendInvite("tok_abc")
    expect(rpc).toHaveBeenCalledWith("redeem_friend_invite", {
      p_token: "tok_abc",
    })
    expect(result).toBe("friendship-id-1")
  })
})
