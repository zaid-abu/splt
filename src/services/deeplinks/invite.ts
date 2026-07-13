import { Share } from "react-native"

export function createInviteLink(groupId?: string): string {
  const base = "https://splt.app/join"
  if (groupId) return `${base}?group=${groupId}`
  return base
}

export async function shareInviteLink(groupId?: string): Promise<void> {
  const url = createInviteLink(groupId)
  await Share.share({
    message: `Join me on Splt! ${url}`,
    url,
  })
}
