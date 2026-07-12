import { View, Pressable } from "react-native"
import { Typography } from "heroui-native"
import * as icons from "lucide-react-native"
import { useRouter } from "expo-router"
import * as Haptics from "expo-haptics"

import { AppUserAvatar } from "@/components/ui/MemberAvatar"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { UI } from "@/components/ui/native-ui"
import { useAuth } from "@/context/AppContext"
import type { GroupMember } from "@/types"

interface GroupBalancesTabProps {
  groupId: string
  members: GroupMember[]
  groupCurrency: string
  debts: { fromUserId: string; toUserId: string; amount: number }[]
}

export function GroupBalancesTab({
  groupId,
  members,
  groupCurrency,
  debts,
}: GroupBalancesTabProps) {
  const router = useRouter()
  const { currentUser } = useAuth()

  if (debts.length === 0) {
    return (
      <View
        style={{
          margin: UI.space.page,
          alignItems: "center",
          paddingVertical: 36,
          backgroundColor: UI.color.surface,
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
        }}
      >
        <View
          style={{
            width: 56,
            height: 56,
            borderRadius: UI.radius.lg,
            backgroundColor: UI.color.control,
            borderWidth: 1,
            borderColor: UI.color.border,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          <icons.Check size={24} color={UI.color.success} strokeWidth={1.8} />
        </View>
        <Typography
          style={{
            fontSize: 16,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            marginBottom: 4,
          }}
        >
          All settled up!
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            textAlign: "center",
          }}
        >
          No pending balances
        </Typography>
      </View>
    )
  }

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
        {debts.map((debt, idx) => {
          const fromUser = members.find((m) => m.userId === debt.fromUserId)?.user
          const toUser = members.find((m) => m.userId === debt.toUserId)?.user
          if (!fromUser || !toUser) return null

          const isMeOwe = fromUser.id === currentUser.id
          const isOweMe = toUser.id === currentUser.id
          const amountColor = isMeOwe
            ? UI.color.danger
            : isOweMe
              ? UI.color.success
              : UI.color.text

          return (
            <View
              key={`${debt.fromUserId}-${debt.toUserId}`}
              style={[
                {
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingVertical: 16,
                  paddingHorizontal: 20,
                },
                idx < debts.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: UI.color.border,
                },
              ]}
            >
              <View style={{ flexDirection: "row", alignItems: "center", gap: 14, flex: 1 }}>
                <AppUserAvatar user={fromUser} size="md" />
                <icons.ArrowRight size={16} color={UI.color.muted} strokeWidth={1.75} />
                <AppUserAvatar user={toUser} size="md" />
                <View style={{ marginLeft: 4, flex: 1 }}>
                  <Typography
                    style={{
                      fontSize: 16,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    {isMeOwe ? "You" : fromUser.name}
                  </Typography>
                  <Typography
                    style={{
                      fontSize: 14,
                      color: UI.color.muted,
                      fontFamily: "IBMPlexSans_500Medium",
                      marginTop: 2,
                    }}
                  >
                    owes {isOweMe ? "you" : toUser.name.split(" ")[0]}
                  </Typography>
                </View>
              </View>

              <View style={{ alignItems: "flex-end", gap: 8 }}>
                <Typography
                  style={{
                    fontSize: 20,
                    color: amountColor,
                    fontFamily: "IBMPlexSans_600SemiBold",
                  }}
                >
                  {formatAmount(debt.amount, groupCurrency)}
                </Typography>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Settle up"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                    router.push(`/group/${groupId}/settle`)
                  }}
                  style={({ pressed }) => ({
                    paddingHorizontal: 14,
                    paddingVertical: 6,
                    borderRadius: UI.radius.pill,
                    backgroundColor: UI.color.control,
                    borderWidth: 1,
                    borderColor: UI.color.border,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Typography
                    style={{
                      fontSize: 12,
                      color: UI.color.text,
                      fontFamily: "IBMPlexSans_600SemiBold",
                    }}
                  >
                    Settle
                  </Typography>
                </Pressable>
              </View>
            </View>
          )
        })}
      </View>
    </View>
  )
}
