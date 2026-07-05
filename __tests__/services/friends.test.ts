/**
 * Tests for src/features/friends/services/api.ts (FriendsService)
 *
 * Note: FriendsService uses `supabase as any` so the mock is typed loosely.
 */

jest.mock("@/services/supabase/client");
jest.mock("react-native-url-polyfill/auto", () => ({}));

import { supabase } from "@/services/supabase/client";
import { FriendsService } from "@/features/friends/services/api";
import { DB_USER_ROW } from "../setup/fixtures";

const mockFrom = supabase.from as jest.Mock;

// A reusable friendship DB row
const DB_FRIENDSHIP_ROW = {
  id: "friend-1",
  user_id: "user-1",
  friend_id: "user-2",
  status: "accepted",
  metadata: {},
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
  user: DB_USER_ROW,
  friend: { ...DB_USER_ROW, id: "user-2", name: "Jordan Lee", email: "jordan@example.com", initials: "JL" },
};

function makeChain(options?: { terminalResult?: { data: unknown; error: unknown } }) {
  const result = options?.terminalResult ?? { data: [], error: null };
  const chain: Record<string, any> = {};
  const methods = ["select", "eq", "or", "update", "insert", "delete", "single", "maybeSingle"];
  methods.forEach((m) => { chain[m] = jest.fn().mockReturnValue(chain); });

  chain.then = jest.fn((resolve) => resolve(result));

  mockFrom.mockReturnValue(chain);
  return chain;
}

// ─── getFriends ───────────────────────────────────────────────────────────────

describe("FriendsService.getFriends", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns mapped accepted friendships with friendUser resolved", async () => {
    const chain = makeChain({ terminalResult: { data: [DB_FRIENDSHIP_ROW], error: null } });
    // The service chains: .from().select().or().eq() — last call must resolve
    chain["eq"] = jest.fn().mockResolvedValue({ data: [DB_FRIENDSHIP_ROW], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await FriendsService.getFriends("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("friend-1");
    expect(result[0].status).toBe("accepted");
    // user-1 is the initiator, so friendUser = friend data (user-2)
    expect(result[0].friendUser?.name).toBe("Jordan Lee");
  });

  it("returns empty array when no accepted friendships", async () => {
    const chain = makeChain();
    chain["eq"] = jest.fn().mockResolvedValue({ data: [], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await FriendsService.getFriends("user-1");
    expect(result).toHaveLength(0);
  });

  it("throws when query fails", async () => {
    const chain = makeChain();
    chain["eq"] = jest.fn().mockResolvedValue({ data: null, error: new Error("query error") });
    mockFrom.mockReturnValue(chain);

    await expect(FriendsService.getFriends("user-1")).rejects.toThrow("query error");
  });
});

// ─── getAllFriendships ────────────────────────────────────────────────────────

describe("FriendsService.getAllFriendships", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns all friendship statuses (not filtered by accepted)", async () => {
    const pendingRow = { ...DB_FRIENDSHIP_ROW, status: "pending" };
    const chain = makeChain();
    chain["or"] = jest.fn().mockResolvedValue({ data: [pendingRow], error: null });
    mockFrom.mockReturnValue(chain);

    const result = await FriendsService.getAllFriendships("user-1");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending");
  });
});

// ─── addFriend ────────────────────────────────────────────────────────────────

describe("FriendsService.addFriend", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a new pending friendship when none exists", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["select"] = jest.fn().mockReturnValue(chain);
    chain["or"] = jest.fn().mockReturnValue(chain);
    // maybeSingle: no existing friendship
    chain["maybeSingle"] = jest.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValueOnce(chain);

    // Second call: insert new friendship
    const insertChain: Record<string, jest.Mock> = {};
    insertChain["insert"] = jest.fn().mockReturnValue(insertChain);
    insertChain["select"] = jest.fn().mockReturnValue(insertChain);
    insertChain["single"] = jest.fn().mockResolvedValue({
      data: { ...DB_FRIENDSHIP_ROW, status: "pending" },
      error: null,
    });
    mockFrom.mockReturnValueOnce(insertChain);

    const result = await FriendsService.addFriend("user-1", "user-2");
    expect(result.status).toBe("pending");
    expect(result.userId).toBe("user-1");
    expect(result.friendId).toBe("user-2");
  });

  it("throws when friendship already exists and is accepted", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["select"] = jest.fn().mockReturnValue(chain);
    chain["or"] = jest.fn().mockReturnValue(chain);
    chain["maybeSingle"] = jest.fn().mockResolvedValue({
      data: { ...DB_FRIENDSHIP_ROW, status: "accepted" },
      error: null,
    });
    mockFrom.mockReturnValueOnce(chain);

    await expect(FriendsService.addFriend("user-1", "user-2")).rejects.toThrow(
      "already friends"
    );
  });

  it("updates metadata with groupId when pending friendship exists", async () => {
    const existingPending = { ...DB_FRIENDSHIP_ROW, status: "pending", metadata: {} };
    const chain: Record<string, jest.Mock> = {};
    chain["select"] = jest.fn().mockReturnValue(chain);
    chain["or"] = jest.fn().mockReturnValue(chain);
    chain["maybeSingle"] = jest.fn().mockResolvedValue({ data: existingPending, error: null });
    mockFrom.mockReturnValueOnce(chain);

    // update chain
    const updateChain: Record<string, jest.Mock> = {};
    updateChain["update"] = jest.fn().mockReturnValue(updateChain);
    updateChain["eq"] = jest.fn().mockReturnValue(updateChain);
    updateChain["select"] = jest.fn().mockReturnValue(updateChain);
    updateChain["single"] = jest.fn().mockResolvedValue({
      data: { ...existingPending, metadata: { pending_groups: ["group-1"] } },
      error: null,
    });
    mockFrom.mockReturnValueOnce(updateChain);

    const result = await FriendsService.addFriend("user-1", "user-2", "group-1");
    expect(result).toBeDefined();
    expect(updateChain["update"]).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { pending_groups: ["group-1"] } })
    );
  });
});

// ─── getPendingFriendRequests ─────────────────────────────────────────────────

describe("FriendsService.getPendingFriendRequests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("returns pending requests directed at the user", async () => {
    const pendingRow = { ...DB_FRIENDSHIP_ROW, status: "pending" };
    const chain: Record<string, jest.Mock> = {};
    chain["select"] = jest.fn().mockReturnValue(chain);
    chain["eq"] = jest.fn().mockReturnValue(chain);
    // Last .eq() call resolves
    const eqMock = jest.fn()
      .mockReturnValueOnce(chain) // friend_id eq
      .mockResolvedValueOnce({ data: [pendingRow], error: null }); // status eq
    chain["eq"] = eqMock;
    mockFrom.mockReturnValue(chain);

    const result = await FriendsService.getPendingFriendRequests("user-2");
    expect(result).toHaveLength(1);
    expect(result[0].status).toBe("pending");
  });
});

// ─── acceptFriendship ─────────────────────────────────────────────────────────

describe("FriendsService.acceptFriendship", () => {
  beforeEach(() => jest.clearAllMocks());

  it("updates status to accepted", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["update"] = jest.fn().mockReturnValue(chain);
    chain["eq"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(chain);

    await expect(FriendsService.acceptFriendship("friend-1")).resolves.not.toThrow();
    expect(chain["update"]).toHaveBeenCalledWith(
      expect.objectContaining({ status: "accepted" })
    );
  });

  it("throws on error", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["update"] = jest.fn().mockReturnValue(chain);
    chain["eq"] = jest.fn().mockResolvedValue({ error: new Error("update failed") });
    mockFrom.mockReturnValue(chain);

    await expect(FriendsService.acceptFriendship("friend-1")).rejects.toThrow("update failed");
  });
});

// ─── rejectFriendship ────────────────────────────────────────────────────────

describe("FriendsService.rejectFriendship", () => {
  beforeEach(() => jest.clearAllMocks());

  it("deletes the friendship row", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["delete"] = jest.fn().mockReturnValue(chain);
    chain["eq"] = jest.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue(chain);

    await expect(FriendsService.rejectFriendship("friend-1")).resolves.not.toThrow();
    expect(chain["delete"]).toHaveBeenCalled();
  });

  it("throws on error", async () => {
    const chain: Record<string, jest.Mock> = {};
    chain["delete"] = jest.fn().mockReturnValue(chain);
    chain["eq"] = jest.fn().mockResolvedValue({ error: new Error("delete failed") });
    mockFrom.mockReturnValue(chain);

    await expect(FriendsService.rejectFriendship("friend-1")).rejects.toThrow("delete failed");
  });
});
