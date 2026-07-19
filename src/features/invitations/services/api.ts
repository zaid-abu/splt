import { supabase } from "@/services/supabase/client"

export interface PrivateInviteLink {
  inviteId: string
  rawToken: string
  expiresAt: Date
}

export interface InviteResolution {
  state: "valid" | "expired" | "revoked" | "redeemed" | "self" | "blocked"
  inviterId?: string
  expiresAt?: Date
}

export const invitationsApi = {
  async createFriendInvite(operationId: string): Promise<PrivateInviteLink> {
    const { data, error } = await supabase.rpc("create_friend_invite", {
      p_client_operation_id: operationId,
    })

    if (error) throw error

    const result = data as unknown as {
      invite_id: string
      raw_token: string
      expires_at: string
    }

    return {
      inviteId: result.invite_id,
      rawToken: result.raw_token,
      expiresAt: new Date(result.expires_at),
    }
  },

  async revokeFriendInvite(inviteId: string): Promise<void> {
    const { error } = await supabase.rpc("revoke_friend_invite", {
      p_invite_id: inviteId,
    })

    if (error) throw error
  },

  async resolveFriendInvite(token: string): Promise<InviteResolution> {
    const { data, error } = await supabase.rpc("resolve_friend_invite", {
      p_token: token,
    })

    if (error) throw error

    const result = data as unknown as {
      state: string
      inviter_id?: string
      expires_at?: string
    }

    return {
      state: result.state as InviteResolution["state"],
      inviterId: result.inviter_id,
      expiresAt: result.expires_at ? new Date(result.expires_at) : undefined,
    }
  },

  async redeemFriendInvite(token: string): Promise<string> {
    const { data, error } = await supabase.rpc("redeem_friend_invite", {
      p_token: token,
    })

    if (error) throw error
    return data as string
  },
}
