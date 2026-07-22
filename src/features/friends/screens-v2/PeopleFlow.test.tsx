import { render, act, fireEvent } from "@testing-library/react-native"

import NewFriendScreen from "./NewFriendScreen"
import InviteRedemptionScreen from "./InviteRedemptionScreen"
import { invitationsApi } from "@/features/invitations/services/api"
import { clearPendingInviteToken } from "@/features/invitations/services/pendingInvite"

import { Alert } from "react-native"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import FriendDetailScreen from "./FriendDetailScreen"

const mockReplace = jest.fn()
const mockBack = jest.fn()
const mockPush = jest.fn()
const mockCanGoBack = jest.fn(() => true)
const mockUseLocalSearchParams = jest.fn(() => ({ token: "tok_test" }))

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: mockPush, canGoBack: mockCanGoBack }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me", name: "Me", email: "me@test.com" } }),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { isDarkMode: false, preferredCurrency: { code: "USD" } }
    return selector(store)
  },
}))

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: { text: "#000", muted: "#666", brand: "#f0584b", border: "#ddd", surface: "#fff", bg: "#fff", control: "#fff" },
    radius: { lg: 16, pill: 9999 },
  }),
}))

jest.mock("@/hooks/useAppToast", () => ({
  useAppToast: () => ({ toast: { show: jest.fn() } }),
}))

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  SafeAreaProvider: ({ children }: any) => children,
}))

jest.mock("lucide-react-native", () => {
  const React = require("react")
  const RN = require("react-native")
  const MockIcon = (props: any) => React.createElement(RN.View, null)
  return new Proxy({}, { get: () => MockIcon })
})

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}))

jest.mock("@/components/coral", () => {
  const React = require("react")
  const RN = require("react-native")
  return {
    CoralScreen: ({ children }: any) => React.createElement(RN.View, null, children),
    CoralTopBar: () => null,
    CoralButton: ({ label, onPress, disabled, loading }: any) =>
      React.createElement(
        RN.Pressable,
        { accessibilityRole: "button", accessibilityLabel: label, onPress, disabled: disabled || loading },
        React.createElement(RN.Text, null, label)
      ),
    CoralSearchField: ({ value, onChangeText, placeholder, ...props }: any) =>
      React.createElement(RN.TextInput, { value, onChangeText, placeholder, ...props }),
    CoralSheet: ({ visible, children }: any) =>
      visible ? React.createElement(RN.View, { accessibilityLabel: "sheet" }, children) : null,
    CoralField: ({ label, value, onChangeText, placeholder, multiline }: any) =>
      React.createElement(RN.TextInput, { value, onChangeText, placeholder, multiline }),
    MoneyAmount: ({ children, tone, size }: any) =>
      React.createElement(RN.Text, { accessibilityLabel: `money-${tone ?? "neutral"}` }, children),
    MoneyRow: ({ title, subtitle, amount, amountTone, onPress }: any) =>
      React.createElement(
        RN.Pressable,
        { accessibilityRole: "button", accessibilityLabel: `${title}, ${amount}`, onPress },
        React.createElement(RN.Text, null, title),
        subtitle ? React.createElement(RN.Text, null, subtitle) : null,
        React.createElement(RN.Text, null, amount)
      ),
    Eyebrow: ({ children }: any) => React.createElement(RN.Text, null, children),
    useCoralColors: () => ({
      foreground: "#000", muted: "#666", accent: "#f0584b",
      accentSoft: "#ffdcd6", inkOnAccent: "#fff", accentInk: "#5c0e10",
      positive: "#008045", negative: "#b61537", bg: "#fff",
      surface: "#fff", border: "#ddd", warning: "#c08500",
      balanceSurface: "#122237", balanceForeground: "#f1f6fa",
      avatarSoft: "#d2e8fb", avatarInk: "#1b3c5d",
      positiveSoft: "#d0f2dc", negativeSoft: "#ffe1e1",
    }),
  }
})

const mockSearchFriends = jest.fn()
const mockTransitionMutate = jest.fn()
jest.mock("@/features/friends/queries/useFriends", () => ({
  useSearchFriends: () => ({ mutateAsync: mockSearchFriends }),
  useTransitionFriendship: () => ({ mutate: mockTransitionMutate, mutateAsync: jest.fn() }),
  useAllFriendships: () => ({ data: [] }),
}))

const mockUsePersonSnapshot = jest.fn()
jest.mock("@/features/friends/hooks/usePersonSnapshot", () => ({
  usePersonSnapshot: () => mockUsePersonSnapshot(),
}))

jest.mock("@/features/invitations/services/api", () => ({
  invitationsApi: {
    createFriendInvite: jest.fn(),
    resolveFriendInvite: jest.fn(),
    redeemFriendInvite: jest.fn(),
  },
}))

jest.mock("@/features/invitations/services/pendingInvite", () => ({
  clearPendingInviteToken: jest.fn(),
}))

jest.mock("@/features/notifications/services/api", () => ({
  notificationsApi: { sendReminder: jest.fn() },
}))

jest.mock("@/features/navigation/phase2Routes", () => ({
  expenseHref: (ctx?: any) => ctx?.type === "direct"
    ? { pathname: "/expense/new", params: { friendId: ctx.friendshipId } }
    : "/expense/new",
  settlementHref: (input?: any) => input?.context?.type === "direct"
    ? { pathname: "/settle/[id]", params: { id: input.context.friendshipId, friendshipId: input.context.friendshipId } }
    : "/settle/new",
  coldBackHref: () => "/circles?segment=people",
}))

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: ({ user, size }: any) => null,
}))

jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: (amount: number) => `${Math.abs(amount).toFixed(2)}`,
  getCurrencySymbol: (code: string) => code === "USD" ? "$" : code,
}))

const createFriendInvite = invitationsApi.createFriendInvite as jest.Mock
const resolveFriendInvite = invitationsApi.resolveFriendInvite as jest.Mock
const redeemFriendInvite = invitationsApi.redeemFriendInvite as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("add flow", () => {
  it("shows not found state when search returns no results", async () => {
    mockSearchFriends.mockResolvedValueOnce({ state: "not_found" })

    const { getByPlaceholderText, getByText, findByText } = await render(<NewFriendScreen />)

    await fireEvent.changeText(getByPlaceholderText(/email/i), "missing@example.com")
    await fireEvent.press(getByText("Search"))

    expect(mockSearchFriends).toHaveBeenCalledWith("missing@example.com")
    expect(await findByText(/no user/i)).toBeTruthy()
  })

  it("shows self state when searching own email", async () => {
    mockSearchFriends.mockResolvedValueOnce({ state: "found", userId: "me", name: "Me", initials: "M" })

    const { getByPlaceholderText, getByText, findByText } = await render(<NewFriendScreen />)

    await fireEvent.changeText(getByPlaceholderText(/email/i), "me@test.com")
    await fireEvent.press(getByText("Search"))

    expect(await findByText(/your own email/i)).toBeTruthy()
  })

  it("shows friend found with send request button", async () => {
    mockSearchFriends.mockResolvedValueOnce({ state: "found", userId: "u-other", name: "Alice", initials: "A" })

    const { getByPlaceholderText, getByText, findByText } = await render(<NewFriendScreen />)

    await fireEvent.changeText(getByPlaceholderText(/email/i), "alice@example.com")
    await fireEvent.press(getByText("Search"))

    expect(await findByText("Alice")).toBeTruthy()
    expect(getByText("Send friend request")).toBeTruthy()
  })

  it("shows blocked state when search returns blocked", async () => {
    mockSearchFriends.mockResolvedValueOnce({ state: "blocked" })

    const { getByPlaceholderText, getByText, findByText } = await render(<NewFriendScreen />)

    await fireEvent.changeText(getByPlaceholderText(/email/i), "blocked@example.com")
    await fireEvent.press(getByText("Search"))

    expect(await findByText(/unavailable/i)).toBeTruthy()
  })

  it("validates email format before search", async () => {
    const { getByPlaceholderText, getByText } = await render(<NewFriendScreen />)

    await fireEvent.changeText(getByPlaceholderText(/email/i), "not-an-email")
    await fireEvent.press(getByText("Search"))

    expect(mockSearchFriends).not.toHaveBeenCalled()
  })
})

describe("invite redemption flow", () => {
  it("renders InviteRedemptionScreen", async () => {
    resolveFriendInvite.mockImplementation(() => new Promise(() => {}))

    const { getByText } = await render(<InviteRedemptionScreen />)
    expect(getByText(/resolving invite/i)).toBeTruthy()
  })

  it("shows valid invite with accept button", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "valid", inviterId: "u-inviter", expiresAt: new Date("2026-12-31") })

    const { getByText, findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/you have been invited/i)).toBeTruthy()
    expect(getByText("Accept Invite")).toBeTruthy()
  })

  it("shows expired state", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "expired" })

    const { findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/invite expired/i)).toBeTruthy()
  })

  it("shows revoked state", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "revoked" })

    const { findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/invite revoked/i)).toBeTruthy()
  })

  it("shows redeemed state", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "redeemed" })

    const { findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/already redeemed/i)).toBeTruthy()
  })

  it("shows self state", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "self" })

    const { getByText } = await render(<InviteRedemptionScreen />)

    expect(getByText("Your Own Invite")).toBeTruthy()
    expect(getByText("You cannot accept your own invite.")).toBeTruthy()
  })

  it("shows blocked state", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "blocked" })

    const { findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/invite unavailable/i)).toBeTruthy()
  })

  it("calls redeem and navigates on accept", async () => {
    resolveFriendInvite.mockResolvedValueOnce({ state: "valid", inviterId: "u-inviter", expiresAt: new Date("2026-12-31") })
    redeemFriendInvite.mockResolvedValueOnce("friendship-1")

    const { getByText, findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText("Accept Invite")).toBeTruthy()
    await fireEvent.press(getByText("Accept Invite"))

    expect(redeemFriendInvite).toHaveBeenCalledWith("tok_test")
    expect(clearPendingInviteToken).toHaveBeenCalled()
    await act(() => Promise.resolve())
    expect(mockReplace).toHaveBeenCalledWith("/friend/friendship-1")
  })

  it("shows error state on resolve failure", async () => {
    resolveFriendInvite.mockRejectedValueOnce(new Error("Network error"))

    const { getByText, findByText } = await render(<InviteRedemptionScreen />)

    expect(await findByText(/something went wrong/i)).toBeTruthy()
    expect(getByText("Try Again")).toBeTruthy()
  })
})

describe("share invite", () => {
  it("creates invite and shares raw token", async () => {
    createFriendInvite.mockResolvedValueOnce({ inviteId: "inv-1", rawToken: "tok_shared", expiresAt: new Date("2026-12-31") })

    const { getByText } = await render(<NewFriendScreen />)

    await fireEvent.press(getByText("Share invite link"))

    expect(createFriendInvite).toHaveBeenCalled()
  })
})

describe("rate limiting", () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it("disables search after 10 attempts", async () => {
    jest.setSystemTime(Date.now())
    mockSearchFriends.mockResolvedValue({ state: "not_found" })

    const { getByPlaceholderText, getByText, findByText } = await render(<NewFriendScreen />)

    for (let i = 0; i < 10; i++) {
      await fireEvent.changeText(getByPlaceholderText(/email/i), `user${i}@example.com`)
      await fireEvent.press(getByText("Search"))
      await findByText(/no user/i)
    }

    expect(mockSearchFriends).toHaveBeenCalledTimes(10)
  })
})

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>)
}

function baseSnapshot(overrides: Record<string, any> = {}) {
  return {
    data: {
      person: { id: "u-bob", name: "Bob Smith", initials: "BS", email: "bob@test.com" },
      friendship: { id: "f1", userId: "me", friendId: "u-bob", status: "accepted" },
      balances: [],
      sharedGroups: [],
      activities: [],
      permissions: {
        canSendRequest: false,
        canCancelRequest: false,
        canAcceptRequest: false,
        canRejectRequest: false,
        canRemoveFriend: true,
        canBlock: true,
        canUnblock: false,
      },
    },
    isInitialLoading: false,
    isRefreshing: false,
    isStaleOffline: false,
    isError: false,
    error: null,
    isNotFound: false,
    isRestricted: false,
    refresh: jest.fn(),
    ...overrides,
  }
}

describe("detail screen", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(Alert, "alert").mockReturnValue(undefined)
    mockUseLocalSearchParams.mockReturnValue({ id: "u-bob" })
  })

  it("shows loading state", async () => {
    mockUsePersonSnapshot.mockReturnValue(baseSnapshot({ data: undefined, isInitialLoading: true }))
    const { queryByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(queryByText("Bob Smith")).toBeNull()
  })

  it("shows error state", async () => {
    mockUsePersonSnapshot.mockReturnValue(baseSnapshot({ data: undefined, isError: true }))
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/something went wrong/i)).toBeTruthy()
  })

  it("shows not found state", async () => {
    mockUsePersonSnapshot.mockReturnValue(baseSnapshot({ data: undefined, isNotFound: true }))
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/friend not found/i)).toBeTruthy()
  })

  it("shows single-currency hero balance", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 4200, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/\+/)).toBeTruthy()
  })

  it("shows multi-currency compact breakdown", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 4200, lastActivityAt: new Date() },
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "EUR", signedAmountMinor: -1000, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/USD/)).toBeTruthy()
    expect(getByText(/EUR/)).toBeTruthy()
  })

  it("shows per-group balance in group rows", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          sharedGroups: [
            {
              group: { id: "g1", name: "Trip", members: [{ userId: "me", user: { id: "me" } }, { userId: "u-bob", user: { id: "u-bob" } }] },
              balance: { counterpartyId: "u-bob", context: { type: "group", groupId: "g1" }, currency: "USD", signedAmountMinor: 2500, lastActivityAt: new Date() },
            },
          ],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText("Trip")).toBeTruthy()
    expect(getByText(/\+/)).toBeTruthy()
  })

  it("shows settled state when zero balances", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 0, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/\$0\.00/)).toBeTruthy()
    expect(getByText(/all settled/i)).toBeTruthy()
  })

  it("opens remind sheet with single eligible preselect", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 4200, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText, findByText } = await renderWithQuery(<FriendDetailScreen />)
    await act(async () => {
      fireEvent.press(getByText("Send reminder"))
    })
    expect(await findByText("Send")).toBeTruthy()
  })

  it("remove is blocked by non-zero balance", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 4200, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    fireEvent.press(getByText("Remove friend"))
    expect(Alert.alert).toHaveBeenCalledWith(
      "Cannot Remove",
      expect.stringMatching(/outstanding balances/i)
    )
  })

  it("remove allowed when settled alerts confirmation", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          balances: [],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    fireEvent.press(getByText("Remove friend"))
    expect(Alert.alert).toHaveBeenCalledWith(
      "Remove Friend?",
      expect.any(String),
      expect.arrayContaining([
        expect.objectContaining({ text: "Remove", style: "destructive" }),
      ])
    )
  })

  it("block shows confirmation with history preservation copy", async () => {
    mockUsePersonSnapshot.mockReturnValue(baseSnapshot())
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    fireEvent.press(getByText("Block"))
    expect(Alert.alert).toHaveBeenCalledWith(
      "Block Friend?",
      expect.stringMatching(/remain in shared groups and past activity/i),
      expect.arrayContaining([expect.objectContaining({ text: "Block", style: "destructive" })])
    )
  })

  it("unblock visible only when canUnblock", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          permissions: {
            canSendRequest: false,
            canCancelRequest: false,
            canAcceptRequest: false,
            canRejectRequest: false,
            canRemoveFriend: false,
            canBlock: false,
            canUnblock: true,
          },
          balances: [],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { queryByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(queryByText("Unblock")).toBeTruthy()
    expect(queryByText("Block")).toBeNull()
    expect(queryByText("Remove friend")).toBeNull()
  })

  it("blocked relationship still shows balances and settle button", async () => {
    mockUsePersonSnapshot.mockReturnValue(
      baseSnapshot({
        data: {
          ...baseSnapshot().data,
          friendship: { id: "f1", userId: "me", friendId: "u-bob", status: "blocked" },
          permissions: {
            canSendRequest: false,
            canCancelRequest: false,
            canAcceptRequest: false,
            canRejectRequest: false,
            canRemoveFriend: false,
            canBlock: false,
            canUnblock: true,
          },
          balances: [
            { counterpartyId: "u-bob", context: { type: "direct", friendshipId: "f1" }, currency: "USD", signedAmountMinor: 4200, lastActivityAt: new Date() },
          ],
          sharedGroups: [],
          activities: [],
        },
      })
    )
    const { getByText } = await renderWithQuery(<FriendDetailScreen />)
    expect(getByText(/\+/)).toBeTruthy()
    expect(getByText("Settle up")).toBeTruthy()
    expect(getByText("Add expense")).toBeTruthy()
  })
})
