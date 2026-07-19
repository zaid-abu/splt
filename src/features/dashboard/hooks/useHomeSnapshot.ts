import { useCallback, useMemo } from "react"
import { useAuth } from "@/context/AppContext"
import { useGroups } from "@/features/groups/queries/useGroups"
import { useFriends } from "@/features/friends/queries/useFriends"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import { useUserActivities } from "@/features/activity/queries/useActivities"
import { useRecurringExpenses } from "@/features/recurring/queries/useRecurringExpenses"
import {
  aggregateOpenBalances,
  orderBalances,
  classifyPersonBalances,
} from "@/features/money/balances"
import { nextHomeScheduleItem } from "@/features/recurring/services/readAdapter"
import { useUIStore } from "@/store/useUIStore"
import type { User, Group, Expense, AppNotification, Activity } from "@/types"
import type { OpenBalance } from "@/features/money/types"
import type { ScheduleReadItem } from "@/features/recurring/services/readAdapter"

export interface SnapshotState<T> {
  data: T | undefined
  isInitialLoading: boolean
  isRefreshing: boolean
  isStaleOffline: boolean
  isError: boolean
  error: Error | null
  isNotFound: boolean
  isRestricted: boolean
  refresh(): Promise<void>
}

export interface HeroBalance {
  counterpartyId: string
  user: User
  signedAmountMinor: number
  currency: string
}

export interface AttentionRow {
  type: "owe" | "owed" | "upcoming"
  counterpartyId: string
  user: User
  signedAmountMinor: number
  currency: string
  context?: string
}

export interface GroupLedgerRow {
  group: Group
  netSignedMinor: number
}

export interface MovementRow {
  id: string
  type: "expense" | "settlement"
  description: string
  amount: number
  currency: string
  date: Date
  counterpartyName: string
}

export interface HomeSnapshotData {
  heroBalances: HeroBalance[]
  attentionRows: AttentionRow[]
  groupLedger: GroupLedgerRow[]
  nextSchedule?: ScheduleReadItem
  recentMovement: MovementRow[]
  notifications: AppNotification[]
  isFirstUse: boolean
}

export function useHomeSnapshot(userId: string): SnapshotState<HomeSnapshotData> {
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)
  const convertCurrency = useUIStore((s) => s.convertCurrency)

  const groupsQuery = useGroups(userId)
  const friendsQuery = useFriends(userId)
  const expensesQuery = useUserExpenses(userId)
  const settlementsQuery = useUserSettlements(userId)
  const openBalancesQuery = useOpenBalances(userId)
  const notificationsQuery = useNotifications(userId)
  const activitiesQuery = useUserActivities(userId)
  const recurringQuery = useRecurringExpenses(userId)

  const queries = [
    groupsQuery,
    friendsQuery,
    expensesQuery,
    settlementsQuery,
    openBalancesQuery,
    notificationsQuery,
    activitiesQuery,
    recurringQuery,
  ] as const

  const isLoadingAny = queries.some((q) => q.isLoading)
  const isErrorAny = queries.some((q) => q.isError)
  const firstError = queries.find((q) => q.error)?.error ?? null
  const allHaveData = queries.every((q) => !!q.data || q.isFetched)
  const anyData = queries.some((q) => !!q.data)

  const isInitialLoading = isLoadingAny && !anyData
  const isRefreshing = isLoadingAny && anyData
  const isStaleOffline = isErrorAny && anyData && allHaveData

  const data = useMemo<HomeSnapshotData | undefined>(() => {
    if (!allHaveData) return undefined

    const groups = groupsQuery.data ?? []
    const friends = friendsQuery.data ?? []
    const expenses = expensesQuery.data ?? []
    const settlements = settlementsQuery.data ?? []
    const openBalancesData = openBalancesQuery.data ?? []
    const notifications = notificationsQuery.data ?? []
    const activities = activitiesQuery.data ?? []
    const recurringExpenses = recurringQuery.data ?? []

    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone

    const nextSchedule = nextHomeScheduleItem(
      { recurringExpenses, occurrences: [] },
      timeZone
    )

    const friendById = new Map<string, User>()
    for (const f of friends) {
      friendById.set(f.id, f)
    }

    const orderedOpenBalances = orderBalances(openBalancesData, preferredCurrency.code)

    const heroBalances: HeroBalance[] = orderedOpenBalances
      .filter((ob) => ob.counterpartyId !== userId && ob.signedAmountMinor !== 0)
      .reduce<HeroBalance[]>((acc, ob) => {
        if (acc.length >= 2) return acc
        const user = friendById.get(ob.counterpartyId)
        if (!user) return acc
        acc.push({
          counterpartyId: ob.counterpartyId,
          user,
          signedAmountMinor: ob.signedAmountMinor,
          currency: ob.currency,
        })
        return acc
      }, [])

    const balancesByUser = new Map<string, OpenBalance[]>()
    for (const ob of orderedOpenBalances) {
      if (ob.counterpartyId === userId) continue
      const arr = balancesByUser.get(ob.counterpartyId) ?? []
      arr.push(ob)
      balancesByUser.set(ob.counterpartyId, arr)
    }

    const attentionRows: AttentionRow[] = []
    for (const [cid, userBalances] of balancesByUser) {
      if (attentionRows.length >= 4) break
      const classification = classifyPersonBalances(userBalances)
      const user = friendById.get(cid)
      if (!user) continue

      if (classification === "owes-you") {
        const largest = userBalances.reduce((best, ob) =>
          ob.signedAmountMinor > best.signedAmountMinor ? ob : best
        )
        attentionRows.push({
          type: "owed",
          counterpartyId: cid,
          user,
          signedAmountMinor: largest.signedAmountMinor,
          currency: largest.currency,
          context:
            largest.context.type === "group"
              ? groups.find((g) => g.id === largest.context.groupId)?.name
              : undefined,
        })
      } else if (classification === "you-owe") {
        const largest = userBalances.reduce((best, ob) =>
          Math.abs(ob.signedAmountMinor) > Math.abs(best.signedAmountMinor) ? ob : best
        )
        attentionRows.push({
          type: "owe",
          counterpartyId: cid,
          user,
          signedAmountMinor: largest.signedAmountMinor,
          currency: largest.currency,
          context:
            largest.context.type === "group"
              ? groups.find((g) => g.id === largest.context.groupId)?.name
              : undefined,
        })
      }
    }

    const groupLedger: GroupLedgerRow[] = groups.map((g) => {
      const groupBalances = orderedOpenBalances.filter(
        (ob) => ob.context.type === "group" && ob.context.groupId === g.id
      )
      const netSignedMinor = groupBalances.reduce(
        (sum, ob) => sum + ob.signedAmountMinor,
        0
      )
      return { group: g, netSignedMinor }
    })

    const recentExpenseMovements: MovementRow[] = expenses
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)
      .map((exp) => {
        const counterparty = exp.splits.find((s) => s.userId !== userId)
        return {
          id: `exp-${exp.id}`,
          type: "expense" as const,
          description: exp.title,
          amount: exp.amount,
          currency: exp.currency,
          date: exp.date,
          counterpartyName: counterparty?.user?.name ?? "someone",
        }
      })

    const recentSettlementMovements: MovementRow[] = settlements
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 2)
      .map((set) => {
        const isMeSending = set.fromUserId === userId
        return {
          id: `set-${set.id}`,
          type: "settlement" as const,
          description: isMeSending ? "You paid" : "You received",
          amount: set.amount,
          currency: set.currency,
          date: set.date,
          counterpartyName: isMeSending
            ? set.toUser?.name ?? "someone"
            : set.fromUser?.name ?? "someone",
        }
      })

    const recentMovement = [...recentExpenseMovements, ...recentSettlementMovements]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 4)

    const isFirstUse = groups.length === 0 && expenses.length === 0

    return {
      heroBalances,
      attentionRows,
      groupLedger,
      nextSchedule: nextSchedule ?? undefined,
      recentMovement,
      notifications,
      isFirstUse,
    }
  }, [
    groupsQuery.data,
    friendsQuery.data,
    expensesQuery.data,
    settlementsQuery.data,
    openBalancesQuery.data,
    notificationsQuery.data,
    activitiesQuery.data,
    recurringQuery.data,
    userId,
    preferredCurrency.code,
  ])

  const refreshImpl = useCallback(async () => {
    const refetches = [
      groupsQuery.refetch,
      friendsQuery.refetch,
      expensesQuery.refetch,
      settlementsQuery.refetch,
      openBalancesQuery.refetch,
      notificationsQuery.refetch,
      activitiesQuery.refetch,
      recurringQuery.refetch,
    ].map((fn) => fn())
    await Promise.all(refetches)
  }, [
    groupsQuery.refetch,
    friendsQuery.refetch,
    expensesQuery.refetch,
    settlementsQuery.refetch,
    openBalancesQuery.refetch,
    notificationsQuery.refetch,
    activitiesQuery.refetch,
    recurringQuery.refetch,
  ])

  return {
    data,
    isInitialLoading,
    isRefreshing,
    isStaleOffline,
    isError: isErrorAny,
    error: firstError,
    isNotFound: false,
    isRestricted: false,
    refresh: refreshImpl,
  }
}
