import { act, fireEvent, render, screen } from "@testing-library/react-native";
import type { Mock } from "jest-mock";

const mockPush = jest.fn();
const mockSetParams = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({ segment: "groups" }));

jest.mock("expo-router", () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ push: mockPush, setParams: mockSetParams }),
}));

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}));

jest.mock("lucide-react-native", () => {
  const React = require("react");
  const RN = require("react-native");
  const el = React.createElement;
  const MockIcon = (props: any) => el(RN.View, null);
  return { UserPlus: MockIcon, Bell: MockIcon, Search: MockIcon, XCircle: MockIcon };
});

jest.mock("@/features/circles/hooks/useCirclesSnapshot", () => ({
  useCirclesSnapshot: jest.fn(),
}));

jest.mock("@/features/friends/queries/useFriends", () => ({
  useTransitionFriendship: jest.fn(),
}));

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: {
      text: "#000",
      muted: "#666",
      border: "#ddd",
      surface: "#fff",
      bg: "#fff",
      control: "#f0f0f0",
    },
    radius: { sm: 4, md: 8, lg: 12 },
    space: { xs: 4, sm: 8, md: 12, lg: 16 },
    shadow: { sm: {}, md: {}, lg: {} },
  }),
}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { isDarkMode: false, preferredCurrency: { code: "USD" } };
    return selector(store);
  },
}));

jest.mock("@/components/coral", () => {
  const React = require("react");
  const RN = require("react-native");
  return {
    CoralScreen: ({ children }: any) =>
      React.createElement(RN.View, { style: { flex: 1 } }, children),
    CoralTopBar: () => null,
    LargeTitle: ({ children }: any) => React.createElement(RN.Text, null, children),
    Eyebrow: ({ children }: any) => React.createElement(RN.Text, null, children),
    CoralSegment: ({ options, selected, onSelect }: any) =>
      React.createElement(
        RN.View,
        null,
        options.map((o: any) =>
          React.createElement(
            RN.Pressable,
            {
              key: o.value,
              accessibilityRole: "button",
              accessibilityState: { selected: o.value === selected },
              onPress: () => onSelect(o.value),
            },
            React.createElement(RN.Text, null, o.label)
          )
        )
      ),
    CoralSearchField: ({ value, onChangeText, placeholder }: any) =>
      React.createElement(RN.TextInput, { value, onChangeText, placeholder }),
    CoralButton: ({ label, onPress }: any) =>
      React.createElement(
        RN.Pressable,
        { accessibilityRole: "button", onPress },
        React.createElement(RN.Text, null, label)
      ),
    MoneyRow: ({ title, subtitle, amount, onPress, accessibilityLabel }: any) => {
      const accessibleName =
        accessibilityLabel || [title, subtitle, amount].filter(Boolean).join(", ");
      return React.createElement(
        RN.Pressable,
        { accessibilityRole: "button", accessibilityLabel: accessibleName, onPress },
        React.createElement(RN.Text, null, title),
        subtitle ? React.createElement(RN.Text, null, subtitle) : null,
        React.createElement(RN.Text, null, amount)
      );
    },
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
  };
});

jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: jest.fn((amount: number) => `${Math.abs(amount).toFixed(2)}`),
}));

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: () => null,
  AvatarStack: () => null,
}));

jest.mock("@/components/ui/GroupIconBadge", () => ({
  GroupIconBadge: () => null,
}));

// eslint-disable-next-line import/first
import CirclesScreen from "./CirclesScreen";
// eslint-disable-next-line import/first
import { useCirclesSnapshot } from "@/features/circles/hooks/useCirclesSnapshot";
// eslint-disable-next-line import/first
import { useTransitionFriendship } from "@/features/friends/queries/useFriends";
// eslint-disable-next-line import/first
import type {
  GroupSection,
  PersonSection,
  RequestItem,
  CirclesData,
  SnapshotState,
} from "@/features/circles/hooks/useCirclesSnapshot";

const mockGroup1 = {
  id: "g1",
  name: "Lake house",
  icon: "Home",
  currency: "USD",
  members: [{ userId: "u2", user: { id: "u2", name: "Mina", initials: "M" }, balance: 0 }],
  createdAt: new Date("2024-01-01"),
  createdBy: "me",
  totalExpenses: 0,
};

const mockGroup3 = {
  id: "g3",
  name: "Settled group",
  icon: "Home",
  currency: "USD",
  members: [{ userId: "u4", user: { id: "u4", name: "Charlie", initials: "C" }, balance: 0 }],
  createdAt: new Date("2024-01-03"),
  createdBy: "me",
  totalExpenses: 0,
};

const mockPerson1 = {
  id: "u2",
  name: "Mina",
  email: "mina@test.com",
  initials: "M",
  defaultCurrency: "EUR",
  setupState: "complete" as const,
};

const mockPerson2 = {
  id: "u3",
  name: "Bob",
  email: "bob@test.com",
  initials: "B",
  defaultCurrency: "USD",
  setupState: "complete" as const,
};

const mockPerson3 = {
  id: "u5",
  name: "David",
  email: "david@test.com",
  initials: "D",
  defaultCurrency: "GBP",
  setupState: "complete" as const,
};

const mockPerson4 = {
  id: "u6",
  name: "Eve",
  email: "eve@test.com",
  initials: "E",
  defaultCurrency: "USD",
  setupState: "complete" as const,
};

const mockRequester = {
  id: "requester",
  name: "New Friend",
  email: "new@test.com",
  initials: "NF",
  defaultCurrency: "USD",
  setupState: "complete" as const,
};

function makeSnapshot(
  overrides: Partial<SnapshotState<CirclesData>> = {}
): SnapshotState<CirclesData> {
  return {
    data: undefined,
    isInitialLoading: false,
    isRefreshing: false,
    isStaleOffline: false,
    isError: false,
    error: null,
    isNotFound: false,
    isRestricted: false,
    refresh: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SnapshotState<CirclesData>;
}

const mockMutateAsync = jest.fn().mockResolvedValue(undefined);

beforeEach(() => {
  jest.clearAllMocks();
  mockUseLocalSearchParams.mockReturnValue({ segment: "groups" });
  (useTransitionFriendship as Mock).mockReturnValue({ mutateAsync: mockMutateAsync });
});

describe("CirclesScreen", () => {
  // ── 1. URL-backed segment switching ─────────────────────────────────────
  describe("segment switching", () => {
    it("defaults to groups segment", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot());
      await render(<CirclesScreen />);
      expect(screen.getByPlaceholderText("Search groups")).toBeTruthy();
    });

    it("reads segment from URL params", async () => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot());
      await render(<CirclesScreen />);
      expect(screen.getByPlaceholderText("Search people")).toBeTruthy();
    });

    it("calls router.setParams when segment is pressed", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot());
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: "People" }));
      expect(mockSetParams).toHaveBeenCalledWith({ segment: "people" });
    });
  });

  // ── 2. Pending requests with accept/decline ────────────────────────────
  describe("pending requests", () => {
    const pendingRequest: RequestItem = {
      friendship: {
        id: "f-pending",
        userId: "requester",
        friendId: "me",
        status: "pending",
        requestedBy: "requester",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      user: mockRequester,
    };

    const hasRequestsData: CirclesData = {
      pendingRequests: [pendingRequest],
      groupSections: [],
      personSections: [],
    };

    it("renders request rows with accept and decline buttons", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: hasRequestsData }));
      await render(<CirclesScreen />);

      expect(screen.getByText("Friend requests")).toBeTruthy();
      expect(screen.getByText("New Friend")).toBeTruthy();
      expect(screen.getByText("Wants to be friends")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Accept" })).toBeTruthy();
      expect(screen.getByRole("button", { name: "Decline" })).toBeTruthy();
    });

    it("calls accept mutation when Accept is pressed", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: hasRequestsData }));
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: "Accept" }));
      expect(mockMutateAsync).toHaveBeenCalledWith({
        counterpartyId: "f-pending",
        action: "accept",
      });
    });

    it("calls decline mutation when Decline is pressed", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: hasRequestsData }));
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: "Decline" }));
      expect(mockMutateAsync).toHaveBeenCalledWith({
        counterpartyId: "f-pending",
        action: "decline",
      });
    });
  });

  // ── 3. Needs Attention and All Groups sections ─────────────────────────
  describe("group sections", () => {
    const needsAttentionSection: GroupSection = {
      group: mockGroup1,
      balance: {
        counterpartyId: "me",
        context: { type: "group", groupId: "g1" },
        currency: "USD",
        signedAmountMinor: -1250,
        lastActivityAt: new Date(),
      },
    };

    const settledSection: GroupSection = {
      group: mockGroup3,
      balance: null,
    };

    const groupsData: CirclesData = {
      pendingRequests: [],
      groupSections: [needsAttentionSection, settledSection],
      personSections: [],
    };

    it("renders Needs Attention section with non-settled groups", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: groupsData }));
      await render(<CirclesScreen />);

      expect(screen.getByText("Needs attention")).toBeTruthy();
      expect(screen.getByText("All groups")).toBeTruthy();
      expect(screen.getByText("Lake house")).toBeTruthy();
      expect(screen.getByText("Settled group")).toBeTruthy();
    });

    it("navigates to group detail on row press", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: groupsData }));
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: /Lake house.*active/i }));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/group/[id]",
        params: { id: "g1" },
      });
    });
  });

  // ── 4. Person sections (Mixed/Owes You/You Owe/Settled) ────────────────
  describe("person sections", () => {
    const owesYouSection: PersonSection = {
      user: mockPerson1,
      friendship: null,
      classification: "owes-you",
      topBalance: {
        counterpartyId: "me",
        context: { type: "direct", friendshipId: "f1" },
        currency: "EUR",
        signedAmountMinor: 400,
        lastActivityAt: new Date(),
      },
      sharedGroupCount: 1,
      topBalanceContextLabel: "EIPP eipp",
      lastActivityAt: new Date(),
    };

    const youOweSection: PersonSection = {
      user: mockPerson2,
      friendship: null,
      classification: "you-owe",
      topBalance: {
        counterpartyId: "me",
        context: { type: "direct", friendshipId: "f2" },
        currency: "USD",
        signedAmountMinor: -2000,
        lastActivityAt: new Date(),
      },
      sharedGroupCount: 1,
      topBalanceContextLabel: "Apartment",
      lastActivityAt: new Date(),
    };

    const mixedSection: PersonSection = {
      user: mockPerson3,
      friendship: null,
      classification: "mixed",
      topBalance: {
        counterpartyId: "me",
        context: { type: "direct", friendshipId: "f3" },
        currency: "GBP",
        signedAmountMinor: 1500,
        lastActivityAt: new Date(),
      },
      sharedGroupCount: 2,
      topBalanceContextLabel: null,
      lastActivityAt: new Date(),
    };

    const settledSection: PersonSection = {
      user: mockPerson4,
      friendship: null,
      classification: "settled",
      topBalance: null,
      sharedGroupCount: 2,
      topBalanceContextLabel: null,
      lastActivityAt: null,
    };

    const peopleData: CirclesData = {
      pendingRequests: [],
      groupSections: [],
      personSections: [owesYouSection, mixedSection, youOweSection, settledSection],
    };

    beforeEach(() => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: peopleData }));
    });

    it("renders all four section headers", async () => {
      await render(<CirclesScreen />);
      expect(screen.getByText("Owes you")).toBeTruthy();
      expect(screen.getByText("Mixed")).toBeTruthy();
      expect(screen.getByText("You owe")).toBeTruthy();
      expect(screen.getAllByText("Settled").length).toBeGreaterThanOrEqual(1);
    });

    it("renders person rows with correct names", async () => {
      await render(<CirclesScreen />);
      expect(screen.getByText("Mina")).toBeTruthy();
      expect(screen.getByText("Bob")).toBeTruthy();
      expect(screen.getByText("David")).toBeTruthy();
      expect(screen.getByText("Eve")).toBeTruthy();
    });

    it("navigates to friend detail on row press", async () => {
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: /Mina.*owes you.*EUR 4.00/i }));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/friend/[id]",
        params: { id: "u2" },
      });
    });

    it("navigates for you-owe person", async () => {
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: /Bob.*You owe from Apartment/i }));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/friend/[id]",
        params: { id: "u3" },
      });
    });

    it("renders Mixed balance subtitle for mixed classification", async () => {
      await render(<CirclesScreen />);
      expect(screen.getByText("Mixed balance")).toBeTruthy();
    });

    it("renders Settled for settled classification", async () => {
      await render(<CirclesScreen />);
      expect(screen.getAllByText("Settled").length).toBeGreaterThanOrEqual(1);
    });
  });

  // ── 5. Detail-only row navigation (no settle/remind) ──────────────────
  describe("detail-only navigation", () => {
    it("group row navigates to /group/[id]", async () => {
      const section: GroupSection = {
        group: mockGroup1,
        balance: {
          counterpartyId: "me",
          context: { type: "group", groupId: "g1" },
          currency: "USD",
          signedAmountMinor: 500,
          lastActivityAt: new Date(),
        },
      };
      const data: CirclesData = {
        pendingRequests: [],
        groupSections: [section],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data }));
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: /Lake house.*active/i }));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/group/[id]",
        params: { id: "g1" },
      });
    });

    it("person row navigates to /friend/[id]", async () => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      const section: PersonSection = {
        user: mockPerson1,
        friendship: null,
        classification: "owes-you",
        topBalance: {
          counterpartyId: "me",
          context: { type: "direct", friendshipId: "f1" },
          currency: "EUR",
          signedAmountMinor: 400,
          lastActivityAt: new Date(),
        },
        sharedGroupCount: 1,
        topBalanceContextLabel: "EIPP eipp",
        lastActivityAt: new Date(),
      };
      const data: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [section],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data }));
      await render(<CirclesScreen />);

      fireEvent.press(screen.getByRole("button", { name: /Mina.*owes you.*EUR 4.00/i }));
      expect(mockPush).toHaveBeenCalledWith({
        pathname: "/friend/[id]",
        params: { id: "u2" },
      });
    });
  });

  // ── 6. States: loading, error, first-use empty, filtered-empty ─────────
  describe("loading state", () => {
    it("shows activity indicator while loading", async () => {
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ isInitialLoading: true }));
      await render(<CirclesScreen />);

      const loader = screen.getByLabelText("Loading groups");
      expect(loader).toBeTruthy();
    });
  });

  describe("error state", () => {
    it("shows error message and retry button when no data", async () => {
      const refreshMock = jest.fn().mockResolvedValue(undefined);
      (useCirclesSnapshot as Mock).mockReturnValue(
        makeSnapshot({
          isError: true,
          error: new Error("Network error"),
          data: undefined,
          refresh: refreshMock,
        })
      );
      await render(<CirclesScreen />);

      expect(screen.getByText("Could not load groups.")).toBeTruthy();
      expect(screen.getByRole("button", { name: "Try again" })).toBeTruthy();

      fireEvent.press(screen.getByRole("button", { name: "Try again" }));
      expect(refreshMock).toHaveBeenCalled();
    });
  });

  describe("first-use empty state", () => {
    it("shows empty groups message", async () => {
      const emptyData: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: emptyData }));
      await render(<CirclesScreen />);

      expect(screen.getByText("No groups yet.")).toBeTruthy();
    });

    it("shows empty people message", async () => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      const emptyData: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: emptyData }));
      await render(<CirclesScreen />);

      expect(screen.getByText("No people yet.")).toBeTruthy();
    });
  });

  describe("filtered-empty state", () => {
    it("shows no groups match message when search yields no results", async () => {
      const emptyData: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(
        makeSnapshot({
          data: emptyData,
        })
      );
      await render(<CirclesScreen />);

      const searchInput = screen.getByPlaceholderText("Search groups");
      await act(async () => {
        fireEvent.changeText(searchInput, "nonexistent");
      });

      expect(screen.getByText("No groups match your search.")).toBeTruthy();
    });

    it("shows no people match message on people segment", async () => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      const emptyData: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data: emptyData }));
      await render(<CirclesScreen />);

      const searchInput = screen.getByPlaceholderText("Search people");
      await act(async () => {
        fireEvent.changeText(searchInput, "nonexistent");
      });

      expect(screen.getByText("No people match your search.")).toBeTruthy();
    });
  });

  // ── 7. Separate currency amounts displayed ────────────────────────────
  describe("currency amounts", () => {
    it("displays signed amounts with currency codes for groups", async () => {
      const section: GroupSection = {
        group: mockGroup1,
        balance: {
          counterpartyId: "me",
          context: { type: "group", groupId: "g1" },
          currency: "USD",
          signedAmountMinor: -1250,
          lastActivityAt: new Date(),
        },
      };
      const data: CirclesData = {
        pendingRequests: [],
        groupSections: [section],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data }));
      await render(<CirclesScreen />);

      const row = screen.getByRole("button", { name: /USD 12.50/i });
      expect(row).toBeTruthy();
    });

    it("displays signed amounts with currency codes for people", async () => {
      mockUseLocalSearchParams.mockReturnValue({ segment: "people" });
      const section: PersonSection = {
        user: mockPerson1,
        friendship: null,
        classification: "owes-you",
        topBalance: {
          counterpartyId: "me",
          context: { type: "direct", friendshipId: "f1" },
          currency: "EUR",
          signedAmountMinor: 400,
          lastActivityAt: new Date(),
        },
      };
      const data: CirclesData = {
        pendingRequests: [],
        groupSections: [],
        personSections: [section],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(makeSnapshot({ data }));
      await render(<CirclesScreen />);

      const row = screen.getByRole("button", { name: /EUR 4.00/i });
      expect(row).toBeTruthy();
    });
  });

  // ── Stale-offline state ────────────────────────────────────────────────
  describe("stale-offline state", () => {
    it("renders cached data when error but data exists", async () => {
      const section: GroupSection = {
        group: mockGroup1,
        balance: null,
      };
      const staleData: CirclesData = {
        pendingRequests: [],
        groupSections: [section],
        personSections: [],
      };
      (useCirclesSnapshot as Mock).mockReturnValue(
        makeSnapshot({
          data: staleData,
          isError: true,
          isStaleOffline: true,
        })
      );
      await render(<CirclesScreen />);

      expect(screen.getByText("Lake house")).toBeTruthy();
      expect(screen.getByText("All groups")).toBeTruthy();
    });
  });
});
