import { supabase } from "@/services/supabase/client";
import type { Friendship } from "@/types";
import { mapUser } from "@/services/api/mappers";

export const FriendsService = {
  async getFriends(userId: string): Promise<Friendship[]> {
    const { data, error } = await (supabase as any)
      .from("friendships")
      .select(
        `
        *,
        user:users!user_id(*),
        friend:users!friend_id(*)
      `
      )
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    return (data || []).map((row: any) => {
      // Determine which one is the friend vs the current user
      const isUserInitiator = row.user_id === userId;
      const friendData = isUserInitiator ? row.friend : row.user;

      return {
        id: row.id,
        userId: row.user_id,
        friendId: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        friendUser: friendData ? mapUser(friendData) : undefined,
      };
    });
  },

  async getAllFriendships(userId: string): Promise<Friendship[]> {
    const { data, error } = await (supabase as any)
      .from("friendships")
      .select(
        `
        *,
        user:users!user_id(*),
        friend:users!friend_id(*)
      `
      )
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const isUserInitiator = row.user_id === userId;
      const friendData = isUserInitiator ? row.friend : row.user;

      return {
        id: row.id,
        userId: row.user_id,
        friendId: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        friendUser: friendData ? mapUser(friendData) : undefined,
      };
    });
  },

  async addFriend(userId: string, friendId: string, groupId?: string): Promise<Friendship> {
    // Check if friendship already exists
    const { data: existing } = await (supabase as any)
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("You are already friends.");
      }

      let metadata = existing.metadata || {};
      if (groupId) {
        const groups = new Set(metadata.pending_groups || []);
        groups.add(groupId);
        metadata = { ...metadata, pending_groups: Array.from(groups) };
      }

      const { data, error } = await (supabase as any)
        .from("friendships")
        .update({ metadata })
        .eq("id", existing.id)
        .select(
          `
          *,
          user:users!user_id(*),
          friend:users!friend_id(*)
        `
        )
        .single();

      if (error) throw error;

      const isUserInitiator = data.user_id === userId;
      const friendData = isUserInitiator ? data.friend : data.user;

      return {
        id: data.id,
        userId: data.user_id,
        friendId: data.friend_id,
        status: data.status,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at),
        friendUser: friendData ? mapUser(friendData) : undefined,
      };
    }

    // Insert new friendship
    const metadata = groupId ? { pending_groups: [groupId] } : {};

    const { data, error } = await (supabase as any)
      .from("friendships")
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: "pending",
        metadata,
      })
      .select(
        `
        *,
        user:users!user_id(*),
        friend:users!friend_id(*)
      `
      )
      .single();

    if (error) throw error;

    const isUserInitiator = data.user_id === userId;
    const friendData = isUserInitiator ? data.friend : data.user;

    return {
      id: data.id,
      userId: data.user_id,
      friendId: data.friend_id,
      status: data.status,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
      friendUser: friendData ? mapUser(friendData) : undefined,
    };
  },

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    const { data, error } = await (supabase as any)
      .from("friendships")
      .select(
        `
        *,
        user:users!user_id(*),
        friend:users!friend_id(*)
      `
      )
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (error) throw error;

    return (data || []).map((row: any) => {
      // The user who initiated the request is user_id
      const friendData = row.user;

      return {
        id: row.id,
        userId: row.user_id,
        friendId: row.friend_id,
        status: row.status,
        createdAt: new Date(row.created_at),
        updatedAt: new Date(row.updated_at),
        friendUser: friendData ? mapUser(friendData) : undefined,
      };
    });
  },

  async acceptFriendship(friendshipId: string): Promise<void> {
    const { error } = await (supabase as any)
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (error) throw error;
  },

  async rejectFriendship(friendshipId: string): Promise<void> {
    const { error } = await (supabase as any).from("friendships").delete().eq("id", friendshipId);

    if (error) throw error;
  },

  async removeFriendship(friendshipId: string): Promise<void> {
    const { error } = await (supabase as any).from("friendships").delete().eq("id", friendshipId);

    if (error) throw error;
  },
};
