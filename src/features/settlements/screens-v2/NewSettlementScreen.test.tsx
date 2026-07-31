import React from "react";
import { render } from "@testing-library/react-native";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({
    push: mockPush,
    back: jest.fn(),
    replace: jest.fn(),
    canGoBack: () => true,
  }),
  useLocalSearchParams: () => ({ counterpartyId: "friend-1" }),
}));

jest.mock("lucide-react-native", () => ({ CircleCheckBig: () => null }));

jest.mock("@/context/AppContext", () => ({
  useAuth: () => ({ currentUser: { id: "me" } }),
}));

jest.mock("@/features/balances/queries/useBalances", () => ({
  useOpenBalances: () => ({
    data: [
      {
        counterpartyId: "friend-1",
        context: { type: "group", groupId: "group-1" },
        currency: "USD",
        signedAmountMinor: -1200,
        lastActivityAt: new Date("2026-07-31T00:00:00Z"),
      },
      {
        counterpartyId: "friend-1",
        context: { type: "direct", friendshipId: "friendship-1" },
        currency: "USD",
        signedAmountMinor: 700,
        lastActivityAt: new Date("2026-07-31T00:00:00Z"),
      },
    ],
    isLoading: false,
    isError: false,
    refetch: jest.fn(),
  }),
}));

jest.mock("@/features/friends/hooks/useFriendsList", () => ({
  useFriendsList: () => ({
    friendRows: [
      {
        friend: { id: "friend-1", name: "Alex", avatar: undefined },
        friendship: { id: "friendship-1" },
      },
    ],
  }),
}));

jest.mock("@/features/groups/queries/useGroups", () => ({
  useGroups: () => ({ data: [{ id: "group-1", name: "Trip", members: [] }] }),
}));

jest.mock("@/components/ui", () => ({
  useUI: () => ({ color: { text: "#111", muted: "#666", border: "#ddd" } }),
}));

jest.mock("@/components/ui/MemberAvatar", () => ({ AppUserAvatar: () => null }));

jest.mock("@/components/coral", () => {
  const React = require("react");
  const { Pressable, Text, View } = require("react-native");
  return {
    CoralButton: ({ label }: any) => <Text>{label}</Text>,
    CoralScreen: ({ children }: any) => <View>{children}</View>,
    CoralTopBar: ({ title }: any) => <Text>{title}</Text>,
    EmptyState: ({ title }: any) => <Text>{title}</Text>,
    LargeTitle: ({ children }: any) => <Text>{children}</Text>,
    MoneyRow: ({ title, subtitle, onPress }: any) => (
      <Pressable testID="settlement-balance" onPress={onPress}>
        <Text>{title}</Text>
        <Text>{subtitle}</Text>
      </Pressable>
    ),
  };
});

const NewSettlementScreen = require("./NewSettlementScreen").default;

describe("NewSettlementScreen", () => {
  it("requires individual selection instead of offering a forced-method batch action", async () => {
    const screen = await render(<NewSettlementScreen />);

    expect(screen.getAllByTestId("settlement-balance")).toHaveLength(2);
    expect(screen.queryByText("Settle all")).toBeNull();
    expect(screen.getByText("Choose a balance to record a payment.")).toBeTruthy();
  });
});
