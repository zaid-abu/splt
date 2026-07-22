import type { JSX } from "react"
import { useMemo, useCallback, useState } from "react"
import { View, Text, ActivityIndicator, Pressable } from "react-native"
import { useLocalSearchParams, useRouter } from "expo-router"
import type { GroupRouteParams } from "@/types/navigation"
import { Settings, Plus, ArrowLeftRight, Calendar } from "lucide-react-native"
import * as Haptics from "expo-haptics"

import { useAuth } from "@/context/AppContext"
import { useGroupSnapshot } from "@/features/groups/hooks/useGroupSnapshot"
import { parseGroupView } from "@/features/navigation/phase2Routes"
import { formatAmount } from "@/components/ui/AmountDisplay"
import { minorToMajor } from "@/features/money/splits"
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
  CoralSearchField,
  BalanceHero,
} from "@/components/coral"
import { useUI } from "@/components/ui"
import { useCoralColors } from "@/components/coral/useCoral"
import type { User, Expense } from "@/types"
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

function SectionHeading({ title, meta }: { title: string; meta?: string }) {
  const coral = useCoralColors()
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "baseline",
        marginTop: 28,
        marginBottom: 10,
        paddingHorizontal: 2,
      }}
    >
      <Text
        style={{
          fontFamily: "InstrumentSans_600SemiBold",
          fontSize: 15,
          color: coral.foreground,
        }}
      >
        {title}
      </Text>
      {meta ? (
        <Text
          style={{
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 12,
            color: coral.muted,
          }}
        >
          {meta}
        </Text>
      ) : null}
    </View>
  )
}

function formatSignedAmount(amount: number, currencyCode: string): string {
  if (amount > 0) return `+${formatAmount(amount, currencyCode)}`
  return formatAmount(amount, currencyCode)
}

function getExpenseBalanceImpact(expense: Expense, currentUserId?: string): number {
  const ownShare = expense.splits.find((split) => split.userId === currentUserId)?.amount ?? 0

  return expense.paidBy === currentUserId ? expense.amount - ownShare : -ownShare
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" })
}

function groupExpensesByMonth(expenses: Expense[]): Map<string, Expense[]> {
  const groups = new Map<string, Expense[]>()
  for (const exp of expenses) {
    const d = new Date(exp.date)
    const key = `${d.toLocaleDateString(undefined, { year: "numeric", month: "long" })}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(exp)
  }
  return groups
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
  const coral = useCoralColors()
  const { currentUser } = useAuth()
  const view = parseGroupView(viewParam)
  const currentUserId = currentUser?.id

  const snapshot = useGroupSnapshot(id || "", view)

  const [searchQuery, setSearchQuery] = useState("")

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

  const handleSettlePress = useCallback(() => {
    router.push(`/settle/new?groupId=${id}`)
  }, [router, id])

  const handleSchedulePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    router.push(`/expense/new?groupId=${id}&recurring=true`)
  }, [router, id])

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

  if (snapshot.isInitialLoading || !snapshot.data) {
    return (
      <CoralScreen scroll={false}>
        <LoadingState />
      </CoralScreen>
    )
  }

  const data = snapshot.data
  const { group, balances, members, expenses, scheduleSections } = data
  const currencyCode = group.currency
  const memberUsers: User[] = members.map((m) => m.user)

  const openBalances = balances.filter((balance) => Math.abs(balance.signedAmountMinor) > 0)

  const uniqueCurrencies = new Set<string>()
  for (const b of openBalances) {
    uniqueCurrencies.add(b.currency)
  }
  const isMultiCurrency = uniqueCurrencies.size > 1

  const netBalanceMinor = openBalances.reduce((sum, b) => sum + b.signedAmountMinor, 0)
  const netBalance = minorToMajor(netBalanceMinor, currencyCode)
  const openBalanceCount = openBalances.length

  const balanceTone: "positive" | "negative" | "neutral" =
    netBalance > 0 ? "positive" : netBalance < 0 ? "negative" : "neutral"

  const metaText = `${members.length} people`

  const scheduleData: ScheduleSections = scheduleSections

  const nonZeroMembers = members
    .filter((m) => {
      const bal = openBalances.find((b) => b.counterpartyId === m.userId)
      return bal && Math.abs(minorToMajor(bal.signedAmountMinor, bal.currency)) > 0.005
    })
    .sort((a, b) => {
      const balA = openBalances.find((ba) => ba.counterpartyId === a.userId)
      const balB = openBalances.find((bb) => bb.counterpartyId === b.userId)
      return (balB?.signedAmountMinor ?? 0) - (balA?.signedAmountMinor ?? 0)
    })

  const heroNote = netBalance > 0
    ? `You are owed across ${openBalanceCount} balance${openBalanceCount !== 1 ? "s" : ""}`
    : netBalance < 0
      ? `You owe across ${openBalanceCount} balance${openBalanceCount !== 1 ? "s" : ""}`
      : "All settled"

  const filteredExpenses = expenses.filter(
    (e) => {
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return (
        e.title.toLowerCase().includes(q) ||
        e.paidByUser?.name?.toLowerCase().includes(q)
      )
    }
  )

  const groupedExpenses = groupExpensesByMonth(filteredExpenses)

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

      {!isMultiCurrency && view === "overview" && (
        <BalanceHero
          label={`Your position in ${group.name}`}
          value={formatSignedAmount(netBalance, currencyCode)}
          note={heroNote}
        />
      )}

      <View style={{ flexDirection: "row", gap: 8, marginVertical: 14 }}>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Settle"
            icon={<ArrowLeftRight size={18} color={coral.inkOnAccent} strokeWidth={2} />}
            onPress={handleSettlePress}
            variant="primary"
          />
        </View>
        <View style={{ flex: 1 }}>
          <CoralButton
            label="Add"
            icon={<Plus size={18} color={coral.foreground} strokeWidth={2} />}
            onPress={handleAddExpense}
            variant="secondary"
          />
        </View>
      </View>

      <View style={{ marginTop: 8, marginBottom: 12 }}>
        <CoralSegment
          options={VIEW_OPTIONS}
          selected={view}
          onSelect={selectView}
        />
      </View>

      {view === "overview" && (
        <>

          <SectionHeading title="People" meta="Pairwise balances" />
          {nonZeroMembers.length > 0 ? (
            nonZeroMembers.map((member) => {
              const balance = openBalances.find((b) => b.counterpartyId === member.userId)
              const majorAmount = minorToMajor(balance?.signedAmountMinor ?? 0, balance?.currency ?? currencyCode)
              const owesMe = majorAmount > 0
              const subtitle = owesMe
                ? `${member.user.name} owes ${formatAmount(majorAmount, balance?.currency ?? currencyCode)}`
                : `You owe ${member.user.name} ${formatAmount(Math.abs(majorAmount), balance?.currency ?? currencyCode)}`
              return (
                <MoneyRow
                  key={member.userId}
                  avatar={<AppUserAvatar user={member.user} size="sm" balance={majorAmount} />}
                  title={member.user.name}
                  subtitle={subtitle}
                  amount={formatSignedAmount(majorAmount, balance?.currency ?? currencyCode)}
                  amountTone={majorAmount > 0 ? "positive" : majorAmount < 0 ? "negative" : "neutral"}
                  onPress={() => handleMemberPress(member.userId)}
                />
              )
            })
          ) : (
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 14,
                color: color.muted,
                paddingVertical: 12,
              }}
            >
              No open balances
            </Text>
          )}

          {expenses.length > 0 && (
            <>
              <SectionHeading title="Latest" />
              {expenses.slice(0, 5).map((expense) => {
                  const isPayer = expense.paidBy === currentUserId
                  const balanceImpact = getExpenseBalanceImpact(expense, currentUserId)
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
                      formatSignedAmount(balanceImpact, expense.currency)
                    }
                    amountTone={
                      balanceImpact > 0 ? "positive" : balanceImpact < 0 ? "negative" : "neutral"
                    }
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
          <CoralSearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            onClear={() => setSearchQuery("")}
            placeholder={`Search ${group.name} expenses`}
          />

          {filteredExpenses.length === 0 ? (
            <View style={{ paddingVertical: 40, alignItems: "center" }}>
              <Text
                style={{
                  fontFamily: "InstrumentSans_400Regular",
                  fontSize: 15,
                  color: color.muted,
                }}
              >
                {searchQuery.trim() ? "No matching expenses" : "No expenses yet"}
              </Text>
            </View>
          ) : (
            Array.from(groupedExpenses.entries()).map(([monthLabel, monthExpenses]) => (
              <View key={monthLabel}>
                <SectionHeading title={monthLabel} />
                {monthExpenses.map((expense) => {
                  const isPayer = expense.paidBy === currentUserId
                  const balanceImpact = getExpenseBalanceImpact(expense, currentUserId)
                  const dateLabel = formatDate(expense.date.toString())
                  const payerName = expense.paidByUser?.name ?? "Someone"
                  return (
                    <MoneyRow
                      key={expense.id}
                      avatar={<AppUserAvatar user={expense.paidByUser} size="sm" />}
                      title={expense.title}
                      subtitle={
                        isPayer
                          ? `${dateLabel} - You paid`
                          : `${dateLabel} - ${payerName} paid`
                      }
                      amount={formatSignedAmount(balanceImpact, expense.currency)}
                      amountTone={
                        balanceImpact > 0
                          ? "positive"
                          : balanceImpact < 0
                            ? "negative"
                            : "neutral"
                      }
                      onPress={() => handleExpensePress(expense.id)}
                    />
                  )
                })}
              </View>
            ))
          )}

          <View style={{ marginTop: 20 }}>
            <CoralButton label="Add expense" variant="primary" onPress={handleAddExpense} />
          </View>
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
                      title={item.title ?? "Recurring expense"}
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
                      title={item.title ?? "Recurring expense"}
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
                      title={item.title ?? "Recurring expense"}
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
    </CoralScreen>
  )
}
