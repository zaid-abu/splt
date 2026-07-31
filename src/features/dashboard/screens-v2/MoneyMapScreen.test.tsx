import { render, fireEvent, screen } from "@testing-library/react-native";
import type { Mock } from "jest-mock";

import MoneyMapScreen from "./MoneyMapScreen";

const mockPush = jest.fn();
jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me", name: "Test User" } }),
}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = {
      isDarkMode: false,
      preferredCurrency: { code: "USD" },
      convertCurrency: (amount: number) => amount,
    };
    return selector(store);
  },
}));

jest.mock("@/components/coral/useCoral", () => ({
  useCoralColors: () => ({
    foreground: "#000",
    muted: "#666",
    accent: "#f0584b",
    accentSoft: "#ffdcd6",
    inkOnAccent: "#fff",
    accentInk: "#5c0e10",
    positive: "#008045",
    negative: "#b61537",
    bg: "#fff",
    surface: "#fff",
    border: "#ddd",
    warning: "#c08500",
    balanceSurface: "#122237",
    balanceForeground: "#f1f6fa",
    avatarSoft: "#d2e8fb",
    avatarInk: "#1b3c5d",
    positiveSoft: "#d0f2dc",
    negativeSoft: "#ffe1e1",
  }),
}));

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: {
      text: "#000",
      muted: "#666",
      brand: "#f0584b",
      border: "#ddd",
      surface: "#fff",
      bg: "#f7f6f1",
      control: "#f0f0f0",
      textInverse: "#fff",
    },
    radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
    space: { xs: 4, sm: 8, md: 12, lg: 16 },
    shadow: { sm: {}, md: {}, lg: {} },
  }),
}));

jest.mock("@/utils/date", () => ({
  getGreeting: () => "Good morning",
}));

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: ({ user, size }: any) => null,
}));

jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: (amount: number) => `${Math.abs(amount).toFixed(2)}`,
}));

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const RN = require("react-native");
  const MockIcon = (props: any) => React.createElement(RN.View, null);
  return new Proxy({}, { get: () => MockIcon });
});

jest.mock("expo-haptics", () => ({
  notificationAsync: jest.fn(),
  impactAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: "light" },
  NotificationFeedbackType: { Success: "success" },
}));

jest.mock("@/components/coral/CoralScreen", () => ({
  CoralScreen: ({ children, scroll }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(RN.View, { testID: "coral-screen" }, children);
  },
}));

jest.mock("@/components/coral/CoralTopBar", () => ({
  CoralTopBar: ({ leftElement, rightElement }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(RN.View, { testID: "coral-topbar" }, leftElement, rightElement);
  },
}));

jest.mock("@/components/coral/LargeTitle", () => ({
  LargeTitle: ({ children }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(RN.Text, { testID: "large-title" }, children);
  },
}));

jest.mock("@/components/coral/Eyebrow", () => ({
  Eyebrow: ({ children }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(RN.Text, { testID: "eyebrow" }, children);
  },
}));

jest.mock("@/components/coral/BalanceHero", () => ({
  BalanceHero: ({ label, value, note, children }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(
      RN.View,
      { testID: "balance-hero" },
      React.createElement(RN.Text, null, label),
      React.createElement(RN.Text, null, value),
      note ? React.createElement(RN.Text, null, note) : null,
      children ?? null
    );
  },
}));

jest.mock("@/components/coral/MoneyRow", () => ({
  MoneyRow: ({ title, subtitle, amount, amountTone, onPress }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(
      RN.Pressable,
      { testID: `money-row-${title}`, onPress, accessibilityRole: "button" },
      React.createElement(RN.Text, null, title),
      subtitle ? React.createElement(RN.Text, null, subtitle) : null,
      amount ? React.createElement(RN.Text, null, amount) : null
    );
  },
}));

jest.mock("@/components/coral/CoralButton", () => ({
  CoralButton: ({ label, onPress, variant }: any) => {
    const React = require("react");
    const RN = require("react-native");
    return React.createElement(
      RN.Pressable,
      { testID: `coral-button-${label}`, onPress, accessibilityRole: "button" },
      React.createElement(RN.Text, null, label)
    );
  },
}));

const mockUseHomeSnapshot = jest.fn();
jest.mock("@/features/dashboard/hooks/useHomeSnapshot", () => ({
  useHomeSnapshot: () => mockUseHomeSnapshot(),
}));

const baseData = {
  circleBalances: [],
  heroBalances: [],
  attentionRows: [],
  groupLedger: [{ group: mockGroup, netSignedMinor: 0 }],
  nextSchedule: undefined,
  recentMovement: [],
  notifications: [],
  isFirstUse: false,
};

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
};

const mockUser = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  initials: "A",
  defaultCurrency: "USD",
  setupState: "complete" as const,
};

const mockGroup = {
  id: "g1",
  name: "Trip",
  currency: "USD",
  icon: "users",
  members: [],
  createdAt: new Date(),
  createdBy: "me",
  totalExpenses: 0,
};

beforeEach(() => {
  jest.clearAllMocks();
});

async function renderScreen() {
  await render(<MoneyMapScreen />);
}

describe("MoneyMapScreen", () => {
  it("shows loading state", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: undefined,
      isInitialLoading: true,
    });
    await renderScreen();
    expect(screen.getByTestId("coral-screen")).toBeTruthy();
  });

  it("shows error state with retry", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: undefined,
      isError: true,
      error: new Error("fail"),
    });
    await renderScreen();
    expect(screen.getByText("Something went wrong")).toBeTruthy();
    await fireEvent.press(screen.getByText("Tap to retry"));
    expect(baseSnapshot.refresh).toHaveBeenCalled();
  });

  it("shows greeting", async () => {
    mockUseHomeSnapshot.mockReturnValue(baseSnapshot);
    await renderScreen();
    expect(screen.getByText(/Good morning/)).toBeTruthy();
    expect(screen.getByText(/Test/)).toBeTruthy();
  });

  it("shows balance hero with net total", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: {
        ...baseData,
        circleBalances: [
          {
            id: "g1",
            type: "group" as const,
            name: "Trip",
            subtitle: "Owed 50.00",
            netSignedMinor: 5000,
            group: mockGroup,
          },
        ],
      },
    });
    await renderScreen();
    expect(screen.getByText("Across your circles")).toBeTruthy();
    expect(screen.getByText("Overall, you are owed money")).toBeTruthy();
  });

  it("shows hero breakdown and additional count when multiple balances exist", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: {
        ...baseData,
        circleBalances: [
          {
            id: "u1",
            type: "person" as const,
            name: "Alice",
            subtitle: "Owed 12.00",
            netSignedMinor: 1200,
            user: mockUser,
          },
          {
            id: "u2",
            type: "person" as const,
            name: "Bob",
            subtitle: "You owe 5.00",
            netSignedMinor: -500,
            user: { ...mockUser, id: "u2", name: "Bob" },
          },
          {
            id: "u3",
            type: "person" as const,
            name: "Cara",
            subtitle: "Owed 3.00",
            netSignedMinor: 300,
            user: { ...mockUser, id: "u3", name: "Cara" },
          },
        ],
      },
    });
    await renderScreen();

    expect(screen.getByText("Alice")).toBeTruthy();
    expect(screen.getByText("Bob")).toBeTruthy();
    expect(screen.getByText("Cara")).toBeTruthy();
  });

  it("shows a person circle and routes to friend detail", async () => {
    const circleBalances = [
      {
        id: "u1",
        type: "person" as const,
        name: "Alice",
        subtitle: "You owe 20.00",
        netSignedMinor: -2000,
        user: mockUser,
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, circleBalances },
    });
    await renderScreen();
    expect(screen.getByText("Where you stand")).toBeTruthy();
    expect(screen.getByText("Alice")).toBeTruthy();
    await fireEvent.press(screen.getByText("Alice"));
    expect(mockPush).toHaveBeenCalledWith("/friend/u1");
  });

  it("shows a group circle and routes to group detail", async () => {
    const circleBalances = [
      {
        id: "g1",
        type: "group" as const,
        name: "Trip",
        subtitle: "Owed 30.00",
        netSignedMinor: 3000,
        group: mockGroup,
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, circleBalances },
    });
    await renderScreen();
    expect(screen.getByText("Where you stand")).toBeTruthy();
    expect(screen.getByText("Trip")).toBeTruthy();
    await fireEvent.press(screen.getByText("Trip"));
    expect(mockPush).toHaveBeenCalledWith("/group/g1");
  });

  it("shows schedule row and routes to recurring detail", async () => {
    const nextSchedule = { id: "s1", title: "Rent", nextDueLabel: "In 3 days" } as any;
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, nextSchedule },
    });
    await renderScreen();
    expect(screen.getByText("Upcoming")).toBeTruthy();
    await fireEvent.press(screen.getByText("Rent"));
    expect(mockPush).toHaveBeenCalledWith("/recurring/s1");
  });

  it("reveals settled circles on demand", async () => {
    const circleBalances = [
      {
        id: "u1",
        type: "person" as const,
        name: "Alice",
        subtitle: "Owed 20.00",
        netSignedMinor: 2000,
        user: mockUser,
      },
      {
        id: "g1",
        type: "group" as const,
        name: "Settled trip",
        subtitle: "Settled",
        netSignedMinor: 0,
        group: mockGroup,
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, circleBalances },
    });
    await renderScreen();
    expect(screen.queryByText("Settled trip")).toBeNull();
    await fireEvent.press(screen.getByTestId("show-settled-circles"));
    expect(screen.getByText("Settled trip")).toBeTruthy();
  });

  it("prefers the next schedule over recent movement when both exist", async () => {
    const nextSchedule = { id: "s1", title: "Rent", nextDueLabel: "In 3 days" } as any;
    const recentMovement = [
      {
        id: "exp-e1",
        type: "expense" as const,
        description: "Dinner",
        amount: 5000,
        currency: "USD",
        date: new Date(),
        counterpartyName: "Bob",
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, nextSchedule, recentMovement },
    });
    await renderScreen();

    expect(screen.getByText("Upcoming")).toBeTruthy();
    expect(screen.queryByText("Recent movement")).toBeNull();
  });

  it("routes a settled group circle to group detail", async () => {
    const circleBalances = [
      {
        id: "g1",
        type: "group" as const,
        name: "Settled trip",
        subtitle: "Settled",
        netSignedMinor: 1000,
        group: mockGroup,
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, circleBalances },
    });
    await renderScreen();
    await fireEvent.press(screen.getByText("Settled trip"));
    expect(mockPush).toHaveBeenCalledWith("/group/g1");
  });

  it("routes a person circle to friend detail", async () => {
    const circleBalances = [
      {
        id: "u2",
        type: "person" as const,
        name: "Bob",
        subtitle: "Owed 12.00",
        netSignedMinor: 1200,
        user: { ...mockUser, id: "u2", name: "Bob" },
      },
    ];
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, circleBalances },
    });
    await renderScreen();
    await fireEvent.press(screen.getByText("Bob"));
    expect(mockPush).toHaveBeenCalledWith("/friend/u2");
  });

  it("shows offline banner when cached data is stale", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      isStaleOffline: true,
      data: { ...baseData, groupLedger: [{ group: mockGroup, netSignedMinor: 5000 }] },
    });
    await renderScreen();

    expect(screen.getByText(/Offline - showing cached data/i)).toBeTruthy();
  });

  it("shows first-use buttons when isFirstUse is true", async () => {
    mockUseHomeSnapshot.mockReturnValue({
      ...baseSnapshot,
      data: { ...baseData, isFirstUse: true },
    });
    await renderScreen();
    expect(screen.getByText("Create Group")).toBeTruthy();
    expect(screen.getByText("Add Person")).toBeTruthy();
    expect(screen.getByText("Add Expense")).toBeTruthy();
    await fireEvent.press(screen.getByText("Create Group"));
    expect(mockPush).toHaveBeenCalledWith("/group/new");
    await fireEvent.press(screen.getByText("Add Person"));
    expect(mockPush).toHaveBeenCalledWith("/friend/new");
    await fireEvent.press(screen.getByText("Add Expense"));
    expect(mockPush).toHaveBeenCalledWith("/expense/new");
  });
});
