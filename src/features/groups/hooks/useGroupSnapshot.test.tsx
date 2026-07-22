import { renderHook, act } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useGroupSnapshot } from "./useGroupSnapshot"

import { useGroups, useGroupDetails } from "@/features/groups/queries/useGroups"
import { useGroupExpenses } from "@/features/expenses/queries/useExpenses"
import { useGroupSettlements } from "@/features/settlements/queries/useSettlements"
import { useGroupRecurringExpenses } from "@/features/recurring/queries/useRecurringExpenses"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import { useUserActivities } from "@/features/activity/queries/useActivities"
import type { Mock } from "jest-mock"

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: jest.fn(),
  useGroupDetails: jest.fn(),
}))

jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useGroupExpenses: jest.fn(),
}))

jest.mock("@/features/settlements/queries/useSettlements", () => ({
  useGroupSettlements: jest.fn(),
}))

jest.mock("@/features/recurring/queries/useRecurringExpenses", () => ({
  useGroupRecurringExpenses: jest.fn(),
}))

jest.mock("@/features/notifications/queries/useNotifications", () => ({
  useNotifications: jest.fn(),
}))

jest.mock("@/features/activity/queries/useActivities", () => ({
  useUserActivities: jest.fn(),
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

const mockGroup = {
  id: "g1",
  name: "Test Group",
  currency: "USD",
  members: [
    { userId: "me", user: { id: "me", name: "Me", initials: "M", defaultCurrency: "USD", setupState: "complete" as const }, balance: 0 },
    { userId: "u1", user: { id: "u1", name: "Alice", initials: "A", defaultCurrency: "USD", setupState: "complete" as const }, balance: 0 },
  ],
  createdAt: new Date(),
  createdBy: "me",
}

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useGroupSnapshot", () => {
  it("returns undefined data while queries are loading", async () => {
    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useGroupExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useGroupSettlements as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))

    const { result } = await renderHook(() => useGroupSnapshot("g1", "overview"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(true)
  })

  it("returns data once all queries resolve", async () => {
    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(mockGroup))
    ;(useGroupExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroupSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useGroupSnapshot("g1", "overview"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.group.id).toBe("g1")
    expect(result.current.data?.members).toHaveLength(2)
    expect(result.current.isInitialLoading).toBe(false)
    expect(result.current.isNotFound).toBe(false)
  })

  it("derives balances only from the current user's group activity", async () => {
    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(mockGroup))
    ;(useGroupExpenses as Mock).mockReturnValue(
      makeMockReturn([
        {
          id: "paid-by-me",
          paidBy: "me",
          currency: "USD",
          date: new Date("2026-07-01"),
          splits: [
            { userId: "me", amount: 10, amountMinor: 1000 },
            { userId: "u1", amount: 5, amountMinor: 500 },
          ],
        },
        {
          id: "paid-by-alice",
          paidBy: "u1",
          currency: "USD",
          date: new Date("2026-07-02"),
          splits: [
            { userId: "me", amount: 7, amountMinor: 700 },
            { userId: "u1", amount: 3, amountMinor: 300 },
          ],
        },
        {
          id: "not-my-expense",
          paidBy: "u2",
          currency: "USD",
          date: new Date("2026-07-03"),
          splits: [{ userId: "u1", amount: 10, amountMinor: 1000 }],
        },
      ])
    )
    ;(useGroupSettlements as Mock).mockReturnValue(
      makeMockReturn([
        {
          id: "settlement-from-me",
          fromUserId: "me",
          toUserId: "u1",
          amount: 2,
          amountMinor: 200,
          currency: "USD",
          date: new Date("2026-07-04"),
        },
        {
          id: "not-my-settlement",
          fromUserId: "u2",
          toUserId: "u1",
          amount: 10,
          amountMinor: 1000,
          currency: "USD",
          date: new Date("2026-07-05"),
        },
      ])
    )
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useGroupSnapshot("g1", "overview"), { wrapper })

    expect(result.current.data?.balances).toEqual([
      expect.objectContaining({ counterpartyId: "u1", signedAmountMinor: 0 }),
    ])
  })

  it("marks not-found when group does not exist in loaded groups", async () => {
    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(undefined))
    ;(useGroupExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroupSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useGroupSnapshot("nonexistent", "overview"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isNotFound).toBe(true)
  })

  it("shows stale offline when data exists but a query errors", async () => {
    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(mockGroup))
    ;(useGroupExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroupSettlements as Mock).mockReturnValue(makeMockReturn([], { isError: true, error: new Error("DB error") }))
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useGroupSnapshot("g1", "overview"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.isStaleOffline).toBe(true)
    expect(result.current.isError).toBe(false)
  })

  it("refresh() calls refetch on every source", async () => {
    const refetchGroup = jest.fn().mockResolvedValue(undefined)
    const refetchExpenses = jest.fn().mockResolvedValue(undefined)
    const refetchSettlements = jest.fn().mockResolvedValue(undefined)
    const refetchRecurring = jest.fn().mockResolvedValue(undefined)
    const refetchNotifs = jest.fn().mockResolvedValue(undefined)
    const refetchActivities = jest.fn().mockResolvedValue(undefined)

    ;(useGroupDetails as Mock).mockReturnValue(makeMockReturn(mockGroup, { refetch: refetchGroup }))
    ;(useGroupExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchExpenses }))
    ;(useGroupSettlements as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchSettlements }))
    ;(useGroupRecurringExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchRecurring }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchNotifs }))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchActivities }))

    const { result } = await renderHook(() => useGroupSnapshot("g1", "overview"), { wrapper })

    await act(async () => {
      await result.current.refresh()
    })

    expect(refetchGroup).toHaveBeenCalledTimes(1)
    expect(refetchExpenses).toHaveBeenCalledTimes(1)
    expect(refetchSettlements).toHaveBeenCalledTimes(1)
    expect(refetchRecurring).toHaveBeenCalledTimes(1)
    expect(refetchNotifs).toHaveBeenCalledTimes(1)
    expect(refetchActivities).toHaveBeenCalledTimes(1)
  })
})
