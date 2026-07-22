import { renderHook, act } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useHomeSnapshot } from "./useHomeSnapshot"

import { useGroups } from "@/features/groups/queries/useGroups"
import { useFriends } from "@/features/friends/queries/useFriends"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
import { useOpenBalances } from "@/features/balances/queries/useBalances"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import { useUserActivities } from "@/features/activity/queries/useActivities"
import { useRecurringExpenses } from "@/features/recurring/queries/useRecurringExpenses"
import type { Mock } from "jest-mock"

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: jest.fn(),
}))

jest.mock("@/features/friends/queries/useFriends", () => ({
  useFriends: jest.fn(),
}))

jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useUserExpenses: jest.fn(),
}))

jest.mock("@/features/settlements/queries/useSettlements", () => ({
  useUserSettlements: jest.fn(),
}))

jest.mock("@/features/balances/queries/useBalances", () => ({
  useOpenBalances: jest.fn(),
}))

jest.mock("@/features/notifications/queries/useNotifications", () => ({
  useNotifications: jest.fn(),
}))

jest.mock("@/features/activity/queries/useActivities", () => ({
  useUserActivities: jest.fn(),
}))

jest.mock("@/features/recurring/queries/useRecurringExpenses", () => ({
  useRecurringExpenses: jest.fn(),
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

const mockGroup = { id: "g1", name: "Test Group", currency: "USD", members: [], createdAt: new Date(), createdBy: "me" }
const mockFriend = { id: "u1", name: "Alice", email: "alice@test.com", initials: "A", defaultCurrency: "USD", setupState: "complete" as const }

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("useHomeSnapshot", () => {
  it("returns undefined data while queries are loading", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useRecurringExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))

    const { result } = await renderHook(() => useHomeSnapshot("me"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(true)
  })

  it("returns data once all queries resolve", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))
    ;(useRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useHomeSnapshot("me"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.groupLedger).toHaveLength(1)
    expect(result.current.data?.isFirstUse).toBe(false)
    expect(result.current.isInitialLoading).toBe(false)
  })

  it("marks isFirstUse when no groups or expenses exist", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))
    ;(useRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useHomeSnapshot("me"), { wrapper })

    expect(result.current.data?.isFirstUse).toBe(true)
  })

  it("shows stale offline when data exists but a query errors", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([], { isError: true, error: new Error("Network error") }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([]))
    ;(useRecurringExpenses as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useHomeSnapshot("me"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.isStaleOffline).toBe(true)
    expect(result.current.isError).toBe(true)
  })

  it("refresh() calls refetch on every source", async () => {
    const refetchGroups = jest.fn().mockResolvedValue(undefined)
    const refetchFriends = jest.fn().mockResolvedValue(undefined)
    const refetchExpenses = jest.fn().mockResolvedValue(undefined)
    const refetchSettlements = jest.fn().mockResolvedValue(undefined)
    const refetchBalances = jest.fn().mockResolvedValue(undefined)
    const refetchNotifs = jest.fn().mockResolvedValue(undefined)
    const refetchActivities = jest.fn().mockResolvedValue(undefined)
    const refetchRecurring = jest.fn().mockResolvedValue(undefined)

    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup], { refetch: refetchGroups }))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend], { refetch: refetchFriends }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchExpenses }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchSettlements }))
    ;(useOpenBalances as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchBalances }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchNotifs }))
    ;(useUserActivities as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchActivities }))
    ;(useRecurringExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchRecurring }))

    const { result } = await renderHook(() => useHomeSnapshot("me"), { wrapper })

    await act(async () => {
      await result.current.refresh()
    })

    expect(refetchGroups).toHaveBeenCalledTimes(1)
    expect(refetchFriends).toHaveBeenCalledTimes(1)
    expect(refetchExpenses).toHaveBeenCalledTimes(1)
    expect(refetchSettlements).toHaveBeenCalledTimes(1)
    expect(refetchBalances).toHaveBeenCalledTimes(1)
    expect(refetchNotifs).toHaveBeenCalledTimes(1)
    expect(refetchActivities).toHaveBeenCalledTimes(1)
    expect(refetchRecurring).toHaveBeenCalledTimes(1)
  })
})
