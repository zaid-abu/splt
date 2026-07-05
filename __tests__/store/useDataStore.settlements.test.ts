/**
 * Tests for useDataStore — settlements and activity deletion.
 */

jest.mock("@/config/env", () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: "http://localhost",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

jest.mock("@/store/useUIStore", () => ({
  useUIStore: {
    getState: () => ({
      preferredCurrency: { code: "USD" },
      convertCurrency: (amount: number) => amount,
    }),
  },
}));

import { useDataStore } from "@/store/useDataStore";
import { USER_1, USER_2, USER_3, GROUP_1 } from "../setup/fixtures";

beforeEach(() => {
  useDataStore.setState({
    groups: [
      {
        ...GROUP_1,
        members: [
          { userId: "user-1", user: USER_1, balance: 0 },
          { userId: "user-2", user: USER_2, balance: 0 },
          { userId: "user-3", user: USER_3, balance: 0 },
        ],
      },
    ],
    expenses: [],
    activities: [],
    settlements: [],
  });
});

// ─── addSettlement ────────────────────────────────────────────────────────────

describe("useDataStore.addSettlement", () => {
  it("adds settlement to state", async () => {
    await useDataStore.getState().addSettlement(
      {
        groupId: "group-1",
        fromUserId: "user-2",
        toUserId: "user-1",
        amount: 100,
        currency: "USD",
        date: new Date("2025-03-15"),
      },
      USER_1
    );
    expect(useDataStore.getState().settlements).toHaveLength(1);
    expect(useDataStore.getState().settlements[0].amount).toBe(100);
    expect(useDataStore.getState().settlements[0].fromUserId).toBe("user-2");
  });

  it("resolves fromUser and toUser from group members", async () => {
    await useDataStore.getState().addSettlement(
      {
        groupId: "group-1",
        fromUserId: "user-2",
        toUserId: "user-1",
        amount: 50,
        currency: "USD",
        date: new Date(),
      },
      USER_1
    );
    const settlement = useDataStore.getState().settlements[0];
    expect(settlement.fromUser.name).toBe("Jordan Lee");
    expect(settlement.toUser.name).toBe("Alex Chen");
  });

  it("logs a settlement activity", async () => {
    await useDataStore.getState().addSettlement(
      {
        groupId: "group-1",
        fromUserId: "user-2",
        toUserId: "user-1",
        amount: 100,
        currency: "USD",
        date: new Date(),
      },
      USER_1 // currentUser is user-1 (toUser) → "X paid you"
    );
    const activity = useDataStore.getState().activities[0];
    expect(activity.type).toBe("settlement");
    expect(activity.description).toContain("paid");
  });

  it("generates 'You paid X' description when currentUser is the payer", async () => {
    await useDataStore.getState().addSettlement(
      {
        fromUserId: "user-1",
        toUserId: "user-2",
        amount: 50,
        currency: "USD",
        date: new Date(),
      },
      USER_1 // currentUser === fromUser
    );
    const activity = useDataStore.getState().activities[0];
    expect(activity.description).toContain("You paid");
  });

  it("generates 'X paid you' description when currentUser is the receiver", async () => {
    await useDataStore.getState().addSettlement(
      {
        fromUserId: "user-2",
        toUserId: "user-1",
        amount: 50,
        currency: "USD",
        date: new Date(),
      },
      USER_1 // currentUser === toUser
    );
    const activity = useDataStore.getState().activities[0];
    expect(activity.description).toContain("paid you");
  });
});

// ─── deleteActivity ───────────────────────────────────────────────────────────

describe("useDataStore.deleteActivity", () => {
  it("removes a standalone activity (no expense linked)", async () => {
    // Manually inject an activity with no expense
    useDataStore.setState({
      activities: [
        {
          id: "act-solo",
          type: "group_created",
          userId: "user-1",
          user: USER_1,
          description: "Created a group",
          date: new Date(),
        },
      ],
    });

    await useDataStore.getState().deleteActivity("act-solo");
    expect(useDataStore.getState().activities).toHaveLength(0);
  });

  it("deletes the linked expense when the activity has one", async () => {
    // Add an expense (which logs an activity automatically)
    const expense = await useDataStore.getState().addExpense(
      {
        groupId: "group-1",
        title: "Dinner",
        amount: 300,
        currency: "USD",
        category: "food",
        paidBy: "user-1",
        splits: [{ userId: "user-1", user: USER_1, amount: 300 }],
        splitMethod: "equal",
        date: new Date(),
      },
      USER_1
    );

    const activity = useDataStore.getState().activities.find(
      (a) => a.expense?.id === expense.id
    );
    expect(activity).toBeDefined();

    await useDataStore.getState().deleteActivity(activity!.id);

    // Both the expense and its activity should be gone
    expect(useDataStore.getState().expenses.find((e) => e.id === expense.id)).toBeUndefined();
    expect(useDataStore.getState().activities.find((a) => a.id === activity!.id)).toBeUndefined();
  });

  it("does nothing for a non-existent activity id", async () => {
    useDataStore.setState({ activities: [] });
    await expect(
      useDataStore.getState().deleteActivity("nonexistent")
    ).resolves.not.toThrow();
  });
});
