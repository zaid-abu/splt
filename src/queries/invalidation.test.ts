import { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "./keys";
import { invalidateAfterMutation, MutationImpact } from "./invalidation";

function createMockClient(): {
  client: QueryClient;
  invalidated: unknown[][];
} {
  const invalidated: unknown[][] = [];
  const client = new QueryClient();
  client.invalidateQueries = jest.fn((filters?: { queryKey: unknown[] }) => {
    if (filters?.queryKey) {
      invalidated.push(filters.queryKey);
    }
    return Promise.resolve();
  }) as typeof client.invalidateQueries;
  return { client, invalidated };
}

describe("queryKeys", () => {
  it("home produces the correct key", () => {
    expect(queryKeys.home("u1")).toEqual(["home", "u1"]);
  });

  it("circles produces the correct key", () => {
    expect(queryKeys.circles("u1")).toEqual(["circles", "u1"]);
  });

  it("groupSnapshot produces the correct key", () => {
    expect(queryKeys.groupSnapshot("g1")).toEqual(["groups", "detail", "g1", "snapshot"]);
  });

  it("personSnapshot produces the correct key", () => {
    expect(queryKeys.personSnapshot("u2")).toEqual(["people", "detail", "u2", "snapshot"]);
  });

  it("openBalances produces the correct key", () => {
    expect(queryKeys.openBalances("u1")).toEqual(["balances", "open", "u1"]);
  });

  it("personDetail produces the correct key", () => {
    expect(queryKeys.personDetail("u2")).toEqual(["people", "u2"]);
  });
});

describe("invalidateAfterMutation", () => {
  it("invalidates always-invalidated keys plus impact-specific keys", async () => {
    const { client, invalidated } = createMockClient();

    const impact: MutationImpact = {
      currentUserId: "u1",
      groupIds: ["g1"],
      personIds: ["u2"],
      expenseIds: ["e1"],
      settlementIds: [],
      recurringIds: ["r1"],
      notifications: true,
    };

    await invalidateAfterMutation(client, impact);

    expect(invalidated).toEqual(
      expect.arrayContaining([
        queryKeys.home("u1"),
        queryKeys.circles("u1"),
        queryKeys.openBalances("u1"),
        queryKeys.expenses,
        queryKeys.settlements,
        queryKeys.activities,
        queryKeys.groupSnapshot("g1"),
        queryKeys.personSnapshot("u2"),
        queryKeys.expenseDetails("e1"),
        queryKeys.recurring.list("r1"),
        queryKeys.notifications("u1"),
      ])
    );
  });

  it("does not invalidate duplicate keys", async () => {
    const { client, invalidated } = createMockClient();

    const impact: MutationImpact = {
      currentUserId: "u1",
      groupIds: [],
      personIds: [],
      expenseIds: [],
      settlementIds: [],
      recurringIds: [],
      notifications: false,
    };

    await invalidateAfterMutation(client, impact);

    const homeKeys = invalidated.filter(
      (k) => JSON.stringify(k) === JSON.stringify(queryKeys.home("u1"))
    );
    expect(homeKeys).toHaveLength(1);
  });

  it("handles empty impact gracefully", async () => {
    const { client, invalidated } = createMockClient();

    const impact: MutationImpact = {
      currentUserId: "u1",
      groupIds: [],
      personIds: [],
      expenseIds: [],
      settlementIds: [],
      recurringIds: [],
      notifications: false,
    };

    await invalidateAfterMutation(client, impact);

    expect(invalidated.length).toBeGreaterThan(0);
  });
});
