import { renderHook, act } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useExpenseSnapshot } from "./useExpenseSnapshot"

import { useExpenseDetails } from "@/features/expenses/queries/useExpenses"
import { useExpenseComments } from "@/features/expenses/queries/useComments"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import type { Mock } from "jest-mock"

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useExpenseDetails: jest.fn(),
}))

jest.mock("@/features/expenses/queries/useComments", () => ({
  useExpenseComments: jest.fn(),
}))

jest.mock("@/features/balances/queries/useBalances", () => ({
  useOpenBalances: jest.fn(),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { preferredCurrency: { code: "USD" } }
    return selector(store)
  },
}))

function makeMockReturn(data?: any, overrides?: Record<string, any>) {
  return {
    data: data ?? undefined,
    isLoading: false,
    isFetched: true,
    isError: false,
    error: null,
    refetch: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  }
}

const mockExpense = {
  id: "e1",
  title: "Dinner",
  amount: 50,
  amountMinor: 5000,
  currency: "USD",
  paidBy: "me",
  paidByUser: { id: "me", name: "Me", initials: "M", defaultCurrency: "USD", setupState: "complete" as const },
  createdBy: "me",
  splits: [],
  splitMethod: "equal" as const,
  date: new Date(),
  createdAt: new Date(),
  category: "food" as const,
}

const mockComment = {
  id: "c1",
  expenseId: "e1",
  userId: "u1",
  text: "Looks good!",
  createdAt: new Date(),
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useExpenseSnapshot", () => {
  it("returns undefined data while expense query is loading", async () => {
    ;(useExpenseDetails as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useExpenseComments as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))

    const { result } = await renderHook(() => useExpenseSnapshot("e1"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(true)
  })

  it("returns data once all queries resolve", async () => {
    ;(useExpenseDetails as Mock).mockReturnValue(makeMockReturn(mockExpense))
    ;(useExpenseComments as Mock).mockReturnValue(makeMockReturn([mockComment]))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useExpenseSnapshot("e1"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.expense.id).toBe("e1")
    expect(result.current.data?.comments).toHaveLength(1)
    expect(result.current.data?.permissions.canEdit).toBe(true)
    expect(result.current.isInitialLoading).toBe(false)
  })

  it("marks not-found when expense does not exist", async () => {
    ;(useExpenseDetails as Mock).mockReturnValue(makeMockReturn(null, { isFetched: true }))
    ;(useExpenseComments as Mock).mockReturnValue(makeMockReturn([]))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useExpenseSnapshot("nonexistent"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isNotFound).toBe(true)
  })

  it("shows stale offline when data exists but a query errors", async () => {
    ;(useExpenseDetails as Mock).mockReturnValue(makeMockReturn(mockExpense))
    ;(useExpenseComments as Mock).mockReturnValue(makeMockReturn([], { isError: true, error: new Error("Network error") }))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useExpenseSnapshot("e1"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.isStaleOffline).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it("refresh() calls refetch on every source", async () => {
    const refetchDetails = jest.fn().mockResolvedValue(undefined)
    const refetchComments = jest.fn().mockResolvedValue(undefined)
    const refetchBalances = jest.fn().mockResolvedValue(undefined)

    ;(useExpenseDetails as Mock).mockReturnValue(makeMockReturn(mockExpense, { refetch: refetchDetails }))
    ;(useExpenseComments as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchComments }))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchBalances }))

    const { result } = await renderHook(() => useExpenseSnapshot("e1"), { wrapper })

    await act(async () => {
      await result.current.refresh()
    })

    expect(refetchDetails).toHaveBeenCalledTimes(1)
    expect(refetchComments).toHaveBeenCalledTimes(1)
    expect(refetchBalances).toHaveBeenCalledTimes(1)
  })
})
