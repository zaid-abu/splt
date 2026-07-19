import { render, fireEvent, screen } from "@testing-library/react-native"
import type { Mock } from "jest-mock"

const mockPush = jest.fn()
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me", name: "Test User" } }),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { isDarkMode: false, preferredCurrency: { code: "USD" }, convertCurrency: jest.fn() }
    return selector(store)
  },
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
      text: "#000", muted: "#666", brand: "#f0584b",
      border: "#ddd", surface: "#fff", bg: "#f7f6f1",
      control: "#f0f0f0", textInverse: "#fff",
    },
    radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
    space: { xs: 4, sm: 8, md: 12, lg: 16 },
    shadow: { sm: {}, md: {}, lg: {} },
  }),
}))

jest.mock("@/utils/date", () => ({
  getGreeting: () => "Good morning",
}))

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: ({ user, size }: any) => null,
}))

jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: (amount: number) => `${Math.abs(amount).toFixed(2)}`,
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

jest.mock("@/components/coral/CoralScreen", () => ({
  CoralScreen: ({ children, scroll }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "coral-screen" }, children)
  },
}))

jest.mock("@/components/coral/CoralTopBar", () => ({
  CoralTopBar: ({ leftElement, rightElement }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "coral-topbar" }, leftElement, rightElement)
  },
}))

jest.mock("@/components/coral/LargeTitle", () => ({
  LargeTitle: ({ children }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.Text, { testID: "large-title" }, children)
  },
}))

jest.mock("@/components/coral/Eyebrow", () => ({
  Eyebrow: ({ children }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.Text, { testID: "eyebrow" }, children)
  },
}))

jest.mock("@/components/coral/BalanceHero", () => ({
  BalanceHero: ({ label, value, note }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.View,
      { testID: "balance-hero" },
      React.createElement(RN.Text, null, label),
      React.createElement(RN.Text, null, value),
      note ? React.createElement(RN.Text, null, note) : null
    )
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
  CoralButton: ({ label, onPress, variant }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.Pressable,
      { testID: `coral-button-${label}`, onPress, accessibilityRole: "button" },
      React.createElement(RN.Text, null, label)
    )
  },
}))

const mockUseHomeSnapshot = jest.fn()
jest.mock("@/features/dashboard/hooks/useHomeSnapshot", () => ({
  useHomeSnapshot: () => mockUseHomeSnapshot(),
}))

import MoneyMapScreen from "./MoneyMapScreen"

const baseData = {
  heroBalances: [],
  attentionRows: [],
  groupLedger: [],
  nextSchedule: undefined,
  recentMovement: [],
  notifications: [],
  isFirstUse: false,
}

const baseSnapshot = {
  data: { ...baseData },
  isInitialLoading: false,
  isRefreshing: false,
  isStaleOffline: false,
  isError: false,
  error: null,
  isNotFound: false,
  isRestricted: false,
  refresh: jest.fn().mockResolvedValue(undefined),
}

const mockUser = {
  id: "u1", name: "Alice", email: "alice@test.com",
  initials: "A", defaultCurrency: "USD", setupState: "complete" as const,
}

const mockGroup = {
  id: "g1", name: "Trip", currency: "USD", icon: "users",
  members: [], createdAt: new Date(), createdBy: "me",
  totalExpenses: 0,
}

beforeEach(() => {
  jest.clearAllMocks()
})

async function renderScreen() {
  await render(<MoneyMapScreen />)
}

describe("MoneyMapScreen", () => {
  it("shows loading state", async () => {
    mockUseHomeSnapshot.mockReturnValue({ ...baseSnapshot, data: undefined, isInitialLoading: true })
    await renderScreen()
    expect(screen.getByTestId("coral-screen")).toBeTruthy()
  })

  it("shows error state with retry", async () => {
    mockUseHomeSnapshot.mockReturnValue({ ...baseSnapshot, data: undefined, isError: true, error: new Error("fail") })
    await renderScreen()
    expect(screen.getByText("Something went wrong")).toBeTruthy()
    fireEvent.press(screen.getByText("Tap to retry"))
    expect(baseSnapshot.refresh).toHaveBeenCalled()
  })

  it("shows greeting", async () => {
    mockUseHomeSnapshot.mockReturnValue(baseSnapshot)
    await renderScreen()
    expect(screen.getByText(/Good morning/)).toBeTruthy()
    expect(screen.getByText(/Test/)).toBeTruthy()
  })

  it("shows balance hero with net total", async () => {
    const groupLedger = [{ group: mockGroup, netSignedMinor: 5000 }]
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, groupLedger },
    })
    await renderScreen()
    expect(screen.getByText("Across all your circles")).toBeTruthy()
    expect(screen.getByText("You're owed 5000.00 \u00B7 You owe 0.00")).toBeTruthy()
  })

  it("shows attention rows and routes to friend detail", async () => {
    const attentionRows = [
      { type: "owe" as const, counterpartyId: "u1", user: mockUser, signedAmountMinor: -2000, currency: "USD" },
    ]
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, attentionRows },
    })
    await renderScreen()
    expect(screen.getByText("Needs attention")).toBeTruthy()
    expect(screen.getByText("Alice")).toBeTruthy()
    fireEvent.press(screen.getByText("Alice"))
    expect(mockPush).toHaveBeenCalledWith("/friend/u1")
  })

  it("shows group ledger and routes to group detail", async () => {
    const groupLedger = [{ group: mockGroup, netSignedMinor: 3000 }]
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, groupLedger },
    })
    await renderScreen()
    expect(screen.getByText("Your circles")).toBeTruthy()
    expect(screen.getByText("Trip")).toBeTruthy()
    fireEvent.press(screen.getByText("Trip"))
    expect(mockPush).toHaveBeenCalledWith("/group/g1")
  })

  it("shows schedule row and routes to recurring detail", async () => {
    const nextSchedule = { id: "s1", title: "Rent", nextDueLabel: "In 3 days" } as any
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, nextSchedule },
    })
    await renderScreen()
    expect(screen.getByText("Upcoming")).toBeTruthy()
    fireEvent.press(screen.getByText("Rent"))
    expect(mockPush).toHaveBeenCalledWith("/recurring/s1")
  })

  it("shows recent movement and routes expense to expense detail", async () => {
    const recentMovement = [
      { id: "exp-e1", type: "expense" as const, description: "Dinner", amount: 5000, currency: "USD", date: new Date(), counterpartyName: "Bob" },
    ]
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, recentMovement },
    })
    await renderScreen()
    expect(screen.getByText("Recent movement")).toBeTruthy()
    fireEvent.press(screen.getByText("Dinner"))
    expect(mockPush).toHaveBeenCalledWith("/expense/e1")
  })

  it("shows first-use buttons when isFirstUse is true", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, isFirstUse: true },
    })
    await renderScreen()
    expect(screen.getByText("Create a Group")).toBeTruthy()
    expect(screen.getByText("Add a Person")).toBeTruthy()
    expect(screen.getByText("Add an Expense")).toBeTruthy()
    fireEvent.press(screen.getByText("Create a Group"))
    expect(mockPush).toHaveBeenCalledWith("/group/new")
    fireEvent.press(screen.getByText("Add a Person"))
    expect(mockPush).toHaveBeenCalledWith("/friend/new")
    fireEvent.press(screen.getByText("Add an Expense"))
    expect(mockPush).toHaveBeenCalledWith("/expense/new")
  })

})
