import { useCallback } from "react"
import { View } from "react-native"
import { FlashList } from "@shopify/flash-list"
import { Typography } from "heroui-native"
import * as icons from "lucide-react-native"
import { useRouter } from "expo-router"

import { useGroupExpenses } from "@/features/expenses/queries/useExpenses"
import { TransactionRow } from "@/features/expenses/components/TransactionRow"
import { UI } from "@/components/ui/native-ui"
import { useAuth } from "@/context/AppContext"
import { ListRowSkeleton } from "@/components/ui/Skeleton"

interface GroupExpensesTabProps {
  groupId: string
  groupCurrency?: string
  userById: Map<string, any>
}

export function GroupExpensesTab({ groupId, groupCurrency, userById }: GroupExpensesTabProps) {
  const router = useRouter()
  const { currentUser } = useAuth()
  const { data: expenses = [], isLoading } = useGroupExpenses(groupId)

  if (isLoading) {
    return (
      <View style={{ padding: UI.space.page, gap: 12 }}>
        <ListRowSkeleton />
        <ListRowSkeleton />
        <ListRowSkeleton />
      </View>
    )
  }

  if (expenses.length === 0) {
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
          <icons.Receipt size={24} color={UI.color.text} strokeWidth={1.8} />
        </View>
        <Typography
          style={{
            fontSize: 16,
            color: UI.color.text,
            fontFamily: "IBMPlexSans_600SemiBold",
            marginBottom: 4,
          }}
        >
          No expenses yet
        </Typography>
        <Typography
          style={{
            fontSize: 14,
            color: UI.color.muted,
            fontFamily: "IBMPlexSans_500Medium",
            textAlign: "center",
          }}
        >
          Add the first expense for this group
        </Typography>
      </View>
    )
  }

  const renderItem = useCallback(
    ({ item: expense, index }: { item: any; index: number }) => {
      const mySplit = expense.splits.find((s: any) => s.userId === currentUser.id)
      const paidByUser = userById.get(expense.paidBy)
      return (
        <TransactionRow
          expense={expense}
          currentUserId={currentUser.id}
          paidByUser={paidByUser}
          myShare={mySplit?.amount ?? 0}
          isLast={index === expenses.length - 1}
          onPress={() => router.push(`/expense/${expense.id}`)}
          showAvatarBadge
        />
      )
    },
    [currentUser.id, userById, expenses.length, router]
  )

  return (
    <View style={{ paddingHorizontal: UI.space.page, paddingTop: 16, flex: 1 }}>
      <View
        style={{
          borderRadius: UI.radius.lg,
          borderWidth: 1,
          borderColor: UI.color.border,
          backgroundColor: UI.color.surface,
          overflow: "hidden",
          flex: 1,
        }}
      >
        <FlashList
          data={expenses}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
        />
      </View>
    </View>
  )
}
