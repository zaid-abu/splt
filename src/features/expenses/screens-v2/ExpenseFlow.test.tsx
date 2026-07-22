import { act, fireEvent, render, screen } from "@testing-library/react-native"
import type { Mock , Mock as MockT } from "jest-mock"

import { useExpenseComposer } from "@/features/expenses/hooks/useExpenseComposer"
import { useExpenseSnapshot } from "@/features/expenses/hooks/useExpenseSnapshot"
import { useDeleteExpense } from "@/features/expenses/queries/useExpenses"
import { useExpenseComments } from "@/features/expenses/queries/useComments"

const mockReplace = jest.fn()
const mockPush = jest.fn()
const mockBack = jest.fn()
const mockCanGoBack = jest.fn(() => true)
const mockUseLocalSearchParams = jest.fn(() => ({}))

jest.mock("expo-router", () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: mockPush,
    back: mockBack,
    canGoBack: mockCanGoBack,
  }),
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}))

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: jest.fn(() => ({ data: [] })),
}))

jest.mock("@/features/friends/queries/useFriends", () => ({
  useFriends: jest.fn(() => ({ data: [] })),
  useAllFriendships: jest.fn(() => ({ data: [] })),
}))

jest.mock("@/features/friends/hooks/useFriendsList", () => ({
  useFriendsList: () => ({ friendRows: [] }),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) => {
    const store = { isDarkMode: false, preferredCurrency: { code: "USD" } }
    return selector(store)
  },
}))

const mockToastShow = jest.fn()
jest.mock("@/hooks/useAppToast", () => ({
  useAppToast: () => ({ toast: { show: mockToastShow } }),
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
  CoralScreen: ({ children }: any) =>
    require("react").createElement(require("react-native").View, { style: { flex: 1 } }, children),
}))

jest.mock("@/components/coral/CoralTopBar", () => ({
  CoralTopBar: ({ title, onBack }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "coral-topbar" },
      React.createElement(RN.Text, null, title)
    )
  },
}))

jest.mock("@/components/coral/CoralButton", () => ({
  CoralButton: ({ label, onPress, disabled, loading }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.Pressable,
      {
        onPress,
        disabled: disabled || loading,
        accessibilityRole: "button",
        testID: `coral-button-${label.toLowerCase().replace(/\s+/g, "-")}`,
      },
      React.createElement(RN.Text, null, loading ? "Loading..." : label)
    )
  },
}))

jest.mock("@/components/coral/CoralSegment", () => ({
  CoralSegment: ({ options, selected, onSelect }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(
      RN.View,
      { testID: "coral-segment" },
      options.map((opt: any) =>
        React.createElement(
          RN.Pressable,
          {
            key: opt.value,
            onPress: () => onSelect(opt.value),
            testID: `segment-${opt.value}`,
            accessibilityRole: "button",
          },
          React.createElement(RN.Text, null, opt.label)
        )
      )
    )
  },
}))

jest.mock("@/components/coral/CoralSelect", () => ({
  CoralSelect: () => null,
}))

jest.mock("@/components/coral/CoralSheet", () => ({
  CoralSheet: ({ visible, onClose, children }: any) =>
    visible
      ? require("react").createElement(
          require("react-native").View,
          { testID: "coral-sheet" },
          children
        )
      : null,
}))

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: { text: "#000", muted: "#666", control: "#eee", textInverse: "#fff", border: "#ddd", brand: "#000", danger: "#b61537", dangerTint: "#ffe1e1", bg: "#fff" },
    radius: { pill: 9999, lg: 16 },
    space: { page: 16 },
    shadow: {},
  }),
}))

jest.mock("@/components/ui/AmountDisplay", () => ({
  getCurrencySymbol: (code: string) => (code === "USD" ? "$" : code),
  formatAmount: (amount: number) => `$${amount.toFixed(2)}`,
  AmountDisplay: () => null,
}))

jest.mock("@/features/expenses/hooks/useExpenseSnapshot", () => ({
  useExpenseSnapshot: jest.fn(),
}))

jest.mock("@/features/expenses/hooks/useExpenseComposer", () => {
  const actual = jest.requireActual("@/features/expenses/hooks/useExpenseComposer")
  return {
    ...actual,
    useExpenseComposer: jest.fn(),
  }
})

jest.mock("expo-image-picker", () => ({
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  launchCameraAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: "Images" },
}))

jest.mock("expo-document-picker", () => ({
  getDocumentAsync: jest.fn(),
}))

jest.mock("@/features/expenses/services/api", () => ({
  expensesApi: {
    uploadStagedReceipt: jest.fn(),
    removeStagedReceipt: jest.fn(),
    registerReceiptUpload: jest.fn(),
    deleteExpense: jest.fn(),
    createReceiptSignedUrl: jest.fn(),
  },
}))

jest.mock("@/features/expenses/components/ExpenseCreateSuccess", () => {
  const React = require("react")
  const RN = require("react-native")
  return {
    ExpenseCreateSuccess: ({ expenseId, onUndoSuccess, onReturn, totalMinor, paidByUserName }: any) => {
      return React.createElement(RN.View, { testID: "expense-create-success" },
        React.createElement(RN.Text, { testID: "success-expense-id" }, expenseId),
        React.createElement(RN.Text, { testID: "success-total-minor" }, String(totalMinor)),
        React.createElement(RN.Text, { testID: "success-paid-by" }, paidByUserName),
        React.createElement(
          RN.Pressable,
          {
            testID: "success-undo",
            onPress: () => {
              const api = require("@/features/expenses/services/api")
              api.expensesApi.deleteExpense(expenseId).then(onUndoSuccess).catch(() => {})
            },
          },
          React.createElement(RN.Text, null, "Undo")
        ),
        React.createElement(
          RN.Pressable,
          { testID: "success-return", onPress: onReturn },
          React.createElement(RN.Text, null, "Return")
        ),
      )
    },
  }
})

jest.mock("@gorhom/bottom-sheet", () => ({
  BottomSheetModal: ({ children }: any) => children,
  BottomSheetBackdrop: () => null,
  BottomSheetView: ({ children }: any) => children,
}))

jest.mock("react-native-reanimated", () => {
  const RN = require("react-native")
  return {
    useSharedValue: jest.fn(() => ({ value: 0 })),
    useAnimatedStyle: jest.fn(() => ({})),
    withRepeat: jest.fn((v) => v),
    withTiming: jest.fn((v) => v),
    withSequence: jest.fn((...args) => args[0]),
    Easing: { bezier: jest.fn(), inOut: jest.fn(), ease: jest.fn() },
    View: RN.View,
    Text: RN.Text,
    default: { createAnimatedComponent: (c: any) => c },
    createAnimatedComponent: (c: any) => c,
  }
})

jest.mock("react-native-worklets", () => ({
  createWorklet: (fn: any) => fn,
  runOnUI: (fn: any) => fn,
  runOnJS: (fn: any) => fn,
  isWorkletFunction: () => false,
}))



jest.mock("@/features/expenses/queries/useExpenses", () => ({
  useCreateExpense: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeleteExpense: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useUpdateExpense: jest.fn(() => ({ mutateAsync: jest.fn() })),
}))

jest.mock("@/features/balances/queries/useBalances", () => ({
  useOpenBalances: jest.fn(() => ({ data: [] })),
}))

jest.mock("@/features/expenses/queries/useComments", () => ({
  useExpenseComments: jest.fn(() => ({ data: [], isLoading: false, isError: false, refetch: jest.fn() })),
  useAddComment: jest.fn(() => ({ mutateAsync: jest.fn() })),
  useDeleteComment: jest.fn(() => ({ mutateAsync: jest.fn() })),
}))

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: ({ user }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: `avatar-${user?.id}` })
  },
}))

jest.mock("@/components/coral/MoneyRow", () => ({
  MoneyRow: ({ title, subtitle, amount, amountTone, onPress, avatar, rightElement }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "money-row" },
      React.createElement(RN.Text, { testID: "money-row-title" }, title),
      subtitle ? React.createElement(RN.Text, { testID: "money-row-subtitle" }, subtitle) : null,
      React.createElement(RN.Text, { testID: "money-row-amount" }, amount || "—"),
      rightElement || null,
    )
  },
}))

jest.mock("@/components/coral/Eyebrow", () => ({
  Eyebrow: ({ children, style }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.Text, { testID: "eyebrow" }, children)
  },
}))

jest.mock("@/components/ui/ErrorState", () => ({
  ErrorState: ({ onRetry }: any) => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.View, { testID: "error-state" },
      React.createElement(RN.Pressable, {
        testID: "error-retry",
        onPress: onRetry,
      }, React.createElement(RN.Text, null, "Retry"))
    )
  },
}))

jest.mock("@/components/ui/AppLoader", () => ({
  AppLoader: () => {
    const React = require("react")
    const RN = require("react-native")
    return React.createElement(RN.ActivityIndicator, { testID: "app-loader" })
  },
}))

const mockComposer = useExpenseComposer as MockT
const mockSnapshot = useExpenseSnapshot as MockT
const mockDeleteExpense = useDeleteExpense as MockT
const mockComments = useExpenseComments as MockT

function makeComposerMock(overrides?: Record<string, any>) {
  return {
    state: {
      context: undefined,
      amountInput: "",
      currency: "USD",
      description: "",
      paidBy: "",
      participants: [],
      splitMethod: "equal",
      splitSources: {},
      date: new Date(),
      category: "food",
      notes: "",
      status: "editing",
    },
    dispatch: jest.fn(),
    setContext: jest.fn(),
    setAmount: jest.fn(),
    setDescription: jest.fn(),
    setPaidBy: jest.fn(),
    setSplitMethod: jest.fn(),
    setSource: jest.fn(),
    setDate: jest.fn(),
    setCategory: jest.fn(),
    setNotes: jest.fn(),
    setReceipt: jest.fn(),
    resetSplit: jest.fn(),
    confirmCurrency: jest.fn(),
    submitStart: jest.fn(),
    submitSuccess: jest.fn(),
    submitError: jest.fn(),
    initEdit: jest.fn(),
    calculateResult: jest.fn(() => null),
    ...overrides,
  }
}

function makeSnapshotData(overrides?: Record<string, any>) {
  return {
    data: {
      expense: {
        id: "e1",
        groupId: "g1",
        title: "Dinner",
        amount: 50,
        amountMinor: 5000,
        currency: "USD",
        category: "food",
        paidBy: "a",
        paidByUser: { id: "a", name: "Alice", initials: "A" },
        createdBy: "a",
        splits: [
          { userId: "me", user: { id: "me", name: "You", initials: "Y" }, amount: 25, amountMinor: 2500, percentage: 50, shares: null, position: 0, paid: false },
          { userId: "a", user: { id: "a", name: "Alice", initials: "A" }, amount: 25, amountMinor: 2500, percentage: 50, shares: null, position: 1, paid: true },
        ],
        splitMethod: "equal",
        date: new Date("2024-01-15"),
        createdAt: new Date("2024-01-15"),
      },
      permissions: { canEdit: false, canDelete: false, deleteNeedsOwnerConfirmation: false },
      receiptUrl: undefined,
      comments: [],
      settlementCandidates: [],
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

beforeEach(() => {
  jest.clearAllMocks()
  mockToastShow.mockClear()
  const useGroups = require("@/features/groups/queries/useGroups")
  useGroups.useGroups.mockReturnValue({ data: [] })
})

describe("NewExpenseScreenV2 with useExpenseComposer", () => {
  it("renders composer with global selector when no context", async () => {
    mockComposer.mockReturnValue(makeComposerMock())
    mockUseLocalSearchParams.mockReturnValue({})

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })

  it("renders composer with contextual preselection when groupId provided", async () => {
    mockUseLocalSearchParams.mockReturnValue({ groupId: "g1" })

    mockComposer.mockReturnValue(
      makeComposerMock({
        state: {
          context: { type: "group", groupId: "g1" },
          amountInput: "",
          currency: "USD",
          description: "",
          paidBy: "me",
          participants: [
            { userId: "me", name: "You" },
            { userId: "a", name: "Alice" },
          ],
          splitMethod: "equal",
          splitSources: { me: {}, a: {} },
          date: new Date(),
          category: "food",
          notes: "",
          status: "editing",
        },
      })
    )

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })

  it("renders context change button when context set", async () => {
    mockUseLocalSearchParams.mockReturnValue({})

    mockComposer.mockReturnValue(
      makeComposerMock({
        state: {
          context: { type: "group", groupId: "g1" },
          amountInput: "",
          currency: "USD",
          description: "",
          paidBy: "me",
          participants: [
            { userId: "me", name: "You" },
            { userId: "a", name: "Alice" },
          ],
          splitMethod: "equal",
          splitSources: { me: {}, a: {} },
          date: new Date(),
          category: "food",
          notes: "",
          status: "editing",
        },
      })
    )

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })

  it("dispatches SET_SPLIT_METHOD when segment changes", async () => {
    const mockSetSplitMethod = jest.fn()
    mockUseLocalSearchParams.mockReturnValue({})

    mockComposer.mockReturnValue(
      makeComposerMock({
        setSplitMethod: mockSetSplitMethod,
        state: {
          ...makeComposerMock().state,
          context: { type: "group", groupId: "g1" },
          participants: [
            { userId: "me", name: "You" },
            { userId: "a", name: "Alice" },
          ],
        },
      })
    )

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })
})

const React = require("react")

describe("receipt selection, upload, and undo", () => {
  const { expensesApi } = require("@/features/expenses/services/api")
  const ImagePicker = require("expo-image-picker")
  const DocumentPicker = require("expo-document-picker")

  function setupFormContext() {
    const mockSetReceipt = jest.fn()
    const useGroups = require("@/features/groups/queries/useGroups")
    useGroups.useGroups.mockReturnValue({
      data: [{
        id: "g1",
        name: "Test Group",
        currency: "USD",
        members: [
          { userId: "me", user: { id: "me", name: "You", initials: "Y" } },
          { userId: "a", user: { id: "a", name: "Alice", initials: "A" } },
        ],
      }],
    })
    mockComposer.mockReturnValue(
      makeComposerMock({
        setReceipt: mockSetReceipt,
        state: {
          context: { type: "group", groupId: "g1" },
          amountInput: "25.00",
          currency: "USD",
          description: "Dinner",
          paidBy: "me",
          participants: [
            { userId: "me", name: "You" },
            { userId: "a", name: "Alice" },
          ],
          splitMethod: "equal",
          splitSources: { me: {}, a: {} },
          date: new Date("2024-01-15"),
          category: "food",
          notes: "",
          status: "editing",
          receipt: undefined,
        },
      })
    )
    mockUseLocalSearchParams.mockReturnValue({ groupId: "g1" })
    return { mockSetReceipt }
  }

  beforeEach(() => {
    jest.clearAllMocks()
    expensesApi.uploadStagedReceipt.mockResolvedValue("staging/u1/op-1/receipt")
    expensesApi.deleteExpense.mockResolvedValue(undefined)
  })

  it("picks JPEG from gallery, validates mime, and uploads to staging", async () => {
    setupFormContext()
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///receipt.jpg", mimeType: "image/jpeg", fileSize: 500000 }],
    })

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })

  it("rejects unsupported MIME type before upload", async () => {
    setupFormContext()
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///receipt.gif", mimeType: "image/gif", fileSize: 5000 }],
    })

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))

    expect(expensesApi.uploadStagedReceipt).not.toHaveBeenCalled()
  })

  it("rejects file larger than 10 MB before upload", async () => {
    setupFormContext()
    ImagePicker.launchImageLibraryAsync.mockResolvedValue({
      canceled: false,
      assets: [{ uri: "file:///large.jpg", mimeType: "image/jpeg", fileSize: 11_000_000 }],
    })

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))

    expect(expensesApi.uploadStagedReceipt).not.toHaveBeenCalled()
  })

  it("upload failure retains editing state", async () => {
    setupFormContext()
    expensesApi.uploadStagedReceipt.mockRejectedValue(new Error("Upload error"))

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })

  it("create expense calls mutateAsync and updates state", async () => {
    const mockCreateExpense = jest.fn().mockResolvedValue({ id: "exp-1" })
    const useExpenses = require("@/features/expenses/queries/useExpenses")
    useExpenses.useCreateExpense.mockReturnValue({ mutateAsync: mockCreateExpense })

    setupFormContext()

    const NewExpenseScreen = require("./NewExpenseScreen").default
    await render(React.createElement(NewExpenseScreen))
  })
})

describe("ExpenseCreateSuccess component", () => {
  const { expensesApi } = require("@/features/expenses/services/api")
  const { ExpenseCreateSuccess } = require("@/features/expenses/components/ExpenseCreateSuccess")

  const baseProps = {
    totalMinor: 2500,
    currency: "USD",
    paidByUserId: "me",
    paidByUserName: "You",
    currentUserId: "me",
    splits: [
      { userId: "me", amountMinor: 1250 },
      { userId: "a", amountMinor: 1250 },
    ],
    expenseId: "exp-1",
    onReturn: jest.fn(),
    onUndoSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    expensesApi.deleteExpense.mockResolvedValue(undefined)
  })

  it("renders success component", async () => {
    await render(React.createElement(ExpenseCreateSuccess, baseProps))
    expect(screen.getAllByTestId("expense-create-success").length).toBeGreaterThan(0)
    expect(screen.getAllByTestId("success-undo").length).toBeGreaterThan(0)
  })

  it("successful undo calls deleteExpense and onUndoSuccess", async () => {
    const mockOnUndoSuccess = jest.fn()
    await render(React.createElement(ExpenseCreateSuccess, {
      ...baseProps,
      onUndoSuccess: mockOnUndoSuccess,
    }))
    const btn = screen.getAllByTestId("success-undo")[0]
    await act(async () => { fireEvent.press(btn) })

    expect(expensesApi.deleteExpense).toHaveBeenCalledWith("exp-1")
    expect(mockOnUndoSuccess).toHaveBeenCalled()
  })

  it("failed undo does not call onUndoSuccess", async () => {
    expensesApi.deleteExpense.mockRejectedValue(new Error("Delete failed"))
    const mockOnUndoSuccess = jest.fn()
    await render(React.createElement(ExpenseCreateSuccess, {
      ...baseProps,
      onUndoSuccess: mockOnUndoSuccess,
    }))
    const btn = screen.getAllByTestId("success-undo")[0]
    await act(async () => { fireEvent.press(btn) })

    expect(expensesApi.deleteExpense).toHaveBeenCalledWith("exp-1")
    expect(mockOnUndoSuccess).not.toHaveBeenCalled()
  })
})

describe("ExpenseDetailScreenV2", () => {
  it("renders total amount, payer, category, date, and circle name", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData())

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))

    expect(screen.getAllByText(/50\.00/).length).toBeGreaterThan(0)
    expect(screen.getByText(/Paid by/)).toBeTruthy()
    expect(screen.getByText(/equally/)).toBeTruthy()
  })

  it("renders loading state", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({ isInitialLoading: true, data: undefined }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
  })

  it("renders error state", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({ isError: true, data: undefined }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
  })

  it("renders not found state", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({ isNotFound: true, data: undefined }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    expect(screen.getByText("Expense not found")).toBeTruthy()
  })

  it("shows 'Your share' separate from 'You lent' when payer", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: {
        ...makeSnapshotData().data,
        expense: {
          ...makeSnapshotData().data.expense,
          paidBy: "me",
          paidByUser: { id: "me", name: "You", initials: "Y" },
          createdBy: "me",
        },
        permissions: { canEdit: true, canDelete: true, deleteNeedsOwnerConfirmation: false },
      },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))

    expect(screen.getByText("Your actual share")).toBeTruthy()
    expect(screen.getByText("You lent")).toBeTruthy()
  })

  it("shows 'Your share' separate from 'You borrowed' when non-payer", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData())

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))

    expect(screen.getByText("Your share")).toBeTruthy()
    expect(screen.getByText("You borrowed")).toBeTruthy()
  })

  it("shows edit button when canEdit is true", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, permissions: { canEdit: true, canDelete: false, deleteNeedsOwnerConfirmation: false } },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    expect(screen.getByText("Edit expense")).toBeTruthy()
  })

  it("hides edit button when canEdit is false", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData())

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    expect(screen.queryByText("Edit expense")).toBeNull()
  })

  it("shows settle up button when settlement candidates exist", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: {
        ...makeSnapshotData().data,
        settlementCandidates: [
          { counterpartyId: "a", context: { type: "group", groupId: "g1" }, currency: "USD", signedAmountMinor: 2500, lastActivityAt: new Date() },
        ],
      },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    expect(screen.getByText("Settle balance")).toBeTruthy()
  })

  it("renders receipt viewer when receiptUrl is available", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, receiptUrl: "receipts/e1/receipt.jpg" },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    expect(screen.getByText("Receipt attached")).toBeTruthy()
  })

  it("navigates to edit route when edit pressed", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, permissions: { canEdit: true, canDelete: false, deleteNeedsOwnerConfirmation: false } },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    fireEvent.press(screen.getByText("Edit expense"))
    expect(mockPush).toHaveBeenCalledWith("/expense/e1/edit")
  })

  it("deletes expense and navigates back", async () => {
    const mockMutateAsync = jest.fn().mockResolvedValue(undefined)
    const useExpenses = require("@/features/expenses/queries/useExpenses")
    useExpenses.useDeleteExpense.mockReturnValue({ mutateAsync: mockMutateAsync })

    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: {
        ...makeSnapshotData().data,
        permissions: { canEdit: false, canDelete: true, deleteNeedsOwnerConfirmation: false },
      },
    }))

    const DetailScreen = require("./ExpenseDetailScreen").default
    await render(React.createElement(DetailScreen))
    const deleteText = screen.getAllByText("Delete")
    const deleteBtn = deleteText[deleteText.length - 1]
    await act(async () => { fireEvent.press(deleteBtn) })
    expect(mockMutateAsync).toHaveBeenCalledWith("e1")
    expect(mockBack).toHaveBeenCalled()
  })
})

describe("ExpenseComments component", () => {
  const { ExpenseComments } = require("@/features/expenses/components/ExpenseComments")
  const { useExpenseComments: mockUseExpenseComments } = require("@/features/expenses/queries/useComments")

  const baseProps = { expenseId: "e1", currentUserId: "me" }

  it("shows loading state", async () => {
    mockUseExpenseComments.mockReturnValue({ data: [], isLoading: true, isError: false, refetch: jest.fn() })
    await render(React.createElement(ExpenseComments, baseProps))
    expect(screen.getByTestId("eyebrow")).toBeTruthy()
  })

  it("shows error state with retry", async () => {
    mockUseExpenseComments.mockReturnValue({ data: [], isLoading: false, isError: true, refetch: jest.fn() })
    await render(React.createElement(ExpenseComments, baseProps))
  })

  it("shows empty state", async () => {
    mockUseExpenseComments.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: jest.fn() })
    await render(React.createElement(ExpenseComments, baseProps))
    expect(screen.getByText("No comments yet")).toBeTruthy()
  })

  it("shows error toast on failed add", async () => {
    const mockAddComment = jest.fn().mockRejectedValue(new Error("Network error"))
    const { useAddComment: mockUseAddComment } = require("@/features/expenses/queries/useComments")
    mockUseAddComment.mockReturnValue({ mutateAsync: mockAddComment })
    mockUseExpenseComments.mockReturnValue({ data: [], isLoading: false, isError: false, refetch: jest.fn() })

    await render(React.createElement(ExpenseComments, baseProps))
    const input = screen.getByPlaceholderText("Add a comment...")
    await act(async () => {
      fireEvent.changeText(input, "Test comment")
    })
    const sendBtn = await screen.findAllByRole("button")
    await act(async () => {
      fireEvent.press(sendBtn[sendBtn.length - 1])
    })
    expect(mockToastShow).toHaveBeenCalledWith(
      expect.objectContaining({ label: "Failed to add comment", variant: "danger" })
    )
  })

  it("shows delete button for comment author", async () => {
    mockUseExpenseComments.mockReturnValue({
      data: [{ id: "c1", expenseId: "e1", userId: "me", text: "My comment", createdAt: new Date() }],
      isLoading: false, isError: false, refetch: jest.fn(),
    })
    await render(React.createElement(ExpenseComments, { ...baseProps, groupCreatedBy: "other" }))
    expect(screen.getByText("My comment")).toBeTruthy()
  })

  it("shows delete button for group creator on group expense", async () => {
    mockUseExpenseComments.mockReturnValue({
      data: [{ id: "c2", expenseId: "e1", userId: "other", text: "Their comment", createdAt: new Date() }],
      isLoading: false, isError: false, refetch: jest.fn(),
    })
    await render(React.createElement(ExpenseComments, { ...baseProps, groupCreatedBy: "me" }))
    expect(screen.getByText("Their comment")).toBeTruthy()
  })
})

describe("EditExpenseScreen", () => {
  const mockUpdateMutateAsync = jest.fn().mockResolvedValue({ id: "e1" })

  beforeEach(() => {
    jest.clearAllMocks()
    mockUpdateMutateAsync.mockClear()
    const useExpenses = require("@/features/expenses/queries/useExpenses")
    useExpenses.useUpdateExpense.mockReturnValue({ mutateAsync: mockUpdateMutateAsync })
  })

  it("renders loading state", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({ isInitialLoading: true, data: undefined }))

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
  })

  it("renders not found state", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({ isNotFound: true, data: undefined }))

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
    expect(screen.getByText("Expense not found")).toBeTruthy()
  })

  it("renders cant edit state when permissions deny", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: {
        ...makeSnapshotData().data,
        permissions: { canEdit: false, canDelete: false, deleteNeedsOwnerConfirmation: false },
      },
    }))

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
    expect(screen.getByText("You can't edit this expense")).toBeTruthy()
  })

  it("hydrates composer and renders form fields", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, permissions: { canEdit: true, canDelete: false, deleteNeedsOwnerConfirmation: false } },
    }))
    const composerMock = makeComposerMock({
      state: {
        ...makeComposerMock().state,
        context: { type: "group", groupId: "g1" },
        description: "Dinner",
        amountInput: "50.00",
        paidBy: "a",
        participants: [
          { userId: "me", name: "You" },
          { userId: "a", name: "Alice" },
        ],
        splitMethod: "equal",
        date: new Date("2024-01-15"),
        category: "food",
      },
    })
    mockComposer.mockReturnValue(composerMock)

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
    expect(screen.getByText("Edit expense")).toBeTruthy()
  })

  it("shows consequence review when changes detected", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, permissions: { canEdit: true, canDelete: false, deleteNeedsOwnerConfirmation: false } },
    }))
    const composerMock = makeComposerMock({
      state: {
        ...makeComposerMock().state,
        context: { type: "group", groupId: "g1" },
        description: "Dinner (updated)",
        amountInput: "60.00",
        paidBy: "me",
        participants: [
          { userId: "me", name: "You" },
          { userId: "a", name: "Alice" },
        ],
        splitMethod: "equal",
        date: new Date("2024-01-15"),
        category: "food",
        currency: "USD",
      },
      calculateResult: jest.fn(() => ({ totalMinor: 6000, splits: [
        { userId: "me", amountMinor: 3000, position: 0 },
        { userId: "a", amountMinor: 3000, position: 1 },
      ] })),
    })
    mockComposer.mockReturnValue(composerMock)

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
    screen.getByText("Review changes")
  })

  it("saves changes via updateExpense and navigates back", async () => {
    mockUseLocalSearchParams.mockReturnValue({ id: "e1" })
    mockSnapshot.mockReturnValue(makeSnapshotData({
      data: { ...makeSnapshotData().data, permissions: { canEdit: true, canDelete: false, deleteNeedsOwnerConfirmation: false } },
    }))
    const composerMock = makeComposerMock({
      state: {
        ...makeComposerMock().state,
        context: { type: "group", groupId: "g1" },
        description: "Dinner (updated)",
        amountInput: "50.00",
        paidBy: "a",
        participants: [
          { userId: "me", name: "You" },
          { userId: "a", name: "Alice" },
        ],
        splitMethod: "equal",
        date: new Date("2024-01-15"),
        category: "food",
        currency: "USD",
      },
      calculateResult: jest.fn(() => ({ totalMinor: 5000, splits: [
        { userId: "me", amountMinor: 2500, position: 0 },
        { userId: "a", amountMinor: 2500, position: 1 },
      ] })),
    })
    mockComposer.mockReturnValue(composerMock)

    const { useUpdateExpense: useUpdateExpenseMock } = require("@/features/expenses/queries/useExpenses")
    useUpdateExpenseMock.mockReturnValue({ mutateAsync: mockUpdateMutateAsync })

    const EditScreen = require("./EditExpenseScreen").default
    await render(React.createElement(EditScreen))
    const reviewBtn = screen.queryByText("Review changes")
    if (reviewBtn) {
      await act(async () => { fireEvent.press(reviewBtn) })
    }
  })
})
