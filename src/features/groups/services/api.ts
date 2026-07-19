import { supabase } from "@/services/supabase/client"
import type { Group } from "@/types"
import { mapGroup, type GroupRow } from "@/services/api/mappers"

export interface CreateGroupInput {
  clientOperationId: string
  name: string
  kind?: string
  icon: string
  currency: string
  inviteeIds: string[]
}

export interface UpdateGroupSettingsInput {
  groupId: string
  name: string
  kind?: string
  icon: string
  currency: string
  newExpenseAlerts: boolean
}

export const groupsApi = {
  async fetchGroups(userId: string): Promise<Group[]> {
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId)

    if (membershipError) throw membershipError

    const groupIds = memberships.map((m) => m.group_id)
    if (groupIds.length === 0) return []

    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members(*, user:users(*))")
      .in("id", groupIds)
      .order("created_at", { ascending: false })
      .returns<GroupRow[]>()

    if (error) throw error
    return data?.map(mapGroup) ?? []
  },

  async fetchGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members(*, user:users(*))")
      .eq("id", groupId)
      .single()
      .returns<GroupRow>()

    if (error) throw error
    return mapGroup(data)
  },

  async createGroup(input: CreateGroupInput): Promise<Group> {
    const { data, error } = await supabase.rpc("create_group_v2", {
      p_client_operation_id: input.clientOperationId,
      p_name: input.name,
      p_kind: input.kind ?? null,
      p_icon: input.icon,
      p_currency: input.currency,
      p_invitee_ids: input.inviteeIds,
    })

    if (error) throw error
    return data as Group
  },

  async inviteMembers(groupId: string, inviteeIds: string[]): Promise<string[]> {
    const { data, error } = await supabase.rpc("invite_group_members", {
      p_group_id: groupId,
      p_invitee_ids: inviteeIds,
    })

    if (error) throw error
    return data as string[]
  },

  async respondToInvitation(id: string, decision: "accept" | "decline"): Promise<string> {
    const { data, error } = await supabase.rpc("respond_to_group_invitation", {
      p_invitation_id: id,
      p_decision: decision,
    })

    if (error) throw error
    return data as string
  },

  async cancelInvitation(id: string): Promise<void> {
    const { error } = await supabase.rpc("cancel_group_invitation", {
      p_invitation_id: id,
    })

    if (error) throw error
  },

  async updateSettings(input: UpdateGroupSettingsInput): Promise<void> {
    const { error } = await supabase.rpc("update_group_settings", {
      p_group_id: input.groupId,
      p_name: input.name,
      p_kind: input.kind ?? null,
      p_icon: input.icon,
      p_currency: input.currency,
      p_new_expense_alerts: input.newExpenseAlerts,
    })

    if (error) throw error
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error } = await supabase.rpc("remove_group_member", {
      p_group_id: groupId,
      p_user_id: userId,
    })

    if (error) throw error
  },

  async leaveGroup(groupId: string): Promise<void> {
    const { error } = await supabase.rpc("leave_group", {
      p_group_id: groupId,
    })

    if (error) throw error
  },

  async archiveGroup(groupId: string): Promise<void> {
    const { error } = await supabase.rpc("archive_group", {
      p_group_id: groupId,
    })

    if (error) throw error
  },
}
