import { View } from "react-native"
import { Typography } from "heroui-native"

import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { UI } from "@/components/ui/native-ui"
import { useAuth } from "@/context/AppContext"
import type { GroupMember } from "@/types"

interface GroupMembersTabProps {
  groupId: string
  members: GroupMember[]
  balances: Map<string, number>
  groupCurrency: string
}

export function GroupMembersTab({
  groupId: _groupId,
  members,
  balances,
  groupCurrency,
}: GroupMembersTabProps) {
  const { currentUser } = useAuth()

  return (
    <View style={{ paddingHorizontal: UI.space.page, paddingTop: 16 }}>
      <View
        style={{
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
          overflow: "hidden",
        }}
      >
        {members.map((member, idx) => {
          const isMe = member.userId === currentUser.id
          const balance = balances.get(member.userId) ?? 0
          const hasBalance = Math.abs(balance) > 0.005
          const isPositive = balance > 0

          return (
            <View
              key={member.userId}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 14,
                  paddingHorizontal: 20,
                },
                idx < members.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: UI.color.border,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
                <AppUserAvatar user={member.user} size="md" balance={balance} />
                <Typography
                  style={{
                    fontSize: 16,
                    color: UI.color.text,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {isMe ? "You" : member.user.name}
                </Typography>
              </View>

              {hasBalance ? (
                <Typography
                  style={{
                    fontSize: 16,
                    color: isPositive ? UI.color.success : UI.color.danger,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {isPositive ? "+" : "-"}
                  {formatAmount(Math.abs(balance), groupCurrency)}
                </Typography>
              ) : (
                <Typography
                  style={{
                    fontSize: 14,
                    color: UI.color.muted,
                    fontFamily: "IBMPlexSans_500Medium",
                  }}
                >
                  Settled
                </Typography>
              )}
            </View>
          )
        })}
      </View>
    </View>
  )
}
