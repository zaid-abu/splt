/**
 * Tests for src/features/settlements/services/api.ts (settlementsApi)
 */

jest.mock("@/services/supabase/client");
jest.mock("react-native-url-polyfill/auto", () => ({}));

import { supabase } from "@/services/supabase/client";
import { settlementsApi } from "@/features/settlements/services/api";
import { DB_SETTLEMENT_ROW } from "../setup/fixtures";

const mockFrom = supabase.from as jest.Mock;

function makeChain(terminalResult: { data: unknown; error: unknown }) {
  const chain: Record<string, any> = {};
  const methods = ["select", "eq", "or", "order", "returns", "insert", "delete", "single"];
  methods.forEach((m) => { chain[m] = jest.fn().mockReturnValue(chain); });
  
  chain.then = jest.fn((resolve) => resolve(terminalResult));
  
  mockFrom.mockReturnValue(chain);
  return chain;
}

// ─── fetchGroupSettlements ────────────────────────────────────────────────────

describe("settlementsApi.fetchGroupSettlements", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns mapped settlements for a group", async () => {
    makeChain({ data: [DB_SETTLEMENT_ROW], error: null });
    const result = await settlementsApi.fetchGroupSettlements("group-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("settle-1");
    expect(result[0].amount).toBe(100);
  });

  it("returns empty array when data is null", async () => {
    makeChain({ data: null, error: null });
    const result = await settlementsApi.fetchGroupSettlements("group-1");
    expect(result).toHaveLength(0);
  });

  it("throws when supabase returns an error", async () => {
    makeChain({ data: null, error: new Error("fetch error") });
    await expect(settlementsApi.fetchGroupSettlements("group-1")).rejects.toThrow("fetch error");
  });
});

// ─── fetchUserSettlements ─────────────────────────────────────────────────────

describe("settlementsApi.fetchUserSettlements", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns settlements where user is fromUser or toUser", async () => {
    const chain = makeChain({ data: [DB_SETTLEMENT_ROW], error: null });
    const result = await settlementsApi.fetchUserSettlements("user-1");
    expect(result).toHaveLength(1);
    // Verify the .or() filter was called with the user ID
    expect(chain["or"]).toHaveBeenCalledWith(
      expect.stringContaining("user-1")
    );
  });

  it("returns empty array when no settlements", async () => {
    makeChain({ data: [], error: null });
    const result = await settlementsApi.fetchUserSettlements("user-1");
    expect(result).toHaveLength(0);
  });

  it("throws on error", async () => {
    makeChain({ data: null, error: new Error("DB error") });
    await expect(settlementsApi.fetchUserSettlements("user-1")).rejects.toThrow("DB error");
  });
});

// ─── addSettlement ────────────────────────────────────────────────────────────

describe("settlementsApi.addSettlement", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts settlement and returns mapped result", async () => {
    makeChain({ data: DB_SETTLEMENT_ROW, error: null });
    const result = await settlementsApi.addSettlement({
      groupId: "group-1",
      fromUserId: "user-2",
      toUserId: "user-1",
      amount: 100,
      currency: "USD",
      date: new Date("2025-03-15"),
    });
    expect(result.id).toBe("settle-1");
    expect(result.fromUserId).toBe("user-2");
    expect(result.toUserId).toBe("user-1");
  });

  it("throws when insert fails", async () => {
    makeChain({ data: null, error: new Error("insert error") });
    await expect(
      settlementsApi.addSettlement({ fromUserId: "user-2", toUserId: "user-1", amount: 50 })
    ).rejects.toThrow("insert error");
  });
});

// ─── deleteSettlement ─────────────────────────────────────────────────────────

describe("settlementsApi.deleteSettlement", () => {
  beforeEach(() => jest.clearAllMocks());

  it("calls delete on the settlements table", async () => {
    const deleteChain: Record<string, jest.Mock> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(deleteChain);

    await expect(settlementsApi.deleteSettlement("settle-1")).resolves.not.toThrow();
    expect(deleteChain["delete"]).toHaveBeenCalled();
  });

  it("throws when delete fails", async () => {
    const deleteChain: Record<string, jest.Mock> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockResolvedValue({ error: new Error("delete error") });
    mockFrom.mockReturnValue(deleteChain);

    await expect(settlementsApi.deleteSettlement("settle-1")).rejects.toThrow("delete error");
  });
});
