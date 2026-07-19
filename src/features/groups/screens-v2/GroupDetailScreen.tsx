import type { JSX } from "react"
import { View, Text, ActivityIndicator, Pressable } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { GroupRouteParams } from "@/types/navigation"
import { Settings } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { useAuth } from "@/context/AppContext"
import { useGroupSnapshot } from "@/features/groups/hooks/useGroupSnapshot"
import { parseGroupView } from "@/features/navigation/phase2Routes"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { AppUserAvatar, AvatarStack } from "@/components/ui/MemberAvatar"
import { GroupIconBadge } from "@/components/ui/GroupIconBadge"
import {
  CoralScreen,
  CoralTopBar,
  LargeTitle,
  Eyebrow,
  MoneyRow,
  StatPair,
  CoralSegment,
  CoralButton,
} from "@/components/coral"
import { useUI } from "@/components/ui"
import type { User } from "@/types"
import type { ScheduleReadItem, ScheduleSections } from "@/features/recurring/services/readAdapter"

function LoadingState() {
  const { color } = useUI()
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={color.muted} />
    </View>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { color } = useUI()
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: color.text,
        }}
      >
        Something went wrong
      </Text>
      <Text
        onPress={onRetry}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Tap to retry
      </Text>
    </View>
  )
}

function NotFoundState({ onGoBack }: { onGoBack: () => void }) {
  const { color } = useUI()
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", gap: 16 }}>
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 18,
          color: color.text,
        }}
      >
        Group not found
      </Text>
      <Text
        onPress={onGoBack}
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: color.brand,
        }}
      >
        Go back
      </Text>
    </View>
  )
}

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`
  return formatAmount(amount, currencyCode)
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

const VIEW_OPTIONS = [
  { label: "Overview", value: "overview" },
  { label: "Expenses", value: "expenses" },
  { label: "Schedule", value: "schedule" },
]

export default function GroupDetailScreen(): JSX.Element {
  const { id, view: viewParam } = useLocalSearchParams<GroupRouteParams>()
  const router = useRouter()
  const { color } = useUI()
  const { currentUser } = useAuth()
  const view = parseGroupView(viewParam)
  const currentUserId = currentUser?.id

  const snapshot = useGroupSnapshot(id || "", view)

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    if (router.canGoBack()) {
      router.back()
    } else {
      router.replace("/home")
    }
  }

  const handleSettingsPress = () => {
    Haptics.selectionAsync()
    router.push(`/group/${id}/settings`)
  }

  const handleAddExpense = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/expense/new?groupId=${id}`)
  }

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense/${expenseId}`)
  }

  const handleMemberPress = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/friend/${userId}`)
  }

  const selectView = (next: string) => {
    router.setParams({ view: next })
  }

  if (snapshot.isInitialLoading) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    )
  }

  if (snapshot.isNotFound) {
    return (
      <CoralScreen scroll={false}>
        <NotFoundState onGoBack={handleBack} />
      </CoralScreen>
    )
  }

  if (snapshot.isError && !snapshot.data) {
    return (
      <CoralScreen scroll={false}>
        <ErrorState onRetry={() => snapshot.refresh()} />
      </CoralScreen>
    )
  }

  const data = snapshot.data!
  const { group, balances, members, expenses, scheduleSections } = data
  const currencyCode = group.currency
  const memberUsers: User[] = members.map((m) => m.user)

  const uniqueCurrencies = new Set<string>()
  for (const b of balances) {
    uniqueCurrencies.add(b.currency)
  }
  const isMultiCurrency = uniqueCurrencies.size > 1

  const netBalanceMinor = balances.reduce((sum, b) => sum + b.signedAmountMinor, 0)
  const netBalance = netBalanceMinor / 100
  const openBalanceCount = balances.length

  const balanceTone: "positive" | "negative" | "neutral" =
    netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral"

  const metaText = `${members.length} people`

  const scheduleData: ScheduleSections = scheduleSections

  return (
    <CoralScreen>
      <CoralTopBar
        title={group.name}
        onBack={handleBack}
        rightElement={
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              handleSettingsPress()
            }}
            hitSlop={8}
          >
            <Settings size={22} color={color.text} strokeWidth={1.7} />
          </Pressable>
        }
      />

      <View style={{ marginTop: 18, marginBottom: 8 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <View style={{ marginBottom: 12 }}>
              <GroupIconBadge group={group} size="lg" />
            </View>
            <LargeTitle style={{ marginTop: 0, marginBottom: 4 }}>{group.name}</LargeTitle>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 14,
                color: color.muted,
              }}
            >
              {metaText}
            </Text>
          </View>

          {memberUsers.length > 0 && <AvatarStack users={memberUsers} max={4} />}
        </View>
      </View>

      {!isMultiCurrency && (
        <StatPair
          left={{
            label: balanceTone === "positive" ? "You're owed" : "You owe",
            value: formatSignedAmount(netBalance, currencyCode),
            tone: balanceTone,
          }}
          right={{
            label: "Open balances",
            value: String(openBalanceCount),
            tone: "neutral",
          }}
        />
      )}

      {snapshot.isStaleOffline && (
        <View
          style={{
            backgroundColor: color.border,
            borderRadius: 10,
            padding: 10,
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: color.muted,
              textAlign: "center",
            }}
          >
            Offline — showing cached data
          </Text>
        </View>
      )}

      {snapshot.isRestricted && (
        <View
          style={{
            backgroundColor: color.border,
            borderRadius: 10,
            padding: 10,
            marginTop: 8,
            marginBottom: 4,
          }}
        >
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 12,
              color: color.muted,
              textAlign: "center",
            }}
          >
            View-only &mdash; you cannot edit this group
          </Text>
        </View>
      )}

      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <CoralSegment
          options={VIEW_OPTIONS}
          selected={view}
          onSelect={selectView}
        />
      </View>

      {view === "overview" && (
        <>
          <Eyebrow>Balances</Eyebrow>
          {members
            .filter((m) => {
              const bal = balances.find((b) => b.counterpartyId === m.userId)
              return bal && Math.abs(bal.signedAmountMinor / 100) > 0.005
            })
            .sort((a, b) => {
              const balA = balances.find((ba) => ba.counterpartyId === a.userId)
              const balB = balances.find((bb) => bb.counterpartyId === b.userId)
              return (balB?.signedAmountMinor ?? 0) - (balA?.signedAmountMinor ?? 0)
            })
            .map((member) => {
              const balance = balances.find((b) => b.counterpartyId === member.userId)
              const majorAmount = (balance?.signedAmountMinor ?? 0) / 100
              return (
                <MoneyRow
                  key={member.userId}
                  avatar={<AppUserAvatar user={member.user} size="sm" balance={majorAmount} />}
                  title={member.user.name}
                  subtitle={
                    majorAmount > 0
                      ? `Owes ${formatAmount(majorAmount, balance?.currency ?? currencyCode)}`
                      : `You owe ${formatAmount(Math.abs(majorAmount), balance?.currency ?? currencyCode)}`
                  }
                  amount={formatSignedAmount(majorAmount, balance?.currency ?? currencyCode)}
                  amountTone={majorAmount > 0 ? "positive" : majorAmount < 0 ? "negative" : "neutral"}
                  onPress={() => handleMemberPress(member.userId)}
                />
              )
            })}

          {expenses.length > 0 && (
            <>
              <Eyebrow>Latest</Eyebrow>
              {expenses.slice(0, 5).map((expense) => {
                const isPayer = expense.paidBy === currentUserId
                const share = expense.splits?.find((s) => s.userId === currentUserId)
                return (
                  <MoneyRow
                    key={expense.id}
                    avatar={<AppUserAvatar user={expense.paidByUser} size="sm" />}
                    title={expense.title}
                    subtitle={
                      isPayer
                        ? `You paid \u00B7 split with ${expense.splits?.length ?? 0} people`
                        : `${expense.paidByUser?.name ?? "Someone"} paid`
                    }
                    amount={
                      isPayer
                        ? formatSignedAmount(
                            expense.amount - (share?.amount ?? 0),
                            expense.currency
                          )
                        : formatAmount(share?.amount ?? 0, expense.currency)
                    }
                    amountTone={isPayer ? "positive" : "negative"}
                    onPress={() => handleExpensePress(expense.id)}
                  />
                )
              })}
            </>
          )}
        </>
      )}

      {view === "expenses" && (
        <>
          {expenses.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: color.muted,
                }}
              >
                No expenses yet
              </Text>
            </View>
          ) : (
            expenses.map((expense) => {
              const isPayer = expense.paidBy === group.createdBy
              const share = expense.splits?.find((s) => s.userId === group.createdBy)
              return (
                <MoneyRow
                  key={expense.id}
                  avatar={<AppUserAvatar user={expense.paidByUser} size="sm" />}
                  title={expense.title}
                  subtitle={
                    isPayer
                      ? `You paid \u00B7 your share ${formatAmount(share?.amount ?? 0, expense.currency)}`
                      : `${expense.paidByUser?.name ?? "Someone"} paid \u00B7 your share ${formatAmount(share?.amount ?? 0, expense.currency)}`
                  }
                  amount={
                    isPayer
                      ? formatSignedAmount(
                          expense.amount - (share?.amount ?? 0),
                          expense.currency
                        )
                      : formatAmount(share?.amount ?? 0, expense.currency)
                  }
                  amountTone={isPayer ? "positive" : "negative"}
                  onPress={() => handleExpensePress(expense.id)}
                />
              )
            })
          )}
        </>
      )}

      {view === "schedule" && (
        <>
          {(!scheduleData.needsReview || scheduleData.needsReview.length === 0) &&
          (!scheduleData.active || scheduleData.active.length === 0) &&
          (!scheduleData.paused || scheduleData.paused.length === 0) ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: color.muted,
                }}
              >
                No recurring expenses
              </Text>
            </View>
          ) : (
            <>
              {scheduleData.needsReview.length > 0 && (
                <>
                  <Eyebrow>Needs Review</Eyebrow>
                  {scheduleData.needsReview.map((item: ScheduleReadItem) => (
                    <MoneyRow
                      key={item.id}
                      title={`Recurring expense`}
                      subtitle={`Needs review \u00B7 ${formatDate(item.scheduledDate)}`}
                      amount={formatDate(item.scheduledDate)}
                      onPress={() => router.push(item.href)}
                    />
                  ))}
                </>
              )}
              {scheduleData.active.length > 0 && (
                <>
                  <Eyebrow>Active</Eyebrow>
                  {scheduleData.active.map((item: ScheduleReadItem) => (
                    <MoneyRow
                      key={item.id}
                      title={`Recurring expense`}
                      subtitle={`Active \u00B7 Next ${formatDate(item.scheduledDate)}`}
                      amount={formatDate(item.scheduledDate)}
                      onPress={() => router.push(item.href)}
                    />
                  ))}
                </>
              )}
              {scheduleData.paused.length > 0 && (
                <>
                  <Eyebrow>Paused</Eyebrow>
                  {scheduleData.paused.map((item: ScheduleReadItem) => (
                    <MoneyRow
                      key={item.id}
                      title={`Recurring expense`}
                      subtitle={`Paused \u00B7 Next ${formatDate(item.scheduledDate)}`}
                      amount={formatDate(item.scheduledDate)}
                      onPress={() => router.push(item.href)}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </>
      )}

      <View style={{ marginTop: 20 }}>
        <CoralButton label="Add an expense" variant="primary" onPress={handleAddExpense} />
      </View>
    </CoralScreen>
  )
}
