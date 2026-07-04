import { supabase } from "@/services/supabase/client";
import type { Group } from "@/types";
import { mapGroup, toGroupInsert, toGroupUpdate, type GroupRow } from "@/services/api/mappers";

export const groupsApi = {
  async fetchGroups(userId: string): Promise<Group[]> {
    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members!inner(*, user:users(*))")
      .eq("group_members.user_id", userId)
      .order("created_at", { ascending: false })
      .returns<GroupRow[]>();

    if (error) throw error;
    return data?.map(mapGroup) ?? [];
  },

  async fetchGroup(groupId: string): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .select("*, members:group_members(*, user:users(*))")
      .eq("id", groupId)
      .single()
      .returns<GroupRow>();

    if (error) throw error;
    return mapGroup(data);
  },

  async createGroup(groupData: Partial<Group>): Promise<Group> {
    const { data, error } = await supabase
      .from("groups")
      .insert(toGroupInsert(groupData))
      .select()
      .single()
      .returns<GroupRow>();

    if (error) throw error;

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
      .single()
      .returns<GroupRow>();

    if (error) throw error;
    return mapGroup(data);
  },

  async deleteGroup(groupId: string): Promise<void> {
    const { error } = await supabase.from("groups").delete().eq("id", groupId);
    if (error) throw error;
  },

  async addMembers(groupId: string, userIds: string[]): Promise<void> {
    const members = userIds.map((id) => ({
      group_id: groupId,
      user_id: id,
      balance: 0,
    }));

    const { error } = await supabase.from("group_members").insert(members);
    if (error) throw error;
  },
};
