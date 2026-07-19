import { supabase } from "@/services/supabase/client"
import type { Tables } from "@/services/supabase/database.types"
import type { Friendship } from "@/types"
import { mapUser } from "@/services/api/mappers"

export type FriendshipAction = "request" | "accept" | "decline" | "remove" | "block" | "unblock"

export interface UserSearchResult {
  state: "found" | "not_found" | "blocked"
  userId?: string
  name?: string
  initials?: string
  avatar?: string
}

type DbUserRow = Tables<"users">

type FriendshipJoinRow = Tables<"friendships"> & {
  user: DbUserRow
  friend: DbUserRow
}

function mapFriendshipWithUser(row: FriendshipJoinRow, userId: string): Friendship {
  const isUserInitiator = row.user_id === userId
  const friendData = isUserInitiator ? row.friend : row.user

  const status = row.status as Friendship["status"]

  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status,
    requestedBy: row.requested_by,
    blockedBy: row.blocked_by ?? undefined,
    requestExpiresAt: row.request_expires_at ? new Date(row.request_expires_at) : undefined,
    statusBeforeBlock: row.status_before_block ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    friendUser: friendData ? mapUser(friendData) : undefined,
  }
}

function mapPendingFriendshipRow(row: FriendshipJoinRow): Friendship {
  const status = row.status as Friendship["status"]

  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status,
    requestedBy: row.requested_by,
    blockedBy: row.blocked_by ?? undefined,
    requestExpiresAt: row.request_expires_at ? new Date(row.request_expires_at) : undefined,
    statusBeforeBlock: row.status_before_block ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    friendUser: row.user ? mapUser(row.user) : undefined,
  }
}

const FRIENDSHIP_SELECT = `
  *,
  user:users!friendships_user_id_fkey(*),
  friend:users!friendships_friend_id_fkey(*)
`

export const FriendsService = {
  async getFriends(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted")

    if (error) throw error

    return (data || []).map((row) =>
      mapFriendshipWithUser(row as unknown as FriendshipJoinRow, userId)
    )
  },

  async getAllFriendships(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)

    if (error) throw error

    return (data || []).map((row) =>
      mapFriendshipWithUser(row as unknown as FriendshipJoinRow, userId)
    )
  },

  async getPendingFriendRequests(userId: string): Promise<Friendship[]> {
    const { data, error } = await supabase
      .from("friendships")
      .select(FRIENDSHIP_SELECT)
      .eq("friend_id", userId)
      .eq("status", "pending")

    if (error) throw error

    return (data || []).map((row) => mapPendingFriendshipRow(row as unknown as FriendshipJoinRow))
  },

  async searchExactEmail(email: string): Promise<UserSearchResult> {
    const { data, error } = await supabase.rpc("search_user_by_exact_email", {
      p_email: email,
    })

    if (error) throw error

    const result = data as unknown as {
      state: string
      user_id?: string
      name?: string
      initials?: string
      avatar?: string | null
    }

    return {
      state: result.state as UserSearchResult["state"],
      userId: result.user_id,
      name: result.name,
      initials: result.initials,
      avatar: result.avatar ?? undefined,
    }
  },

  async transition(counterpartyId: string, action: FriendshipAction): Promise<string> {
    const { data, error } = await supabase.rpc("transition_friendship", {
      p_counterparty_id: counterpartyId,
      p_action: action,
    })

    if (error) throw error
    return data as string
  },
}
