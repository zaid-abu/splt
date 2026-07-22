import { useCallback, useMemo } from "react"
import { useAuth } from "@/context/AppContext"
import { useGroups, useGroupDetails } from "@/features/groups/queries/useGroups"
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses"
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements"
import { useGroupRecurringExpenses } from "@/features/recurring/queries/useRecurringExpenses"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import {
  aggregateOpenBalances,
  orderBalances,
} from "@/features/money/balances"
import { getGroupPermissions } from "@/features/permissions/contracts"
import { buildScheduleSections } from "@/features/recurring/services/readAdapter"
import { parseGroupView } from "@/features/navigation/phase2Routes"
import { useUIStore } from "@/store/useUIStore"
import { useUserActivities } from "@/features/activity/queries/useActivities"
import type { Group, GroupMember, Expense, Activity, GroupInvitation } from "@/types"
import type { OpenBalance } from "@/features/money/types"
import type { ScheduleSections } from "@/features/recurring/services/readAdapter"
import type {
  GroupPermissions,
} from "@/features/permissions/contracts"
import type { GroupView } from "@/types/navigation"

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

export interface GroupSnapshotData {
  group: Group
  permissions: GroupPermissions
  balances: OpenBalance[]
  members: GroupMember[]
  expenses: Expense[]
  scheduleSections: ScheduleSections
  invitations: GroupInvitation[]
  recentActivity: Activity[]
}

export function useGroupSnapshot(
  groupId: string,
  view: GroupView
): SnapshotState<GroupSnapshotData> {
  const { currentUser } = useAuth()
  const preferredCurrency = useUIStore((s) => s.preferredCurrency)

  const groupQuery = useGroupDetails(groupId)
  const groupExpensesQuery = useGroupExpenses(groupId)
  const groupSettlementsQuery = useGroupSettlements(groupId)
  const recurringQuery = useGroupRecurringExpenses(groupId)
  const notificationsQuery = useNotifications(currentUser.id)
  const activitiesQuery = useUserActivities(currentUser.id)

  const queries = [
    groupQuery,
    groupExpensesQuery,
    groupSettlementsQuery,
    recurringQuery,
    notificationsQuery,
    activitiesQuery,
  ] as const

  const isLoadingAny = queries.some((q) => q.isLoading)
  const isGroupError = groupQuery.isError
  const isErrorAny = queries.some((q) => q.isError) // unused, kept for future
  const firstError = queries.find((q) => q.error)?.error ?? null
  const allHaveData = queries.every((q) => !!q.data || q.isFetched) && !!groupQuery.data
  const anyData = queries.some((q) => !!q.data)

  const isInitialLoading = !groupQuery.data || (isLoadingAny && !anyData)
  const isRefreshing = isLoadingAny && anyData
  const isStaleOffline = isErrorAny && anyData && allHaveData

  const group = groupQuery.data

  const data = useMemo<GroupSnapshotData | undefined>(() => {
    if (!allHaveData) return undefined

    const resolvedGroup = groupQuery.data
    const groupExpenses = groupExpensesQuery.data ?? []
    const groupSettlements = groupSettlementsQuery.data ?? []
    const recurringExpenses = recurringQuery.data ?? []
    const notifications = notificationsQuery.data ?? []
    const activities = activitiesQuery.data ?? []

    if (!resolvedGroup) {
      return undefined
    }

    const permissions = getGroupPermissions({
      currentUserId: currentUser.id,
      createdBy: resolvedGroup.createdBy,
      memberIds: resolvedGroup.members.map((m) => m.userId),
    })

    const eventRows: {
      counterpartyId: string
      context: { type: "group"; groupId: string }
      currency: string
      signedAmountMinor: number
      date: Date
    }[] = []

    for (const exp of groupExpenses) {
      const context = { type: "group" as const, groupId }

      if (exp.paidBy === currentUser.id) {
        for (const split of exp.splits) {
          if (split.userId === currentUser.id) continue
          const signedAmountMinor = split.amountMinor ?? Math.round(split.amount * 100)
          eventRows.push({
            counterpartyId: split.userId,
            context,
            currency: exp.currency,
            signedAmountMinor,
            date: new Date(exp.date),
          })
        }
        continue
      }

      const mySplit = exp.splits.find((split) => split.userId === currentUser.id)
      if (!mySplit) continue

      eventRows.push({
        counterpartyId: exp.paidBy,
        context,
        currency: exp.currency,
        signedAmountMinor: -(mySplit.amountMinor ?? Math.round(mySplit.amount * 100)),
        date: new Date(exp.date),
      })
    }

    for (const set of groupSettlements) {
      const context = { type: "group" as const, groupId }
      const amountMinor = set.amountMinor ?? Math.round(set.amount * 100)

      if (set.fromUserId === currentUser.id) {
        eventRows.push({
          counterpartyId: set.toUserId,
          context,
          currency: set.currency,
          signedAmountMinor: amountMinor,
          date: new Date(set.date),
        })
      } else if (set.toUserId === currentUser.id) {
        eventRows.push({
          counterpartyId: set.fromUserId,
          context,
          currency: set.currency,
          signedAmountMinor: -amountMinor,
          date: new Date(set.date),
        })
      }
    }

    const openBalances = aggregateOpenBalances(eventRows, currentUser.id)
    const orderedBalances = orderBalances(openBalances, preferredCurrency.code)

    const scheduleSections = buildScheduleSections(
      { recurringExpenses, occurrences: [] },
      Intl.DateTimeFormat().resolvedOptions().timeZone
    )

    const invitations: GroupInvitation[] = []

    const recentActivity: Activity[] = activities
      .filter((a) => a.groupId === groupId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 20)

    return {
      group: resolvedGroup,
      permissions,
      balances: orderedBalances,
      members: resolvedGroup.members,
      expenses: groupExpenses.slice().sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ),
      scheduleSections,
      invitations,
      recentActivity,
    }
  }, [
    groupQuery.data,
    groupExpensesQuery.data,
    groupSettlementsQuery.data,
    recurringQuery.data,
    notificationsQuery.data,
    activitiesQuery.data,
    groupId,
    currentUser.id,
    preferredCurrency.code,
  ])

  const isNotFound = !isLoadingAny && data === undefined && groupQuery.isFetched && !groupQuery.data
  const isRestricted = data !== undefined && !data.permissions.canEdit && !data.permissions.canDelete

  const refreshImpl = useCallback(async () => {
    const refetches = [
      groupQuery.refetch,
      groupExpensesQuery.refetch,
      groupSettlementsQuery.refetch,
      recurringQuery.refetch,
      notificationsQuery.refetch,
      activitiesQuery.refetch,
    ].map((fn) => fn())
    await Promise.all(refetches)
  }, [
    groupQuery.refetch,
    groupExpensesQuery.refetch,
    groupSettlementsQuery.refetch,
    recurringQuery.refetch,
    notificationsQuery.refetch,
    activitiesQuery.refetch,
  ])

  return {
    data,
    isInitialLoading,
    isRefreshing,
    isStaleOffline,
    isError: isGroupError,
    error: firstError,
    isNotFound,
    isRestricted,
    refresh: refreshImpl,
  }
}
