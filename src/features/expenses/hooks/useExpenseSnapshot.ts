import { useCallback, useMemo } from "react"
import { useAuth } from "@/context/AppContext"
import { useExpenseDetails } from "@/features/expenses/queries/useExpenses"
import { useExpenseComments } from "@/features/expenses/queries/useComments"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { getExpensePermissions } from "@/features/permissions/contracts"
import type { Expense, ExpenseComment } from "@/types"
import type { OpenBalance } from "@/features/money/types"
import type { ExpensePermissions } from "@/features/permissions/contracts"

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

export interface ExpenseSnapshotData {
  expense: Expense
  permissions: ExpensePermissions
  receiptUrl?: string
  comments: ExpenseComment[]
  settlementCandidates: OpenBalance[]
}

export function useExpenseSnapshot(
  expenseId: string
): SnapshotState<ExpenseSnapshotData> {
  const { currentUser } = useAuth()

  const expenseQuery = useExpenseDetails(expenseId)
  const commentsQuery = useExpenseComments(expenseId)
  const openBalancesQuery = useOpenBalances(currentUser.id)

  const queries = [expenseQuery, commentsQuery, openBalancesQuery] as const

  const isLoadingAny = queries.some((q) => q.isLoading)
  const isErrorAny = queries.some((q) => q.isError)
  const firstError = queries.find((q) => q.error)?.error ?? null
  const allHaveData = queries.every((q) => !!q.data || q.isFetched)
  const anyData = queries.some((q) => !!q.data)

  const isInitialLoading = isLoadingAny && !anyData
  const isRefreshing = isLoadingAny && anyData
  const isStaleOffline = isErrorAny && anyData && allHaveData

  const data = useMemo<ExpenseSnapshotData | undefined>(() => {
    if (!allHaveData) return undefined

    const expense = expenseQuery.data
    if (!expense) return undefined

    const comments = commentsQuery.data ?? []
    const openBalances = openBalancesQuery.data ?? []

    const permissions = getExpensePermissions({
      currentUserId: currentUser.id,
      createdBy: expense.createdBy,
      groupCreatedBy: expense.groupId ? undefined : undefined,
    })

    const receiptUrl = expense.receiptUrl ?? expense.legacyReceiptUrl ?? undefined

    const settlementCandidates = openBalances.filter((ob) => {
      if (ob.counterpartyId === currentUser.id) return false

      const inGroup =
        expense.groupId &&
        ob.context.type === "group" &&
        ob.context.groupId === expense.groupId

      const inDirect =
        !expense.groupId &&
        ob.context.type === "direct" &&
        expense.splits.some((s) => {
          const isCounterparty = s.userId === ob.counterpartyId
          const isPayer = expense?.paidBy === ob.counterpartyId
          return isCounterparty || isPayer
        })

      return inGroup || inDirect
    })

    return {
      expense,
      permissions,
      receiptUrl,
      comments,
      settlementCandidates,
    }
  }, [
    expenseQuery.data,
    commentsQuery.data,
    openBalancesQuery.data,
    currentUser.id,
  ])

  const isNotFound = !isLoadingAny && data === undefined && !!(expenseQuery.isFetched)
  const isRestricted = data !== undefined && !data.permissions.canEdit

  const refreshImpl = useCallback(async () => {
    const refetches = [
      expenseQuery.refetch,
      commentsQuery.refetch,
      openBalancesQuery.refetch,
    ].map((fn) => fn())
    await Promise.all(refetches)
  }, [
    expenseQuery.refetch,
    commentsQuery.refetch,
    openBalancesQuery.refetch,
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
