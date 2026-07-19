import { renderHook, act } from "@testing-library/react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { usePersonSnapshot } from "./usePersonSnapshot"

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/friends/queries/useFriends", () => ({
  useFriends: jest.fn(),
  useAllFriendships: jest.fn(),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: jest.fn(),
}))

jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useUserExpenses: jest.fn(),
}))

jest.mock("@/features/settlements/queries/useSettlements", () => ({
  useUserSettlements: jest.fn(),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { preferredCurrency: { code: "USD" } }
    return selector(store)
  },
}))

import { useFriends, useAllFriendships } from "@/features/friends/queries/useFriends"
import { useGroups } from "@/features/groups/queries/useGroups"
import { useUserExpenses } from "@/features/expenses/queries/useExpenses"
import { useUserSettlements } from "@/features/settlements/queries/useSettlements"
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

const mockFriend = { id: "u1", name: "Alice", email: "alice@test.com", initials: "A", defaultCurrency: "USD", setupState: "complete" as const }

function wrapper({ children }: { children: ReactNode }) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return <QueryClientProvider client={qc}>{children}</QueryClientProvider>
}

beforeEach(() => {
  jest.clearAllMocks()
})

describe("usePersonSnapshot", () => {
  it("returns undefined data while identity query is loading", async () => {
    ;(useFriends as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useGroups as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn(undefined, { isLoading: true, isFetched: false }))

    const { result } = await renderHook(() => usePersonSnapshot("u1"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isInitialLoading).toBe(true)
  })

  it("returns data once all queries resolve", async () => {
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => usePersonSnapshot("u1"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.data?.person.id).toBe("u1")
    expect(result.current.data?.balances).toEqual([])
    expect(result.current.isInitialLoading).toBe(false)
  })

  it("marks not-found when person is not in friends list", async () => {
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => usePersonSnapshot("nonexistent"), { wrapper })

    expect(result.current.data).toBeUndefined()
    expect(result.current.isNotFound).toBe(true)
  })

  it("shows stale offline when data exists but a query errors", async () => {
    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend]))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([]))
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([], { isError: true, error: new Error("DB error") }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([]))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([]))

    const { result } = await renderHook(() => usePersonSnapshot("u1"), { wrapper })

    expect(result.current.data).toBeDefined()
    expect(result.current.isStaleOffline).toBe(true)
    expect(result.current.isError).toBe(true)
  })

  it("refresh() calls refetch on every source", async () => {
    const refetchFriends = jest.fn().mockResolvedValue(undefined)
    const refetchAllFriendships = jest.fn().mockResolvedValue(undefined)
    const refetchGroups = jest.fn().mockResolvedValue(undefined)
    const refetchExpenses = jest.fn().mockResolvedValue(undefined)
    const refetchSettlements = jest.fn().mockResolvedValue(undefined)

    ;(useFriends as Mock).mockReturnValue(makeMockReturn([mockFriend], { refetch: refetchFriends }))
    ;(useAllFriendships as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchAllFriendships }))
    ;(useGroups as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchGroups }))
    ;(useUserExpenses as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchExpenses }))
    ;(useUserSettlements as Mock).mockReturnValue(makeMockReturn([], { refetch: refetchSettlements }))

    const { result } = await renderHook(() => usePersonSnapshot("u1"), { wrapper })

    await act(async () => {
      await result.current.refresh()
    })

    expect(refetchFriends).toHaveBeenCalledTimes(1)
    expect(refetchAllFriendships).toHaveBeenCalledTimes(1)
    expect(refetchGroups).toHaveBeenCalledTimes(1)
    expect(refetchExpenses).toHaveBeenCalledTimes(1)
    expect(refetchSettlements).toHaveBeenCalledTimes(1)
  })
})
