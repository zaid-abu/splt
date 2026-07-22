import { useCallback, useMemo } from "react"
import { useAuth } from "@/context/AppContext"
import { useFriends, useAllFriendships } from "@/features/friends/queries/useFriends"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
import { useGroups } from "@/features/groups/queries/useGroups"
import {
  aggregateOpenBalances,
  classifyPersonBalances,
  orderBalances,
} from "@/features/money/balances"
import { getRelationshipPermissions } from "@/features/permissions/contracts"
import { useUIStore } from "@/store/useUIStore"
import type { User, Friendship, Group, Expense, Settlement, Activity } from "@/types"
import type { OpenBalance } from "@/features/money/types"
import type { RelationshipPermissions } from "@/features/permissions/contracts"

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

export interface SharedGroupRow {
  group: Group
  balance: OpenBalance | null
}

export interface PersonSnapshotData {
  person: User
  friendship: Friendship | null
  balances: OpenBalance[]
  sharedGroups: SharedGroupRow[]
  activities: Activity[]
  permissions: RelationshipPermissions
}

export function usePersonSnapshot(
  counterpartyId: string
): SnapshotState<PersonSnapshotData> {
  const { currentUser } = useAuth()
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)

  const friendsQuery = useFriends(currentUser.id)
  const allFriendshipsQuery = useAllFriendships(currentUser.id)
  const groupsQuery = useGroups(currentUser.id)
  const expensesQuery = useUserExpenses(currentUser.id)
  const settlementsQuery = useUserSettlements(currentUser.id)

  const queries = [
    friendsQuery,
    allFriendshipsQuery,
    groupsQuery,
    expensesQuery,
    settlementsQuery,
  ] as const

  const isLoadingAny = queries.some((q) => q.isLoading)
  const isErrorAny = queries.some((q) => q.isError)
  const firstError = queries.find((q) => q.error)?.error ?? null
  const allHaveData = queries.every((q) => !!q.data || q.isFetched)
  const anyData = queries.some((q) => !!q.data)

  const isInitialLoading = isLoadingAny && !anyData
  const isRefreshing = isLoadingAny && anyData
  const isStaleOffline = isErrorAny && anyData && allHaveData

  const data = useMemo<PersonSnapshotData | undefined>(() => {
    if (!allHaveData) return undefined

    const friends = friendsQuery.data ?? []
    const allFriendships = allFriendshipsQuery.data ?? []
    const groups = groupsQuery.data ?? []
    const expenses = expensesQuery.data ?? []
    const settlements = settlementsQuery.data ?? []

    const person = friends.find((f) => f.id === counterpartyId)
    if (!person) return undefined

    const friendship =
      allFriendships.find(
        (f) =>
          (f.userId === currentUser.id && f.friendId === counterpartyId) ||
          (f.friendId === currentUser.id && f.userId === counterpartyId)
      ) ?? null

    const eventRows: {
      counterpartyId: string
      context: { type: "group"; groupId: string } | { type: "direct"; friendshipId: string }
      currency: string
      signedAmountMinor: number
      date: Date
    }[] = []

    const sharedExpenses = expenses.filter((exp) => {
      const involvesPerson =
        exp.paidBy === counterpartyId ||
        exp.splits.some((s) => s.userId === counterpartyId)
      const involvesMe =
        exp.paidBy === currentUser.id ||
        exp.splits.some((s) => s.userId === currentUser.id)
      return involvesPerson && involvesMe
    })

    for (const exp of sharedExpenses) {
      const ctx = exp.groupId
        ? { type: "group" as const, groupId: exp.groupId }
        : { type: "direct" as const, friendshipId: friendship?.id ?? "" }

      const amtMinor = exp.amountMinor ?? Math.round(exp.amount * 100)
      if (exp.paidBy === currentUser.id) {
        for (const split of exp.splits) {
          if (split.userId === currentUser.id) continue
          const splitMinor = split.amountMinor ?? Math.round(split.amount * 100)
          eventRows.push({
            counterpartyId: split.userId,
            context: ctx,
            currency: exp.currency,
            signedAmountMinor: splitMinor,
            date: new Date(exp.date),
          })
        }
      } else if (exp.paidBy === counterpartyId) {
        const mySplit = exp.splits.find((s) => s.userId === currentUser.id)
        if (mySplit) {
          const splitMinor = mySplit.amountMinor ?? Math.round(mySplit.amount * 100)
          eventRows.push({
            counterpartyId: exp.paidBy,
            context: ctx,
            currency: exp.currency,
            signedAmountMinor: -splitMinor,
            date: new Date(exp.date),
          })
        }
      }
    }

    const sharedSettlements = settlements.filter((set) => {
      const involvesPerson =
        set.fromUserId === counterpartyId || set.toUserId === counterpartyId
      const involvesMe =
        set.fromUserId === currentUser.id || set.toUserId === currentUser.id
      return involvesPerson && involvesMe
    })

    for (const set of sharedSettlements) {
      const ctx = set.groupId
        ? { type: "group" as const, groupId: set.groupId }
        : { type: "direct" as const, friendshipId: friendship?.id ?? "" }
      const amtMinor = set.amountMinor ?? Math.round(set.amount * 100)

      if (set.fromUserId === currentUser.id) {
        eventRows.push({
          counterpartyId: set.toUserId,
          context: ctx,
          currency: set.currency,
          signedAmountMinor: amtMinor,
          date: new Date(set.date),
        })
      } else if (set.toUserId === currentUser.id) {
        eventRows.push({
          counterpartyId: set.fromUserId,
          context: ctx,
          currency: set.currency,
          signedAmountMinor: -amtMinor,
          date: new Date(set.date),
        })
      }
    }

    const allOpenBalances = aggregateOpenBalances(eventRows, currentUser.id)

    const personBalances = allOpenBalances.filter(
      (ob) => ob.counterpartyId === counterpartyId && ob.signedAmountMinor !== 0
    )
    const orderedPersonBalances = orderBalances(personBalances, preferredCurrency.code)

    const sharedGroups: SharedGroupRow[] = groups
      .filter((g) => g.members.some((m) => m.userId === counterpartyId))
      .map((g) => {
        const groupBalance = orderedPersonBalances.find(
          (ob) => ob.context.type === "group" && ob.context.groupId === g.id
        )
        return { group: g, balance: groupBalance ?? null }
      })

    const localActivities: Activity[] = []
    for (const exp of sharedExpenses) {
      localActivities.push({
        id: `exp-${exp.id}`,
        type: "expense",
        groupId: exp.groupId,
        expense: exp,
        userId: exp.paidBy,
        user: exp.paidByUser,
        description: exp.title,
        amount: exp.amount,
        currency: exp.currency,
        date: exp.date,
      })
    }
    for (const set of sharedSettlements) {
      localActivities.push({
        id: `set-${set.id}`,
        type: "settlement",
        groupId: set.groupId,
        settlement: set,
        userId: set.fromUserId,
        user: set.fromUser,
        description: "Settled up",
        amount: set.amount,
        currency: set.currency,
        date: set.date,
      })
    }
    localActivities.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )

    const permissions = getRelationshipPermissions({
      currentUserId: currentUser.id,
      targetUserId: counterpartyId,
      friendshipStatus: friendship?.status,
    })

    return {
      person,
      friendship,
      balances: orderedPersonBalances,
      sharedGroups,
      activities: localActivities,
      permissions,
    }
  }, [
    friendsQuery.data,
    allFriendshipsQuery.data,
    groupsQuery.data,
    expensesQuery.data,
    settlementsQuery.data,
    counterpartyId,
    currentUser.id,
    preferredCurrency.code,
  ])

  const isNotFound = !isLoadingAny && data === undefined && !!(friendsQuery.data ?? []).length
  const isRestricted =
    data !== undefined &&
    data.permissions.canBlock &&
    !data.permissions.canSendRequest &&
    !data.permissions.canRemoveFriend

  const refreshImpl = useCallback(async () => {
    const refetches = [
      friendsQuery.refetch,
      allFriendshipsQuery.refetch,
      groupsQuery.refetch,
      expensesQuery.refetch,
      settlementsQuery.refetch,
    ].map((fn) => fn())
    await Promise.all(refetches)
  }, [
    friendsQuery.refetch,
    allFriendshipsQuery.refetch,
    groupsQuery.refetch,
    expensesQuery.refetch,
    settlementsQuery.refetch,
  ])

  return {
    data,
    isInitialLoading,
    isRefreshing,
    isStaleOffline,
    isError: isErrorAny,
    error: firstError,
    isNotFound,
    isRestricted,
    refresh: refreshImpl,
  }
}
