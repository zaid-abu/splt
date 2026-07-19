import { useCallback, useMemo, useRef } from "react"
import { useAuth } from "@/context/AppContext"
import { useGroups } from "@/features/groups/queries/useGroups"
import { useFriends, useAllFriendships } from "@/features/friends/queries/useFriends"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import { aggregateOpenBalances, classifyPersonBalances, orderBalances } from "@/features/money/balances"
import { useUIStore } from "@/store/useUIStore"
import type { User, Group, Friendship, AppNotification } from "@/types"
import type { OpenBalance } from "@/features/money/types"

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

export interface RequestItem {
  friendship: Friendship
  user: User
}

export interface GroupSection {
  group: Group
  balance: OpenBalance | null
}

export interface PersonSection {
  user: User
  friendship: Friendship | null
  classification: "mixed" | "owes-you" | "you-owe" | "settled"
  topBalance: OpenBalance | null
  sharedGroupCount: number
  topBalanceContextLabel: string | null
  lastActivityAt: Date | null
}

export interface CirclesData {
  pendingRequests: RequestItem[]
  groupSections: GroupSection[]
  personSections: PersonSection[]
}

export function useCirclesSnapshot(userId: string, search: string): SnapshotState<CirclesData> {
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)

  const groupsQuery = useGroups(userId)
  const friendsQuery = useFriends(userId)
  const allFriendshipsQuery = useAllFriendships(userId)
  const expensesQuery = useUserExpenses(userId)
  const settlementsQuery = useUserSettlements(userId)
  const notificationsQuery = useNotifications(userId)

  const queries = [
    groupsQuery, friendsQuery, allFriendshipsQuery,
    expensesQuery, settlementsQuery, notificationsQuery,
  ] as const

  const isLoadingAny = queries.some((q) => q.isLoading)
  const isErrorAny = queries.some((q) => q.isError)
  const firstError = queries.find((q) => q.error)?.error ?? null
  const allHaveData = queries.every((q) => !!q.data || q.isFetched)
  const anyData = queries.some((q) => !!q.data)

  const isInitialLoading = isLoadingAny && !anyData
  const isRefreshing = isLoadingAny && anyData
  const isStaleOffline = isErrorAny && anyData && allHaveData

  const data = useMemo<CirclesData | undefined>(() => {
    if (!allHaveData) return undefined

    const groups = groupsQuery.data ?? []
    const friends = friendsQuery.data ?? []
    const allFriendships = allFriendshipsQuery.data ?? []
    const expenses = expensesQuery.data ?? []
    const settlements = settlementsQuery.data ?? []
    const notifications = notificationsQuery.data ?? []

    const lowerSearch = search.trim().toLowerCase()

    const eventRows: {
      counterpartyId: string
      context: { type: "group"; groupId: string } | { type: "direct"; friendshipId: string }
      currency: string
      signedAmountMinor: number
      date: Date
    }[] = []

    for (const exp of expenses) {
      const groupContext = exp.groupId
        ? { type: "group" as const, groupId: exp.groupId }
        : null

      if (groupContext) {
        for (const split of exp.splits) {
          if (split.userId === userId) continue
          if (split.userId === exp.paidBy) continue
          const amtMinor = split.amountMinor ?? Math.round(split.amount * 100)
          eventRows.push({
            counterpartyId: exp.paidBy,
            context: groupContext,
            currency: exp.currency,
            signedAmountMinor: amtMinor,
            date: new Date(exp.date),
          })
          eventRows.push({
            counterpartyId: split.userId,
            context: groupContext,
            currency: exp.currency,
            signedAmountMinor: -amtMinor,
            date: new Date(exp.date),
          })
        }
      }
    }

    for (const set of settlements) {
      const groupContext = set.groupId
        ? { type: "group" as const, groupId: set.groupId }
        : null
      if (!groupContext) continue
      const amtMinor = set.amountMinor ?? Math.round(set.amount * 100)
      eventRows.push({
        counterpartyId: set.fromUserId,
        context: groupContext,
        currency: set.currency,
        signedAmountMinor: -amtMinor,
        date: new Date(set.date),
      })
      eventRows.push({
        counterpartyId: set.toUserId,
        context: groupContext,
        currency: set.currency,
        signedAmountMinor: amtMinor,
        date: new Date(set.date),
      })
    }

    const openBalances = aggregateOpenBalances(eventRows, userId)
    const orderedBalances = orderBalances(openBalances, preferredCurrency.code)

    const balanceByCounterparty = new Map<string, OpenBalance[]>()
    for (const ob of orderedBalances) {
      const arr = balanceByCounterparty.get(ob.counterpartyId) ?? []
      arr.push(ob)
      balanceByCounterparty.set(ob.counterpartyId, arr)
    }

    const pendingRequests: RequestItem[] = allFriendships
      .filter(
        (f) =>
          f.status === "pending" &&
          f.friendId === userId &&
          f.friendUser
      )
      .map((f) => ({ friendship: f, user: f.friendUser! }))

    const acceptedFriendshipIds = new Set(
      allFriendships
        .filter((f) => f.status === "accepted")
        .map((f) => (f.userId === userId ? f.friendId : f.userId))
    )

    const membershipByGroup = new Map<string, Group>()
    for (const g of groups) {
      membershipByGroup.set(g.id, g)
    }

    const groupSections: GroupSection[] = groups.map((g) => {
      const groupBalances = orderedBalances.filter(
        (ob) => ob.context.type === "group" && ob.context.groupId === g.id
      )
      return { group: g, balance: groupBalances[0] ?? null }
    })

    const personSet = new Map<string, User>()
    for (const f of friends) {
      personSet.set(f.id, f)
    }
    for (const g of groups) {
      for (const m of g.members) {
        if (m.userId !== userId) {
          personSet.set(m.userId, m.user)
        }
      }
    }

    const personSections: PersonSection[] = Array.from(personSet.values())
      .filter((u) => {
        if (!lowerSearch) return true
        return (
          u.name.toLowerCase().includes(lowerSearch) ||
          u.email.toLowerCase().includes(lowerSearch)
        )
      })
      .map((u) => {
        const balances = balanceByCounterparty.get(u.id) ?? []
        const classification = classifyPersonBalances(balances)
        const friendship =
          allFriendships.find(
            (f) =>
              (f.userId === userId && f.friendId === u.id) ||
              (f.friendId === userId && f.userId === u.id)
          ) ?? null
        const sharedGroupCount = new Set(
          balances.filter((balance) => balance.context.type === "group").map((balance) => balance.context.groupId)
        ).size
        const topBalance = balances[0] ?? null
        return {
          user: u,
          friendship,
          classification,
          topBalance,
          sharedGroupCount,
          topBalanceContextLabel:
            topBalance?.context.type === "group"
              ? membershipByGroup.get(topBalance.context.groupId)?.name ?? null
              : null,
          lastActivityAt: topBalance?.lastActivityAt ?? null,
        }
      })
      .sort((a, b) => {
        const rankOrder: Record<string, number> = {
          "owes-you": 0,
          mixed: 1,
          "you-owe": 2,
          settled: 3,
        }
        const rankDiff =
          (rankOrder[a.classification] ?? 4) - (rankOrder[b.classification] ?? 4)
        if (rankDiff !== 0) return rankDiff
        return a.user.name.localeCompare(b.user.name)
      })

    return { pendingRequests, groupSections, personSections }
  }, [
    groupsQuery.data,
    friendsQuery.data,
    allFriendshipsQuery.data,
    expensesQuery.data,
    settlementsQuery.data,
    notificationsQuery.data,
    userId,
    search,
    preferredCurrency.code,
  ])

  const refreshImpl = useCallback(async () => {
    const refetches = [
      groupsQuery.refetch,
      friendsQuery.refetch,
      allFriendshipsQuery.refetch,
      expensesQuery.refetch,
      settlementsQuery.refetch,
      notificationsQuery.refetch,
    ].map((fn) => fn())
    await Promise.all(refetches)
  }, [
    groupsQuery.refetch,
    friendsQuery.refetch,
    allFriendshipsQuery.refetch,
    expensesQuery.refetch,
    settlementsQuery.refetch,
    notificationsQuery.refetch,
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
