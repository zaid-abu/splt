import { supabase } from "@/services/supabase/client";
import type { Tables } from "@/services/supabase/database.types";
import type { Friendship } from "@/types";
import { mapUser } from "@/services/api/mappers";

type DbUserRow = Tables<"users">;

type FriendshipJoinRow = Tables<"friendships"> & {
  user: DbUserRow;
  friend: DbUserRow;
};

function mapFriendshipWithUser(row: FriendshipJoinRow, userId: string): Friendship {
  const isUserInitiator = row.user_id === userId;
  const friendData = isUserInitiator ? row.friend : row.user;

  const status = row.status as Friendship["status"];

  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    friendUser: friendData ? mapUser(friendData) : undefined,
  };
}

function mapPendingFriendshipRow(row: FriendshipJoinRow): Friendship {
  const status = row.status as Friendship["status"];

  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    friendUser: row.user ? mapUser(row.user) : undefined,
  };
}

const FRIENDSHIP_SELECT = `
  *,
  user:users!friendships_user_id_fkey(*),
  friend:users!friendships_friend_id_fkey(*)
`;

export const FriendsService = {
  async getFriends(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    if (error) throw error;

    return (data || []).map((row) =>
      mapFriendshipWithUser(row as unknown as FriendshipJoinRow, userId)
    );
  },

  async getAllFriendships(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`);

    if (error) throw error;

    return (data || []).map((row) =>
      mapFriendshipWithUser(row as unknown as FriendshipJoinRow, userId)
    );
  },

  async addFriend(userId: string, friendId: string, groupId?: string): Promise<Friendship> {
    const { data: existing } = await supabase
      .from("friendships")
      .select("*")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .or(`user_id.eq.${friendId},friend_id.eq.${friendId}`)
      .maybeSingle();

    if (existing) {
      if (existing.status === "accepted") {
        throw new Error("You are already friends.");
      }

      let metadata = (existing.metadata as Record<string, unknown>) || {};
      if (groupId) {
        const groups = new Set(
          ((metadata as Record<string, string[]>)?.pending_groups || []) as string[]
        );
        groups.add(groupId);
        metadata = { ...metadata, pending_groups: Array.from(groups) };
      }

      const { data, error } = await supabase
        .from("friendships")
        .update({ metadata: metadata as never })
        .eq("id", existing.id)
        .select(FRIENDSHIP_SELECT)
        .single();

      if (error) throw error;

      return mapFriendshipWithUser(data as unknown as FriendshipJoinRow, userId);
    }

    const metadata = groupId ? { pending_groups: [groupId] } : {};

    const { data, error } = await supabase
      .from("friendships")
      .insert({
        user_id: userId,
        friend_id: friendId,
        status: "pending",
        metadata: metadata as never,
      })
      .select(FRIENDSHIP_SELECT)
      .single();

    if (error) throw error;

    return mapFriendshipWithUser(data as unknown as FriendshipJoinRow, userId);
  },

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .eq("friend_id", userId)
      .eq("status", "pending");

    if (error) throw error;

    return (data || []).map((row) => mapPendingFriendshipRow(row as unknown as FriendshipJoinRow));
  },

  async acceptFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase
      .from("friendships")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", friendshipId);

    if (error) throw error;
  },

  async rejectFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);

    if (error) throw error;
  },

  async removeFriendship(friendshipId: string): Promise<void> {
    const { error } = await supabase.from("friendships").delete().eq("id", friendshipId);

    if (error) throw error;
  },
};
