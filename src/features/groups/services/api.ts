import { supabase } from "@/services/supabase/client";
import type { Group } from "@/types";
import { mapGroup, toGroupInsert, toGroupUpdate, type GroupRow } from "@/services/api/mappers";
import { handleSupabaseError } from "@/services/api/errors";

export const groupsApi = {
  async fetchGroups(userId: string): Promise<Group[]> {
    // 1. Get all group IDs the user belongs to
    const { data: memberships, error: membershipError } = await supabase
      .from("group_members")
      .select("group_id")
      .eq("user_id", userId);

    if (membershipError) handleSupabaseError(membershipError, "Failed to fetch group memberships");

    const groupIds = memberships.map((m) => m.group_id);
    if (groupIds.length === 0) return [];

    // 2. Fetch those groups with ALL their members
    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members(*, user:users(*))")
      .in("id", groupIds)
      .order("created_at", { ascending: false })
      .returns<GroupRow[]>();

    if (error) handleSupabaseError(error, "Failed to fetch groups");
    return data?.map(mapGroup) ?? [];
  },

  async fetchGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members(*, user:users(*))")
      .eq("id", groupId)
      .single()
      .returns<GroupRow>();

    if (error) handleSupabaseError(error, "Failed to fetch group");
    return mapGroup(data);
  },

  async createGroup(groupData: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .insert(toGroupInsert(groupData))
      .select()
      .single()
      .returns<GroupRow>();

    if (error) handleSupabaseError(error, "Failed to create group");

    const memberIds = groupData.members?.map((member) => member.userId) ?? [];
    if (memberIds.length > 0) {
      await this.addMembers(data.id, memberIds);
    }

    return await this.fetchGroup(data.id);
  },

  async updateGroup(groupId: string, updates: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .update(toGroupUpdate(updates))
      .eq("id", groupId)
      .select("*, members:group_members(*, user:users(*))")
      .maybeSingle()
      .returns<GroupRow>();

    if (error) handleSupabaseError(error, "Failed to update group");
    if (!data)
      throw new Error("You do not have permission to update this group, or it does not exist.");

    return mapGroup(data);
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) handleSupabaseError(error, "Failed to delete group");
  },

  async addMembers(groupId: string, userIds: string[]): Promise<void> {
    const uniqueIds = Array.from(new Set(userIds));

    for (const id of uniqueIds) {
      const { error } = await supabase.from("group_members").insert({
        group_id: groupId,
        user_id: id,
        balance: 0,
      });
      if (error) handleSupabaseError(error, "Failed to add member");
    }
  },

  async removeMember(groupId: string, userId: string): Promise<void> {
    const { error, count } = await supabase
      .from("group_members")
      .delete({ count: "exact" })
      .eq("group_id", groupId)
      .eq("user_id", userId);

    if (error) handleSupabaseError(error, "Failed to remove member");
    if (count === 0) {
      throw new Error("You do not have permission to remove this member.");
    }
  },
};
