import { supabase } from "@/services/supabase/client"
import { groupsApi } from "./api"
import type { CreateGroupInput, UpdateGroupSettingsInput } from "./api"

jest.mock("@/services/supabase/client", () => ({
  supabase: {
    rpc: jest.fn(),
  },
}))

const rpc = supabase.rpc as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("groupsApi.createGroup", () => {
  it("calls create_group_v2 RPC with correct params", async () => {
    const expectedGroup = { id: "g-1", name: "Lake house" }
    rpc.mockResolvedValueOnce({ data: expectedGroup, error: null })

    const input: CreateGroupInput = {
      clientOperationId: "op-1",
      name: "Lake house",
      kind: "Trip",
      icon: "Home",
      currency: "USD",
      inviteeIds: ["u2"],
    }

    const result = await groupsApi.createGroup(input)

    expect(rpc).toHaveBeenCalledWith("create_group_v2", {
      p_client_operation_id: "op-1",
      p_name: "Lake house",
      p_kind: "Trip",
      p_icon: "Home",
      p_currency: "USD",
      p_invitee_ids: ["u2"],
    })
    expect(result).toEqual(expectedGroup)
  })

  it("throws when RPC errors", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: new Error("RPC failed") })
    await expect(
      groupsApi.createGroup({
        clientOperationId: "op-1",
        name: "Test",
        icon: "Home",
        currency: "USD",
        inviteeIds: [],
      })
    ).rejects.toThrow("RPC failed")
  })
})

describe("groupsApi.inviteMembers", () => {
  it("calls invite_group_members RPC", async () => {
    rpc.mockResolvedValueOnce({ data: ["inv-1", "inv-2"], error: null })

    const result = await groupsApi.inviteMembers("g-1", ["u2", "u3"])

    expect(rpc).toHaveBeenCalledWith("invite_group_members_v2", {
      p_group_id: "g-1",
      p_invitee_ids: ["u2", "u3"],
    })
    expect(result).toEqual(["inv-1", "inv-2"])
  })
})

describe("groupsApi.respondToInvitation", () => {
  it("calls respond_to_group_invitation RPC with accept", async () => {
    rpc.mockResolvedValueOnce({ data: "accepted", error: null })

    const result = await groupsApi.respondToInvitation("inv-1", "accept")

    expect(rpc).toHaveBeenCalledWith("respond_group_invitation", {
      p_invitation_id: "inv-1",
      p_decision: "accept",
    })
    expect(result).toBe("accepted")
  })

  it("calls RPC with decline", async () => {
    rpc.mockResolvedValueOnce({ data: "declined", error: null })
    await groupsApi.respondToInvitation("inv-1", "decline")
    expect(rpc).toHaveBeenCalledWith("respond_group_invitation", {
      p_invitation_id: "inv-1",
      p_decision: "decline",
    })
  })
})

describe("groupsApi.cancelInvitation", () => {
  it("calls cancel_group_invitation RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await groupsApi.cancelInvitation("inv-1")
    expect(rpc).toHaveBeenCalledWith("cancel_group_invitation", {
      p_invitation_id: "inv-1",
    })
  })
})

describe("groupsApi.updateSettings", () => {
  it("calls update_group_settings RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })

    const input: UpdateGroupSettingsInput = {
      groupId: "g-1",
      name: "Updated Group",
      icon: "Star",
      currency: "EUR",
      newExpenseAlerts: true,
    }

    await groupsApi.updateSettings(input)

    expect(rpc).toHaveBeenCalledWith("update_group_settings_v2", {
      p_group_id: "g-1",
      p_name: "Updated Group",
      p_kind: "",
      p_icon: "Star",
      p_currency: "EUR",
      p_new_expense_alerts: true,
    })
  })
})

describe("groupsApi.removeMember", () => {
  it("calls remove_group_member RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await groupsApi.removeMember("g-1", "u2")
    expect(rpc).toHaveBeenCalledWith("remove_group_member_v2", {
      p_group_id: "g-1",
      p_user_id: "u2",
    })
  })
})

describe("groupsApi.leaveGroup", () => {
  it("calls leave_group RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await groupsApi.leaveGroup("g-1")
    expect(rpc).toHaveBeenCalledWith("leave_group_v2", {
      p_group_id: "g-1",
    })
  })
})

describe("groupsApi.archiveGroup", () => {
  it("calls archive_group RPC", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: null })
    await groupsApi.archiveGroup("g-1")
    expect(rpc).toHaveBeenCalledWith("archive_group_v2", {
      p_group_id: "g-1",
    })
  })
})
