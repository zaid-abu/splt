import { render, fireEvent, screen } from "@testing-library/react-native"
import type { Mock } from "jest-mock"

const mockPush = jest.fn()
const mockBack = jest.fn()

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/notifications/queries/useNotifications", () => ({
  useNotifications: jest.fn(),
}))

const mockTransitionFriendship = jest.fn()
jest.mock("@/features/friends/queries/useFriends", () => ({
  useTransitionFriendship: () => ({ mutateAsync: mockTransitionFriendship }),
}))

const mockRespondToInvitation = jest.fn()
jest.mock("@/features/groups/queries/useGroups", () => ({
  useRespondToInvitation: () => ({ mutateAsync: mockRespondToInvitation }),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { isDarkMode: false, preferredCurrency: { code: "USD" } }
    return selector(store)
  },
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

jest.mock("@/components/coral/useCoral", () => ({
  useCoralColors: () => ({
    foreground: "#000", muted: "#666", accent: "#f0584b",
    accentSoft: "#ffdcd6", inkOnAccent: "#fff", accentInk: "#5c0e10",
    positive: "#008045", negative: "#b61537", bg: "#fff",
    surface: "#fff", border: "#ddd", warning: "#c08500",
    balanceSurface: "#122237", balanceForeground: "#f1f6fa",
    avatarSoft: "#d2e8fb", avatarInk: "#1b3c5d",
    positiveSoft: "#d0f2dc", negativeSoft: "#ffe1e1",
  }),
}))

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: {
      text: "#000", muted: "#666", brand: "#f0584b", border: "#ddd",
      surface: "#fff", bg: "#f7f6f1", control: "#f0f0f0", textInverse: "#fff",
    },
    radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
    space: { xs: 4, sm: 8, md: 12, lg: 16 },
    shadow: { sm: {}, md: {}, lg: {} },
  }),
}))

jest.mock("@/components/coral/CoralScreen", () => ({
  CoralScreen: ({ children, scroll }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "coral-screen" }, children)
  },
}))

jest.mock("@/components/coral/CoralTopBar", () => ({
  CoralTopBar: ({ title, onBack }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "coral-topbar" },
      React.createElement(RN.Text, null, title),
      onBack ? React.createElement(RN.Pressable, { testID: "back-button", onPress: onBack }) : null
    )
  },
}))

jest.mock("@/components/coral/LargeTitle", () => ({
  LargeTitle: ({ children }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.Text, { testID: "large-title" }, children)
  },
}))

jest.mock("@/components/coral/MoneyRow", () => ({
  MoneyRow: ({ title, subtitle, amount, amountTone, onPress }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.Pressable,
      { testID: `money-row-${title}`, onPress, accessibilityRole: "button" },
      React.createElement(RN.Text, null, title),
      subtitle ? React.createElement(RN.Text, null, subtitle) : null,
      amount ? React.createElement(RN.Text, null, amount) : null
    )
  },
}))

jest.mock("@/components/coral/CoralButton", () => ({
  CoralButton: ({ label, onPress }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.Pressable,
      { testID: `coral-button-${label}`, onPress, accessibilityRole: "button" },
      React.createElement(RN.Text, null, label)
    )
  },
}))

jest.mock("@/components/coral/EmptyState", () => ({
  EmptyState: ({ title, subtitle, visual }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.View,
      { testID: "empty-state" },
      React.createElement(RN.Text, null, title),
      subtitle ? React.createElement(RN.Text, null, subtitle) : null
    )
  },
}))

import NotificationsV2Screen from "./NotificationsScreen"
import { useNotifications } from "@/features/notifications/queries/useNotifications"

const mockUseNotifications = useNotifications as Mock

const baseNotifications = [
  {
    id: "n1",
    kind: "friend_request" as const,
    title: "Friend Request",
    subtitle: "Alice wants to be friends",
    date: new Date("2026-07-18"),
    actorId: "u1",
    data: {},
  },
  {
    id: "n2",
    kind: "group_invite" as const,
    title: "Group Invitation",
    subtitle: "You've been invited to Trip",
    date: new Date("2026-07-18"),
    groupId: "g1",
    data: { invitation_id: "inv1" },
  },
  {
    id: "n3",
    kind: "balance_reminder" as const,
    title: "Balance Reminder",
    subtitle: "You have an outstanding balance",
    date: new Date("2026-07-17"),
    actorId: "u2",
    data: {},
  },
  {
    id: "n4",
    kind: "expense_added" as const,
    title: "New Expense",
    subtitle: "Dinner",
    date: new Date("2026-07-16"),
    expenseId: "e1",
    data: {},
  },
]

beforeEach(() => {
  jest.clearAllMocks()
})

async function renderScreen() {
  await render(<NotificationsV2Screen />)
}

describe("NotificationsScreen", () => {
  it("shows loading state", async () => {
    mockUseNotifications.mockReturnValue({
      data: undefined,
      isLoading: true,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByLabelText("Loading notifications")).toBeTruthy()
  })

  it("shows error state with retry", async () => {
    const mockRefetch = jest.fn()
    mockUseNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isRefetching: false,
      isError: true,
      refetch: mockRefetch,
    })
    await renderScreen()
    expect(screen.getByText("Could not load notifications.")).toBeTruthy()
    fireEvent.press(screen.getByText("Try again"))
    expect(mockRefetch).toHaveBeenCalled()
  })

  it("shows empty state when no notifications", async () => {
    mockUseNotifications.mockReturnValue({
      data: [],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByText("All caught up!")).toBeTruthy()
  })

  it("shows friend_request with Accept/Decline buttons", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[0]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByText("Friend Request")).toBeTruthy()
    expect(screen.getByText("Accept")).toBeTruthy()
    expect(screen.getByText("Decline")).toBeTruthy()
  })

  it("accepts friend request", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[0]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    fireEvent.press(screen.getByText("Accept"))
    expect(mockTransitionFriendship).toHaveBeenCalledWith({
      counterpartyId: "u1",
      action: "accept",
    })
  })

  it("declines friend request", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[0]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    fireEvent.press(screen.getByText("Decline"))
    expect(mockTransitionFriendship).toHaveBeenCalledWith({
      counterpartyId: "u1",
      action: "decline",
    })
  })

  it("shows group_invite with Accept/Decline buttons", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[1]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByText("Group Invitation")).toBeTruthy()
    expect(screen.getByText("Accept")).toBeTruthy()
    expect(screen.getByText("Decline")).toBeTruthy()
  })

  it("accepts group invitation", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[1]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    fireEvent.press(screen.getByText("Accept"))
    expect(mockRespondToInvitation).toHaveBeenCalledWith({
      id: "inv1",
      decision: "accept",
    })
  })

  it("declines group invitation", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[1]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    fireEvent.press(screen.getByText("Decline"))
    expect(mockRespondToInvitation).toHaveBeenCalledWith({
      id: "inv1",
      decision: "decline",
    })
  })

  it("routes balance_reminder to person detail", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[2]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByText("Balance Reminder")).toBeTruthy()
    fireEvent.press(screen.getByText("Balance Reminder"))
    expect(mockPush).toHaveBeenCalledWith("/friend/u2")
  })

  it("routes expense_added notification to expense detail", async () => {
    mockUseNotifications.mockReturnValue({
      data: [baseNotifications[3]],
      isLoading: false,
      isRefetching: false,
      isError: false,
      refetch: jest.fn(),
    })
    await renderScreen()
    expect(screen.getByText("New Expense")).toBeTruthy()
    fireEvent.press(screen.getByText("New Expense"))
    expect(mockPush).toHaveBeenCalledWith("/expense/e1")
  })
})
