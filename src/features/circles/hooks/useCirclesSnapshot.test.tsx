import { renderHook, act, waitFor } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { useCirclesSnapshot } from "./useCirclesSnapshot"

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: jest.fn(),
}))

jest.mock("@/features/friends/queries/useFriends", () => ({
  useFriends: jest.fn(),
  useAllFriendships: jest.fn(),
}))

jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useUserExpenses: jest.fn(),
}))

jest.mock("@/features/settlements/queries/useSettlements", () => ({
  useUserSettlements: jest.fn(),
}))

jest.mock("@/features/notifications/queries/useNotifications", () => ({
  useNotifications: jest.fn(),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { preferredCurrency: { code: "USD" } }
    return selector(store)
  },
}))

import { useGroups } from "@/features/groups/queries/useGroups"
import { useFriends, useAllFriendships } from "@/features/friends/queries/useFriends"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
import { useNotifications } from "@/features/notifications/queries/useNotifications"
import type { Mock } from "jest-mock"

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

describe("useCirclesSnapshot", () => {
  it("returns undefined data while queries are loading", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))

    const { result } = await renderHook(() => useCirclesSnapshot("me", ""), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(true)
    expect(result.current.isRefreshing).toBe(false)
  })

  it("returns data once all queries resolve", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([], { isFetched: true }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useCirclesSnapshot("me", ""), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.groupSections).toHaveLength(1)
    expect(result.current.data?.personSections).toBeDefined()
    expect(result.current.isInitialLoading).toBe(false)
    expect(result.current.isError).toBe(false)
  })

  it("shows stale offline when data exists but a query errors", async () => {
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([], { isFetched: true }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([], { isError: true, error: new Error("Network error") }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useCirclesSnapshot("me", ""), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.isStaleOffline).toBe(true)
    expect(result.current.isError).toBe(true)
  })

  it("refresh() calls refetch on every source", async () => {
    const refetchGroups = jest.fn().mockResolvedValue(undefined)
    const refetchFriends = jest.fn().mockResolvedValue(undefined)
    const refetchAllFriendships = jest.fn().mockResolvedValue(undefined)
    const refetchExpenses = jest.fn().mockResolvedValue(undefined)
    const refetchSettlements = jest.fn().mockResolvedValue(undefined)
    const refetchNotifications = jest.fn().mockResolvedValue(undefined)

    ;(useGroups as Mock).mockReturnValue(makeMockReturn([mockGroup], { refetch: refetchGroups }))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend], { refetch: refetchFriends }))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchAllFriendships }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchExpenses }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchSettlements }))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchNotifications }))

    const { result } = await renderHook(() => useCirclesSnapshot("me", ""), { wrapper })

    await act(async () => {
      await result.current.refresh()
    })

    expect(refetchGroups).toHaveBeenCalledTimes(1)
    expect(refetchFriends).toHaveBeenCalledTimes(1)
    expect(refetchAllFriendships).toHaveBeenCalledTimes(1)
    expect(refetchExpenses).toHaveBeenCalledTimes(1)
    expect(refetchSettlements).toHaveBeenCalledTimes(1)
    expect(refetchNotifications).toHaveBeenCalledTimes(1)
  })

  it("filters person sections by search term", async () => {
    const friend2 = { id: "u2", name: "Bob", email: "bob@test.com", initials: "B", defaultCurrency: "USD", setupState: "complete" as const }

    ;(useGroups as Mock).mockReturnValue(makeMockReturn([]))
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend, friend2]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([], { isFetched: true }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))
    ;(useNotifications as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => useCirclesSnapshot("me", "bob"), { wrapper })

    expect(result.current.data?.personSections).toHaveLength(1)
    expect(result.current.data?.personSections[0].user.id).toBe("u2")
  })
})
