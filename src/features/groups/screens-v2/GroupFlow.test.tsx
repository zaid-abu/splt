import { act, fireEvent, render, screen } from "@testing-library/react-native"
import type { Mock } from "jest-mock"

const mockReplace = jest.fn()
const mockPush = jest.fn()
const mockBack = jest.fn()
const mockSetParams = jest.fn()
const mockCanGoBack = jest.fn(() => false)
const mockUseLocalSearchParams = jest.fn(() => ({}))

jest.mock("expo-router", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush, back: mockBack, setParams: mockSetParams, canGoBack: mockCanGoBack }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useCreateGroup: jest.fn(),
}))

jest.mock("@/features/friends/queries/useFriends", () => ({
  useFriends: jest.fn(() => ({ data: [] })),
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
}))

jest.mock("@/components/coral/CoralScreen", () => ({
  CoralScreen: ({ children }: any) => require("react").createElement(require("react-native").View, { style: { flex: 1 } }, children),
}))

jest.mock("@/components/coral/CoralTopBar", () => ({
  CoralTopBar: () => null,
}))

jest.mock("@/components/coral/CoralField", () => ({
  CoralField: require("react").forwardRef(({ value, onChangeText }: any, _ref: any) =>
    require("react").createElement(require("react-native").TextInput, {
      value,
      onChangeText,
      accessibilityLabel: "Group name",
    })
  ),
}))

jest.mock("@/components/coral/CoralButton", () => ({
  CoralButton: ({ label, onPress, disabled, loading }: any) =>
    require("react").createElement(
      require("react-native").Pressable,
      { accessibilityRole: "button", accessibilityLabel: label, onPress, disabled: disabled || loading },
      require("react").createElement(require("react-native").Text, null, label)
    ),
}))

jest.mock("@/components/coral/CoralSelect", () => ({
  CoralSelect: () => require("react").createElement(require("react-native").View, null),
}))

jest.mock("@/components/coral/Eyebrow", () => ({
  Eyebrow: ({ children }: any) => require("react").createElement(require("react-native").Text, null, children),
}))

jest.mock("@/components/coral/MoneyRow", () => ({
  MoneyRow: ({ title, subtitle, amount, onPress, accessibilityLabel }: any) => {
    const accessibleName = accessibilityLabel || [title, subtitle, amount].filter(Boolean).join(", ")
    return require("react").createElement(
      require("react-native").Pressable,
      { accessibilityRole: "button", accessibilityLabel: accessibleName, onPress },
      require("react").createElement(require("react-native").Text, null, title),
      subtitle ? require("react").createElement(require("react-native").Text, null, subtitle) : null,
      amount ? require("react").createElement(require("react-native").Text, null, amount) : null
    )
  },
}))

jest.mock("@/components/coral/CoralSnackbar", () => ({
  CoralSnackbar: () => null,
}))

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: {
      text: "#000",
      textStrong: "#1a1a1a",
      textInverse: "#fff",
      muted: "#666",
      border: "#ddd",
      surface: "#fff",
      bg: "#f7f6f1",
      control: "#f0f0f0",
      subtle: "#f5f5f5",
    },
    radius: { sm: 4, md: 8, lg: 12, pill: 9999 },
    space: { xs: 4, sm: 8, md: 12, lg: 16 },
    shadow: { sm: {}, md: {}, lg: {} },
  }),
  SectionLabel: () => null,
  EmptyState: () => null,
  LIGHT_COLORS: {},
  DARK_COLORS: {},
  RADIUS: {},
  SPACE: {},
  SHADOW: {},
}))

jest.mock("expo-blur", () => ({
  BlurTargetView: ({ children }: any) => children,
  BlurView: ({ children }: any) => children,
}))

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}))

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: () => null,
  AvatarStack: () => null,
}))

jest.mock("@/components/ui/GroupIconBadge", () => ({
  GroupIconBadge: () => null,
}))

jest.mock("@/components/ui/AmountDisplay", () => ({
  formatAmount: jest.fn((amount: number) => `${Math.abs(amount).toFixed(2)}`),
}))

jest.mock("@/components/coral/LargeTitle", () => ({
  LargeTitle: ({ children }: any) => require("react").createElement(require("react-native").Text, null, children),
}))

jest.mock("@/components/coral/CoralSegment", () => ({
  CoralSegment: ({ options, selected, onSelect }: any) =>
    require("react").createElement(
      require("react-native").View,
      null,
      options.map((o: any) =>
        require("react").createElement(
          require("react-native").Pressable,
          {
            key: o.value,
            accessibilityRole: "button",
            accessibilityState: { selected: o.value === selected },
            onPress: () => onSelect(o.value),
          },
          require("react").createElement(require("react-native").Text, null, o.label)
        )
      )
    ),
}))

jest.mock("@/components/coral/StatPair", () => ({
  StatPair: ({ left, right }: any) =>
    require("react").createElement(require("react-native").Text, null, `${left.value} ${right.value}`),
}))

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: () => null,
  BottomSheetBackdrop: () => null,
  BottomSheetTextInput: () => null,
}))

jest.mock("@/features/groups/components/UserSearchBottomSheet", () => {
  const React = require("react")
  const RN = require("react-native")
  const { forwardRef } = React

  const users: Record<string, { id: string; name: string; email: string }> = {
    u1: { id: "u1", name: "Alice", email: "alice@test.com" },
    u2: { id: "u2", name: "Bob", email: "bob@test.com" },
    u3: { id: "u3", name: "Charlie", email: "charlie@test.com" },
  }

  const UserSearchBottomSheet = forwardRef(
    ({ onSelect, excludeUserIds = [] }: any, _ref: any) => {
      const onSelectUser = (userId: string) => {
        const user = users[userId]
        if (user && !excludeUserIds.includes(userId)) {
          onSelect(user)
        }
      }
      return React.createElement(
        RN.View,
        { accessibilityLabel: "user-search-sheet" },
        Object.entries(users)
          .filter(([id]) => !excludeUserIds.includes(id))
          .map(([id, user]) =>
            React.createElement(
              RN.Pressable,
              {
                key: id,
                accessibilityRole: "button",
                accessibilityLabel: `select-user-${id}`,
                onPress: () => onSelectUser(id),
              },
              React.createElement(RN.Text, null, user.name)
            )
          )
      )
    },
  )
  UserSearchBottomSheet.displayName = "UserSearchBottomSheet"
  return { UserSearchBottomSheet }
})

jest.mock("@/components/dialogs/ConfirmationSheet", () => {
  const React = require("react")
  const RN = require("react-native")
  return {
    ConfirmationSheet: ({ title, description, confirmLabel, onConfirm }: any) =>
      React.createElement(
        RN.View, null,
        React.createElement(RN.Text, null, title),
        React.createElement(RN.Text, null, description),
        React.createElement(
          RN.Pressable,
          { accessibilityRole: "button", accessibilityLabel: "confirm-" + (confirmLabel || "Delete"), onPress: onConfirm },
          React.createElement(RN.Text, null, confirmLabel || "Delete")
        )
      ),
  }
})

jest.mock("@/features/groups/hooks/useGroupSettings", () => ({
  useGroupSettings: jest.fn(),
}))

import NewGroupScreen from "./NewGroupScreen"
import { useCreateGroup } from "@/features/groups/queries/useGroups"

const mockMutateAsync = jest.fn()
const mockUuid1 = "00000000-0000-0000-0000-000000000001"

beforeEach(() => {
  jest.clearAllMocks()
  mockUseLocalSearchParams.mockReturnValue({})
  ;(useCreateGroup as Mock).mockReturnValue({
    mutateAsync: mockMutateAsync,
    isPending: false,
  })
  jest.spyOn(crypto, "randomUUID").mockReturnValueOnce(mockUuid1)
})

describe("creates group atomically", () => {
  it("selects users with no pre-submit side effects", async () => {
    await render(<NewGroupScreen />)

    expect(mockMutateAsync).not.toHaveBeenCalled()

    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u1"))
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Alice/)).toBeTruthy()

    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u2"))
    })
    expect(mockMutateAsync).not.toHaveBeenCalled()
    expect(screen.getByLabelText(/Bob/)).toBeTruthy()
  })

  it("calls create_group_v2 once with stable operationId on double press", async () => {
    const resolvedGroup = { id: "g-1", name: "Trip" }
    mockMutateAsync.mockResolvedValue(resolvedGroup)

    await render(<NewGroupScreen />)

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Group name"), "Trip")
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u1"))
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u2"))
    })

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Create group"))
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("Create group"))
    })

    expect(mockMutateAsync).toHaveBeenCalled()
    expect(mockMutateAsync.mock.calls[0][0]).toMatchObject({
      clientOperationId: mockUuid1,
      name: "Trip",
      icon: "Home",
      currency: "USD",
      inviteeIds: ["u1", "u2"],
    })
  })

  it("retains field values after rejection", async () => {
    mockMutateAsync.mockRejectedValueOnce(new Error("RPC failed"))

    await render(<NewGroupScreen />)

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Group name"), "Camping")
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u1"))
    })

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Create group"))
    })

    expect(screen.getByDisplayValue("Camping")).toBeTruthy()
    expect(screen.getByLabelText(/Alice/)).toBeTruthy()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("navigates to group detail on success", async () => {
    const resolvedGroup = { id: "g-42", name: "Trip" }
    mockMutateAsync.mockResolvedValue(resolvedGroup)

    await render(<NewGroupScreen />)

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Group name"), "Trip")
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u1"))
    })

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Create group"))
    })

    expect(mockReplace).toHaveBeenCalledWith("/group/g-42")
  })

  it("navigates to expense/new when resume=expense", async () => {
    mockUseLocalSearchParams.mockReturnValue({ resume: "expense" })
    const resolvedGroup = { id: "g-7", name: "Trip" }
    mockMutateAsync.mockResolvedValue(resolvedGroup)

    await render(<NewGroupScreen />)

    await act(async () => {
      fireEvent.changeText(screen.getByLabelText("Group name"), "Trip")
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("select-user-u1"))
    })

    await act(async () => {
      fireEvent.press(screen.getByLabelText("Create group"))
    })

    expect(mockReplace).toHaveBeenCalledWith({
      pathname: "/expense/new",
      params: { groupId: "g-7" },
    })
  })
})

// ── Detail screen (Task 14) ────────────────────────────────────────────────

jest.mock("@/features/groups/hooks/useGroupSnapshot", () => ({
  useGroupSnapshot: jest.fn(),
}))

import GroupDetailScreen from "./GroupDetailScreen"
import { useGroupSnapshot } from "@/features/groups/hooks/useGroupSnapshot"
import type { Mock } from "jest-mock"
import type { GroupSnapshotData, SnapshotState } from "@/features/groups/hooks/useGroupSnapshot"
import type { OpenBalance } from "@/features/money/types"
import type { Expense, User, Group } from "@/types"

const mockUser: User = {
  id: "u1",
  name: "Alice",
  email: "alice@test.com",
  initials: "A",
  defaultCurrency: "USD",
  setupState: "complete",
}

const mockUser2: User = {
  id: "u2",
  name: "Bob",
  email: "bob@test.com",
  initials: "B",
  defaultCurrency: "USD",
  setupState: "complete",
}

const mockGroup: Group = {
  id: "g-1",
  name: "Trip",
  icon: "Home",
  currency: "USD",
  members: [
    { userId: "me", user: { ...mockUser, id: "me", name: "You" }, balance: 0 },
    { userId: "u1", user: mockUser, balance: 0 },
    { userId: "u2", user: mockUser2, balance: 0 },
  ],
  createdAt: new Date(),
  createdBy: "me",
  totalExpenses: 0,
}

const mockExpense: Expense = {
  id: "e1",
  groupId: "g-1",
  title: "Dinner",
  amount: 60,
  amountMinor: 6000,
  currency: "USD",
  category: "food",
  paidBy: "me",
  paidByUser: { ...mockUser, id: "me", name: "You" },
  createdBy: "me",
  splits: [
    { userId: "me", user: { ...mockUser, id: "me", name: "You" }, amount: 20, amountMinor: 2000, position: 0, paid: true },
    { userId: "u1", user: mockUser, amount: 20, amountMinor: 2000, position: 1, paid: true },
    { userId: "u2", user: mockUser2, amount: 20, amountMinor: 2000, position: 2, paid: true },
  ],
  splitMethod: "equal",
  date: new Date(),
  createdAt: new Date(),
}

const mockBalances: OpenBalance[] = [
  { counterpartyId: "u1", context: { type: "group", groupId: "g-1" }, currency: "USD", signedAmountMinor: 2000, lastActivityAt: new Date() },
  { counterpartyId: "u2", context: { type: "group", groupId: "g-1" }, currency: "USD", signedAmountMinor: -1000, lastActivityAt: new Date() },
]

function makeSnapshot(
  overrides: Partial<SnapshotState<GroupSnapshotData>> = {}
): SnapshotState<GroupSnapshotData> {
  return {
    data: {
      group: mockGroup,
      permissions: { canEdit: true, canDelete: false },
      balances: mockBalances,
      members: mockGroup.members,
      expenses: [mockExpense],
      scheduleSections: { needsReview: [], active: [], paused: [] },
      invitations: [],
      recentActivity: [],
    },
    isInitialLoading: false,
    isRefreshing: false,
    isStaleOffline: false,
    isError: false,
    error: null,
    isNotFound: false,
    isRestricted: false,
    refresh: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as SnapshotState<GroupSnapshotData>
}

describe("detail screen with snapshot views", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1" })
  })

  it("renders loading state when initialLoading", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot({ isInitialLoading: true, data: undefined }))
    await render(<GroupDetailScreen />)
    expect(screen.queryByText("Trip")).toBeNull()
    expect(screen.queryByText("Balances")).toBeNull()
  })

  it("renders not-found state", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot({ isNotFound: true, data: undefined }))
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Group not found")).toBeTruthy()
  })

  it("renders error state with retry", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot({ isError: true, data: undefined, error: new Error("fail") }))
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Something went wrong")).toBeTruthy()
    fireEvent.press(screen.getByText("Tap to retry"))
  })

  it("defaults to overview when view param is unknown", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1", view: "unknown" })
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Balances")).toBeTruthy()
  })

  it("selecting Expenses calls router.setParams", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    fireEvent.press(screen.getByRole("button", { name: "Expenses" }))
    expect(mockSetParams).toHaveBeenCalledWith({ view: "expenses" })
  })

  it("shows open balance rows for members with non-zero balance", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Alice")).toBeTruthy()
    expect(screen.getByText(/Owes/)).toBeTruthy()
  })

  it("pairwise person row navigates to /friend/[id]", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    fireEvent.press(screen.getByText("Alice"))
    expect(mockPush).toHaveBeenCalledWith("/friend/u1")
  })

  it("renders expense rows in overview", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Dinner")).toBeTruthy()
  })

  it("expenses view shows all expenses with share info", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1", view: "expenses" })
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Dinner")).toBeTruthy()
  })

  it("schedule view shows empty state when no recurring expenses", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1", view: "schedule" })
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    expect(screen.getByText("No recurring expenses")).toBeTruthy()
  })

  it("schedule view renders recurring rows", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1", view: "schedule" })
    ;(useGroupSnapshot as Mock).mockReturnValue(
      makeSnapshot({
        data: {
          group: mockGroup,
          permissions: { canEdit: true, canDelete: false },
          balances: mockBalances,
          members: mockGroup.members,
          expenses: [mockExpense],
          scheduleSections: {
            needsReview: [{
              id: "s1",
              recurringId: "r1",
              groupId: "g-1",
              state: "needs-review" as const,
              scheduledDate: "2025-01-15",
              href: { pathname: "/recurring/[id]", params: { id: "r1" } },
            }],
            active: [],
            paused: [],
          },
          invitations: [],
          recentActivity: [],
        },
      })
    )
    await render(<GroupDetailScreen />)
    expect(screen.getByText("Needs Review")).toBeTruthy()
  })

  it("multi-currency group hides combined StatPair", async () => {
    const multiCurrencyBalances: OpenBalance[] = [
      { counterpartyId: "u1", context: { type: "group", groupId: "g-1" }, currency: "USD", signedAmountMinor: 2000, lastActivityAt: new Date() },
      { counterpartyId: "u2", context: { type: "group", groupId: "g-1" }, currency: "EUR", signedAmountMinor: 1500, lastActivityAt: new Date() },
    ]
    ;(useGroupSnapshot as Mock).mockReturnValue(
      makeSnapshot({
        data: {
          group: mockGroup,
          permissions: { canEdit: true, canDelete: false },
          balances: multiCurrencyBalances,
          members: mockGroup.members,
          expenses: [mockExpense],
          scheduleSections: { needsReview: [], active: [], paused: [] },
          invitations: [],
          recentActivity: [],
        },
      })
    )
    await render(<GroupDetailScreen />)
    expect(screen.queryByText("You're owed")).toBeNull()
    expect(screen.queryByText("You owe")).toBeNull()
  })

  it("add expense button navigates with group ID", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot())
    await render(<GroupDetailScreen />)
    fireEvent.press(screen.getByLabelText("Add an expense"))
    expect(mockPush).toHaveBeenCalledWith("/expense/new?groupId=g-1")
  })

  it("shows stale offline banner when isStaleOffline", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot({ isStaleOffline: true }))
    await render(<GroupDetailScreen />)
    expect(screen.getByText(/Offline/)).toBeTruthy()
  })

  it("shows restricted banner when isRestricted", async () => {
    ;(useGroupSnapshot as Mock).mockReturnValue(makeSnapshot({ isRestricted: true }))
    await render(<GroupDetailScreen />)
    expect(screen.getByText(/View-only/)).toBeTruthy()
  })
})

// ── Settings screen (Task 15) ──────────────────────────────────────────────

import GroupSettingsScreen from "./GroupSettingsScreen"
import { useGroupSettings } from "@/features/groups/hooks/useGroupSettings"
import type { Mock } from "jest-mock"

function makeSettings(overrides: Record<string, any> = {}) {
  const base = {
    group: {
      id: "g-1",
      name: "Trip",
      icon: "Plane",
      currency: "USD",
      simplifyDebts: false,
      defaultSplitMethod: "equal" as const,
      description: "Summer trip",
      members: [
        { userId: "me", user: { id: "me", name: "You", email: "you@test.com" }, balance: 0, newExpenseAlerts: true },
        { userId: "u1", user: { id: "u1", name: "Alice", email: "alice@test.com" }, balance: 0 },
      ],
      createdBy: "me",
      createdAt: new Date(),
      totalExpenses: 0,
    },
    name: "Trip",
    setName: jest.fn(),
    nameError: "",
    setNameError: jest.fn(),
    description: "Summer trip",
    setDescription: jest.fn(),
    icon: "Plane",
    setIcon: jest.fn(),
    currencyCode: "USD",
    setCurrencyCode: jest.fn(),
    simplifyDebts: false,
    setSimplifyDebts: jest.fn(),
    defaultSplitMethod: "equal",
    setDefaultSplitMethod: jest.fn(),
    newExpenseAlerts: true,
    setNewExpenseAlerts: jest.fn(),
    loading: false,
    isLoading: false,
    friends: [],
    balances: new Map(),
    permissions: {
      canEdit: true,
      canDelete: true,
      canLeave: false,
      canRemoveMember: () => true,
      canAddMember: true,
    },
    currentMember: {
      userId: "me",
      user: { id: "me", name: "You", email: "you@test.com" },
      balance: 0,
      newExpenseAlerts: true,
    },
    blockingBalances: [] as { userId: string; userName: string; amount: number }[],
    deleteSheetRef: { current: null },
    leaveSheetRef: { current: null },
    removeMemberSheetRef: { current: null },
    searchSheetRef: { current: null },
    memberToRemove: null,
    handleSave: jest.fn(),
    handleRemoveMemberClick: jest.fn(),
    confirmRemoveMember: jest.fn(),
    handleAddMember: jest.fn(),
    handleDeleteGroup: jest.fn(),
    handleLeaveGroup: jest.fn(),
    handleBack: jest.fn(),
  }
  return { ...base, ...overrides }
}

describe("settings screen", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseLocalSearchParams.mockReturnValue({ id: "g-1" })
  })

  it("initializes fields after group hydrates", async () => {
    ;(useGroupSettings as Mock).mockReturnValue(makeSettings())
    await render(<GroupSettingsScreen />)
    expect(screen.getByText("Identity")).toBeTruthy()
    expect(screen.getByText("Finance")).toBeTruthy()
    expect(screen.getByText("Save Changes")).toBeTruthy()
  })

  it("shows creator-only identity and archive controls", async () => {
    ;(useGroupSettings as Mock).mockReturnValue(makeSettings())
    await render(<GroupSettingsScreen />)
    expect(screen.getByText("Identity")).toBeTruthy()
    expect(screen.getByText('Delete "Trip"')).toBeTruthy()
    expect(screen.queryByText("Leave group")).toBeNull()
  })

  it("hides identity controls and shows leave for non-creator member", async () => {
    ;(useGroupSettings as Mock).mockReturnValue(
      makeSettings({
        permissions: {
          canEdit: false,
          canDelete: false,
          canLeave: true,
          canRemoveMember: () => false,
          canAddMember: false,
        },
      })
    )
    await render(<GroupSettingsScreen />)
    expect(screen.queryByText("Identity")).toBeNull()
    expect(screen.queryByText("Save Changes")).toBeNull()
    expect(screen.queryByText('Delete "Trip"')).toBeNull()
    expect(screen.getByText("Leave group")).toBeTruthy()
    expect(screen.getByText("New expense alerts")).toBeTruthy()
  })

  it("blocks leave for creator", async () => {
    ;(useGroupSettings as Mock).mockReturnValue(
      makeSettings({
        permissions: {
          canEdit: true,
          canDelete: true,
          canLeave: false,
          canRemoveMember: () => true,
          canAddMember: true,
        },
      })
    )
    await render(<GroupSettingsScreen />)
    expect(screen.getByText('Delete "Trip"')).toBeTruthy()
    expect(screen.queryByText("Leave group")).toBeNull()
  })

  it("save stays on same group", async () => {
    const saveFn = jest.fn()
    ;(useGroupSettings as Mock).mockReturnValue(makeSettings({ handleSave: saveFn }))
    await render(<GroupSettingsScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText("Save Changes"))
    })
    expect(saveFn).toHaveBeenCalled()
    expect(mockReplace).not.toHaveBeenCalled()
  })

  it("archive navigates to circles groups segment", async () => {
    const archiveFn = jest.fn(() => {
      mockReplace("/circles?segment=groups")
      return Promise.resolve()
    })
    ;(useGroupSettings as Mock).mockReturnValue(makeSettings({ handleDeleteGroup: archiveFn }))
    await render(<GroupSettingsScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('Delete "Trip"'))
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("confirm-Delete"))
    })
    expect(archiveFn).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith("/circles?segment=groups")
  })

  it("leave navigates to circles groups segment", async () => {
    const leaveFn = jest.fn(() => {
      mockReplace("/circles?segment=groups")
      return Promise.resolve()
    })
    ;(useGroupSettings as Mock).mockReturnValue(
      makeSettings({
        permissions: {
          canEdit: false,
          canDelete: false,
          canLeave: true,
          canRemoveMember: () => false,
          canAddMember: false,
        },
        handleLeaveGroup: leaveFn,
      })
    )
    await render(<GroupSettingsScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText("Leave group"))
    })
    await act(async () => {
      fireEvent.press(screen.getByLabelText("confirm-Leave"))
    })
    expect(leaveFn).toHaveBeenCalled()
    expect(mockReplace).toHaveBeenCalledWith("/circles?segment=groups")
  })

  it("displays blocking balances in confirmation", async () => {
    const blocking = [
      { userId: "me", userName: "You", amount: 50 },
      { userId: "u1", userName: "Alice", amount: -50 },
    ]
    ;(useGroupSettings as Mock).mockReturnValue(makeSettings({ blockingBalances: blocking }))
    await render(<GroupSettingsScreen />)
    await act(async () => {
      fireEvent.press(screen.getByText('Delete "Trip"'))
    })
    expect(screen.getAllByText(/outstanding balances/i).length).toBeGreaterThanOrEqual(1)
    expect(screen.getAllByText(/You: \+50\.00/).length).toBeGreaterThanOrEqual(1)
  })
})
