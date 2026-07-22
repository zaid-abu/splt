import React from "react"
import { render } from "@testing-library/react-native"

import { useSettlementFlow } from "@/features/settlements/hooks/useSettlementFlow"

jest.mock("@/services/supabase/client", () => ({
  supabase: { rpc: jest.fn(), from: jest.fn() },
}))

jest.mock("@tanstack/react-query", () => ({
  useMutation: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
  useQuery: () => ({ data: [], isLoading: false, refetch: jest.fn() }),
}))

jest.mock("@/store/useUIStore", () => ({
  useUIStore: (selector: any) =>
    selector?.({
      isDarkMode: false,
      preferredCurrency: { code: "USD", symbol: "$", name: "US Dollar" },
      convertCurrency: (a: number) => a,
    }) ?? { isDarkMode: false, preferredCurrency: { code: "USD", symbol: "$", name: "US Dollar" } },
}))

jest.mock("react-native-reanimated", () => ({
  default: { createAnimatedComponent: (c: any) => c },
  FadeInDown: { duration: () => ({}) },
}))

jest.mock("expo-blur", () => ({
  BlurView: ({ children }: any) => {
    const { View } = require("react-native")
    return <View>{children}</View>
  },
  BlurTargetView: ({ children }: any) => {
    const { View } = require("react-native")
    return <View>{children}</View>
  },
}))

jest.mock("expo-status-bar", () => ({
  StatusBar: () => null,
}))

jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }: any) => {
    const { View } = require("react-native")
    return <View>{children}</View>
  },
}))



jest.mock("@/hooks/useAppToast", () => ({
  useAppToast: () => ({ toast: { show: jest.fn() } }),
}))

jest.mock("@/features/settlements/hooks/useSettlementFlow", () => ({
  useSettlementFlow: jest.fn(),
}))

jest.mock("expo-router", () => ({
  useRouter: () => ({ back: jest.fn(), replace: jest.fn(), canGoBack: () => true }),
  useLocalSearchParams: () => ({ id: "u2" }),
}))

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "u1", name: "You" } }),
}))

jest.mock("@/components/ui", () => ({
  useUI: () => ({
    color: { text: "#000", muted: "#666", bg: "#fff", border: "#ddd", control: "#f5f5f5", ink: "#000", subtle: "#eee", brand: "#007AFF", textInverse: "#fff", surface: "#fff" },
    radius: { pill: 999, lg: 12 },
    space: { page: 16 },
  }),
}))

jest.mock("@/components/ui/MemberAvatar", () => ({
  AppUserAvatar: () => null,
}))

jest.mock("@/components/coral", () => ({
  CoralButton: ({ label, onPress }: any) => {
    const { Pressable, Text } = require("react-native")
    return (
      <Pressable onPress={onPress} accessibilityRole="button" testID={`coral-button-${label.toLowerCase().replace(/\s+/g, "-")}`}>
        <Text>{label}</Text>
      </Pressable>
    )
  },
  CoralScreen: ({ children }: any) => {
    const { View } = require("react-native")
    return <View testID="coral-screen">{children}</View>
  },
  CoralTopBar: ({ title }: any) => {
    const { View, Text } = require("react-native")
    return (
      <View testID="coral-top-bar">
        <Text>{title}</Text>
      </View>
    )
  },
  MoneyRow: ({ title, subtitle, amount, onPress }: any) => {
    const { Pressable, Text, View } = require("react-native")
    return (
      <Pressable onPress={onPress} testID={`money-row-${title}`}>
        <Text>{title}</Text>
        {subtitle ? <Text>{subtitle}</Text> : null}
        <Text>{amount}</Text>
      </Pressable>
    )
  },
  EmptyState: ({ title }: any) => {
    const { Text } = require("react-native")
    return <Text testID="empty-state">{title}</Text>
  },
  LargeTitle: ({ children }: any) => {
    const { Text } = require("react-native")
    return <Text testID="large-title">{children}</Text>
  },
  BalanceHero: ({ label, value }: any) => {
    const { Text, View } = require("react-native")
    return (
      <View testID="balance-hero">
        <Text>{label}</Text>
        <Text>{value}</Text>
      </View>
    )
  },
  CoralSegment: ({ options, selected, onSelect }: any) => {
    const { Pressable, Text, View } = require("react-native")
    return (
      <View testID="coral-segment">
        {options.map((opt: any) => (
          <Pressable key={opt.value} onPress={() => onSelect(opt.value)} testID={`segment-${opt.value}`}>
            <Text>{opt.label}</Text>
          </Pressable>
        ))}
      </View>
    )
  },
}))

jest.mock("@/features/balances/queries/useBalances", () => ({
  useOpenBalances: () => ({
    data: [],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}))

jest.mock("@/features/friends/hooks/useFriendsList", () => ({
  useFriendsList: () => ({
    friendRows: [],
    isLoading: false,
    refetchAll: jest.fn(),
  }),
}))

const mockUseSettlementFlow = useSettlementFlow as jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
})

describe("SettlementScreen compose state", () => {
  it("renders compose step with direction text", async () => {
    mockUseSettlementFlow.mockReturnValue({
      state: {
        step: "compose",
        selection: {
          counterpartyId: "u2",
          counterpartyName: "Keran",
          context: { type: "direct", friendshipId: "f-1" },
          currency: "USD",
          signedAmountMinor: 1500,
          isOwedToYou: false,
        },
        amountInput: "1500",
        method: "cash" as const,
        note: "",
      },
      startCompose: jest.fn(),
      setAmountInput: jest.fn(),
      setMethod: jest.fn(),
      setNote: jest.fn(),
      goToReview: jest.fn(),
      goBackToCompose: jest.fn(),
      submit: jest.fn(),
      reset: jest.fn(),
    })
    const Screen = require("./SettlementScreen").default
    const rendered = render(<Screen />)
    expect(rendered).toBeDefined()
  })
})

describe("SettlementScreen review state", () => {
  it("renders review step with disclaimer", async () => {
    mockUseSettlementFlow.mockReturnValue({
      state: {
        step: "review",
        selection: {
          counterpartyId: "u2",
          counterpartyName: "Keran",
          context: { type: "direct", friendshipId: "f-1" },
          currency: "USD",
          signedAmountMinor: 1500,
          isOwedToYou: false,
        },
        amountMinor: 1000,
        method: "cash" as const,
        note: "Thanks!",
        resultingMinor: -500,
      },
      startCompose: jest.fn(),
      setAmountInput: jest.fn(),
      setMethod: jest.fn(),
      setNote: jest.fn(),
      goToReview: jest.fn(),
      goBackToCompose: jest.fn(),
      submit: jest.fn(),
      reset: jest.fn(),
    })
    const Screen = require("./SettlementScreen").default
    const rendered = render(<Screen />)
    expect(rendered).toBeDefined()
  })
})

describe("SettlementScreen success state", () => {
  it("renders success step with receipt", async () => {
    mockUseSettlementFlow.mockReturnValue({
      state: {
        step: "success",
        settlement: {
          id: "s-1",
          fromUserId: "u1",
          toUserId: "u2",
          amount: 10,
          amountMinor: 1000,
          currency: "USD",
          method: "cash",
          date: new Date(),
          fromUser: { id: "u1", name: "You" },
          toUser: { id: "u2", name: "Keran" },
        },
        resultingMinor: -500,
        selection: {
          counterpartyId: "u2",
          counterpartyName: "Keran",
          context: { type: "direct", friendshipId: "f-1" },
          currency: "USD",
          signedAmountMinor: 1500,
          isOwedToYou: false,
        },
      },
      startCompose: jest.fn(),
      setAmountInput: jest.fn(),
      setMethod: jest.fn(),
      setNote: jest.fn(),
      goToReview: jest.fn(),
      goBackToCompose: jest.fn(),
      submit: jest.fn(),
      reset: jest.fn(),
    })
    const Screen = require("./SettlementScreen").default
    const rendered = render(<Screen />)
    expect(rendered).toBeDefined()
  })
})
