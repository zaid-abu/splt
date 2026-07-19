import * as SecureStore from "expo-secure-store"

const PENDING_INVITE_KEY = "splt.pendingFriendInvite"

export async function savePendingInviteToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(PENDING_INVITE_KEY, token)
}

export async function consumePendingInviteToken(): Promise<string | null> {
  try {
    const token = await SecureStore.getItemAsync(PENDING_INVITE_KEY)
    if (token) {
      await SecureStore.deleteItemAsync(PENDING_INVITE_KEY)
    }
    return token
  } catch {
    return null
  }
}

export async function clearPendingInviteToken(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(PENDING_INVITE_KEY)
  } catch {
    // ignore
  }
}
