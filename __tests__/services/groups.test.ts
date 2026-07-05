/**
 * Tests for src/features/groups/services/api.ts (groupsApi)
 */

jest.mock("@/services/supabase/client");
jest.mock("react-native-url-polyfill/auto", () => ({}));

import { supabase } from "@/services/supabase/client";
import { groupsApi } from "@/features/groups/services/api";
import { DB_GROUP_ROW } from "../setup/fixtures";

const mockFrom = supabase.from as jest.Mock;

// Chain builder shared across tests
function makeChain(options: { result: { data: unknown; error: unknown; count?: number } }) {
  const chain: Record<string, any> = {};
  const methods = ["select", "eq", "in", "order", "insert", "update", "delete", "single", "maybeSingle", "returns"];
  methods.forEach((m) => { chain[m] = jest.fn().mockReturnValue(chain); });

  // Make the chain itself awaitable
  chain.then = jest.fn((resolve) => resolve(options.result));
  return chain;
}

// ─── fetchGroups ──────────────────────────────────────────────────────────────

describe("groupsApi.fetchGroups", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns empty array when user has no memberships", async () => {
    // First call: group_members
    const membChain: Record<string, jest.Mock> = {};
    ["select", "eq"].forEach((m) => { membChain[m] = jest.fn().mockReturnValue(membChain); });
    membChain["eq"] = jest.fn().mockResolvedValue({ data: [], error: null });
    membChain["select"] = jest.fn().mockReturnValue(membChain);
    mockFrom.mockReturnValueOnce(membChain);

    const result = await groupsApi.fetchGroups("user-1");
    expect(result).toHaveLength(0);
  });

  it("fetches groups for membership IDs", async () => {
    // group_members chain
    const membChain: Record<string, jest.Mock> = {};
    ["select", "eq"].forEach((m) => { membChain[m] = jest.fn().mockReturnValue(membChain); });
    membChain["eq"] = jest.fn().mockResolvedValue({ data: [{ group_id: "group-1" }], error: null });
    membChain["select"] = jest.fn().mockReturnValue(membChain);
    mockFrom.mockReturnValueOnce(membChain);

    // groups chain
    mockFrom.mockReturnValue(makeChain({ result: { data: [DB_GROUP_ROW], error: null } }));

    const result = await groupsApi.fetchGroups("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("group-1");
  });

  it("throws when memberships query fails", async () => {
    const membChain: Record<string, jest.Mock> = {};
    ["select", "eq"].forEach((m) => { membChain[m] = jest.fn().mockReturnValue(membChain); });
    membChain["eq"] = jest.fn().mockResolvedValue({ data: null, error: new Error("membership error") });
    membChain["select"] = jest.fn().mockReturnValue(membChain);
    mockFrom.mockReturnValueOnce(membChain);
    await expect(groupsApi.fetchGroups("user-1")).rejects.toThrow("membership error");
  });
});

// ─── fetchGroup ───────────────────────────────────────────────────────────────

describe("groupsApi.fetchGroup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns a mapped group", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: DB_GROUP_ROW, error: null } }));
    const result = await groupsApi.fetchGroup("group-1");
    expect(result.id).toBe("group-1");
    expect(result.name).toBe("Tokyo Trip");
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: null, error: new Error("not found") } }));
    await expect(groupsApi.fetchGroup("group-99")).rejects.toThrow("not found");
  });
});

// ─── createGroup ──────────────────────────────────────────────────────────────

describe("groupsApi.createGroup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts group and fetches with members", async () => {
    // insert → single
    const insertChain = makeChain({ result: { data: { id: "group-1" }, error: null } });
    mockFrom.mockReturnValueOnce(insertChain);

    // fetchGroup
    mockFrom.mockReturnValueOnce(makeChain({ result: { data: DB_GROUP_ROW, error: null } }));

    const result = await groupsApi.createGroup({ name: "New Group", icon: "Home", currency: "USD", createdBy: "user-1" });
    expect(result.id).toBe("group-1");
  });

  it("calls addMembers when members are provided", async () => {
    // insert chain
    const insertChain = makeChain({ result: { data: { id: "group-new" }, error: null } });
    mockFrom.mockReturnValueOnce(insertChain);

    // addMembers insert chain
    const memberChain = makeChain({ result: { data: null, error: null } });
    mockFrom.mockReturnValueOnce(memberChain);

    // fetchGroup
    mockFrom.mockReturnValueOnce(makeChain({ result: { data: DB_GROUP_ROW, error: null } }));

    await groupsApi.createGroup({
      name: "New Group",
      icon: "Home",
      currency: "USD",
      createdBy: "user-1",
      members: [{ userId: "user-2", user: {} as any, balance: 0 }],
    });

    // Verify addMembers was invoked (group_members insert)
    expect(memberChain["insert"]).toHaveBeenCalled();
  });

  it("throws when insert fails", async () => {
    const insertChain = makeChain({ result: { data: null, error: new Error("insert failed") } });
    mockFrom.mockReturnValueOnce(insertChain);

    await expect(groupsApi.createGroup({ name: "X" })).rejects.toThrow("insert failed");
  });
});

// ─── updateGroup ──────────────────────────────────────────────────────────────

describe("groupsApi.updateGroup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates group and returns mapped result", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: DB_GROUP_ROW, error: null } }));
    const result = await groupsApi.updateGroup("group-1", { name: "Updated Name" });
    expect(result.id).toBe("group-1");
  });

  it("throws when data is null (no permission)", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: null, error: null } }));
    await expect(groupsApi.updateGroup("group-1", { name: "X" })).rejects.toThrow(
      "do not have permission"
    );
  });

  it("throws when error is returned", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: null, error: new Error("forbidden") } }));
    await expect(groupsApi.updateGroup("group-1", {})).rejects.toThrow("forbidden");
  });
});

// ─── deleteGroup ──────────────────────────────────────────────────────────────

describe("groupsApi.deleteGroup", () => {
  beforeEach(() => jest.clearAllMocks());

  it("successfully deletes a group", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: null, error: null } }));
    await expect(groupsApi.deleteGroup("group-1")).resolves.not.toThrow();
  });

  it("throws on error", async () => {
    mockFrom.mockReturnValue(makeChain({ result: { data: null, error: new Error("delete error") } }));
    await expect(groupsApi.deleteGroup("group-1")).rejects.toThrow("delete error");
  });
});

// ─── addMembers ───────────────────────────────────────────────────────────────

describe("groupsApi.addMembers", () => {
  beforeEach(() => jest.clearAllMocks());

  it("inserts each unique member individually", async () => {
    const insertChain = makeChain({ result: { data: null, error: null } });
    mockFrom.mockReturnValue(insertChain);

    await groupsApi.addMembers("group-1", ["user-1", "user-2"]);
    // Called once per unique ID
    expect(insertChain["insert"]).toHaveBeenCalledTimes(2);
  });

  it("deduplicates member IDs", async () => {
    const insertChain = makeChain({ result: { data: null, error: null } });
    mockFrom.mockReturnValue(insertChain);

    await groupsApi.addMembers("group-1", ["user-1", "user-1", "user-2"]);
    expect(insertChain["insert"]).toHaveBeenCalledTimes(2);
  });

  it("throws when an insert fails", async () => {
    const insertChain = makeChain({ result: { data: null, error: new Error("insert error") } });
    mockFrom.mockReturnValue(insertChain);

    await expect(groupsApi.addMembers("group-1", ["user-1"])).rejects.toThrow("insert error");
  });
});

// ─── removeMember ─────────────────────────────────────────────────────────────

describe("groupsApi.removeMember", () => {
  beforeEach(() => jest.clearAllMocks());

  it("successfully removes a member", async () => {
    const deleteChain: Record<string, any> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain.then = jest.fn((resolve) => resolve({ error: null, count: 1 }));
    mockFrom.mockReturnValue(deleteChain);
    mockFrom.mockReturnValue(deleteChain);

    await expect(groupsApi.removeMember("group-1", "user-2")).resolves.not.toThrow();
  });

  it("throws when count is 0 (no permission)", async () => {
    const deleteChain: Record<string, any> = {};
    deleteChain["delete"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain["eq"] = jest.fn().mockReturnValue(deleteChain);
    deleteChain.then = jest.fn((resolve) => resolve({ error: null, count: 0 }));
    mockFrom.mockReturnValue(deleteChain);

    await expect(groupsApi.removeMember("group-1", "user-2")).rejects.toThrow(
      "do not have permission"
    );
  });
});
