/**
 * Tests for useDataStore — group CRUD operations and state transitions.
 *
 * Strategy: We reset the store to an empty state before each test, then
 * call actions and verify the resulting state.
 */

jest.mock("@/config/env", () => ({
  env: {
    EXPO_PUBLIC_SUPABASE_URL: "http://localhost",
    EXPO_PUBLIC_SUPABASE_ANON_KEY: "test-key",
  },
}));
jest.mock("react-native-url-polyfill/auto", () => ({}));

// Mock useUIStore so convertCurrency is a simple identity by default
jest.mock("@/store/useUIStore", () => ({
  useUIStore: {
    getState: () => ({
      preferredCurrency: { code: "USD" },
      convertCurrency: (amount: number) => amount,
    }),
  },
}));

import { useDataStore } from "@/store/useDataStore";
import { USER_1, USER_2, USER_3 } from "../setup/fixtures";
import type { Group } from "@/types";

// ─── Reset state before each test ─────────────────────────────────────────────

beforeEach(() => {
  useDataStore.setState({
    groups: [],
    expenses: [],
    activities: [],
    settlements: [],
  });
});

// ─── createGroup ──────────────────────────────────────────────────────────────

describe("useDataStore.createGroup", () => {
  it("adds a new group with the current user as a member", async () => {
    await useDataStore.getState().createGroup(
      { name: "Trip", icon: "Plane", currency: "USD", memberEmails: [] },
      USER_1
    );
    const { groups } = useDataStore.getState();
    expect(groups).toHaveLength(1);
    expect(groups[0].name).toBe("Trip");
    expect(groups[0].members[0].userId).toBe("user-1");
  });

  it("logs a group_created activity", async () => {
    await useDataStore.getState().createGroup(
      { name: "Trip", icon: "Plane", currency: "USD", memberEmails: [] },
      USER_1
    );
    const { activities } = useDataStore.getState();
    expect(activities).toHaveLength(1);
    expect(activities[0].type).toBe("group_created");
  });

  it("prepends the new group (most recent first)", async () => {
    await useDataStore.getState().createGroup(
      { name: "First", icon: "Home", currency: "USD", memberEmails: [] },
      USER_1
    );
    await useDataStore.getState().createGroup(
      { name: "Second", icon: "Car", currency: "USD", memberEmails: [] },
      USER_1
    );
    const { groups } = useDataStore.getState();
    expect(groups[0].name).toBe("Second");
    expect(groups[1].name).toBe("First");
  });

  it("sets simplifyDebts from input (default false)", async () => {
    await useDataStore.getState().createGroup(
      { name: "G", icon: "X", currency: "USD", memberEmails: [], simplifyDebts: true },
      USER_1
    );
    const { groups } = useDataStore.getState();
    expect(groups[0].simplifyDebts).toBe(true);
  });
});

// ─── updateGroup ──────────────────────────────────────────────────────────────

describe("useDataStore.updateGroup", () => {
  let group: Group;

  beforeEach(async () => {
    group = await useDataStore.getState().createGroup(
      { name: "Original", icon: "Home", currency: "USD", memberEmails: [] },
      USER_1
    );
  });

  it("updates the group name", async () => {
    await useDataStore.getState().updateGroup(group.id, { name: "Updated" });
    const updated = useDataStore.getState().getGroup(group.id);
    expect(updated?.name).toBe("Updated");
  });

  it("does not affect other groups", async () => {
    const other = await useDataStore.getState().createGroup(
      { name: "Other", icon: "Car", currency: "USD", memberEmails: [] },
      USER_2
    );
    await useDataStore.getState().updateGroup(group.id, { name: "Changed" });
    const otherGroup = useDataStore.getState().getGroup(other.id);
    expect(otherGroup?.name).toBe("Other");
  });
});

// ─── addGroupMembers ──────────────────────────────────────────────────────────

describe("useDataStore.addGroupMembers", () => {
  let group: Group;

  beforeEach(async () => {
    group = await useDataStore.getState().createGroup(
      { name: "G", icon: "H", currency: "USD", memberEmails: [] },
      USER_1
    );
  });

  it("adds new members to the group", () => {
    useDataStore.getState().addGroupMembers(group.id, [USER_2, USER_3]);
    const updated = useDataStore.getState().getGroup(group.id);
    expect(updated?.members).toHaveLength(3); // USER_1 (creator) + USER_2 + USER_3
  });

  it("does not add duplicate members", () => {
    useDataStore.getState().addGroupMembers(group.id, [USER_1]); // USER_1 already a member
    const updated = useDataStore.getState().getGroup(group.id);
    expect(updated?.members).toHaveLength(1);
  });
});

// ─── removeGroupMember ────────────────────────────────────────────────────────

describe("useDataStore.removeGroupMember", () => {
  let group: Group;

  beforeEach(async () => {
    group = await useDataStore.getState().createGroup(
      { name: "G", icon: "H", currency: "USD", memberEmails: [] },
      USER_1
    );
    useDataStore.getState().addGroupMembers(group.id, [USER_2]);
  });

  it("removes the specified member", () => {
    useDataStore.getState().removeGroupMember(group.id, "user-2");
    const updated = useDataStore.getState().getGroup(group.id);
    expect(updated?.members).toHaveLength(1);
    expect(updated?.members[0].userId).toBe("user-1");
  });

  it("does not affect other members", () => {
    useDataStore.getState().removeGroupMember(group.id, "user-2");
    const updated = useDataStore.getState().getGroup(group.id);
    expect(updated?.members.some((m) => m.userId === "user-1")).toBe(true);
  });
});

// ─── deleteGroup ──────────────────────────────────────────────────────────────

describe("useDataStore.deleteGroup", () => {
  it("removes the group from state", async () => {
    const group = await useDataStore.getState().createGroup(
      { name: "G", icon: "H", currency: "USD", memberEmails: [] },
      USER_1
    );
    useDataStore.getState().deleteGroup(group.id);
    expect(useDataStore.getState().groups).toHaveLength(0);
  });

  it("does not remove other groups", async () => {
    const g1 = await useDataStore.getState().createGroup(
      { name: "G1", icon: "A", currency: "USD", memberEmails: [] },
      USER_1
    );
    await useDataStore.getState().createGroup(
      { name: "G2", icon: "B", currency: "USD", memberEmails: [] },
      USER_1
    );
    useDataStore.getState().deleteGroup(g1.id);
    expect(useDataStore.getState().groups).toHaveLength(1);
    expect(useDataStore.getState().groups[0].name).toBe("G2");
  });
});

// ─── getGroup ─────────────────────────────────────────────────────────────────

describe("useDataStore.getGroup", () => {
  it("returns the group with the given id", async () => {
    const group = await useDataStore.getState().createGroup(
      { name: "G", icon: "H", currency: "USD", memberEmails: [] },
      USER_1
    );
    expect(useDataStore.getState().getGroup(group.id)).toBeDefined();
    expect(useDataStore.getState().getGroup(group.id)?.name).toBe("G");
  });

  it("returns undefined for an unknown id", () => {
    expect(useDataStore.getState().getGroup("nonexistent")).toBeUndefined();
  });
});
