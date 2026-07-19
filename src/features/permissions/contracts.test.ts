import {
  getExpensePermissions,
  getGroupPermissions,
  getRelationshipPermissions,
} from "./contracts";

describe("getExpensePermissions", () => {
  it("expense creator can edit and delete without confirmation", () => {
    const result = getExpensePermissions({
      currentUserId: "alice",
      createdBy: "alice",
      groupCreatedBy: "bob",
    });
    expect(result).toEqual({
      canEdit: true,
      canDelete: true,
      deleteNeedsOwnerConfirmation: false,
    });
  });

  it("group creator can delete but not edit, needs owner confirmation", () => {
    const result = getExpensePermissions({
      currentUserId: "owner",
      createdBy: "creator",
      groupCreatedBy: "owner",
    });
    expect(result).toEqual({
      canEdit: false,
      canDelete: true,
      deleteNeedsOwnerConfirmation: true,
    });
  });

  it("neither creator nor group creator cannot edit or delete", () => {
    const result = getExpensePermissions({
      currentUserId: "stranger",
      createdBy: "creator",
      groupCreatedBy: "owner",
    });
    expect(result).toEqual({
      canEdit: false,
      canDelete: false,
      deleteNeedsOwnerConfirmation: false,
    });
  });

  it("handles missing groupCreatedBy for direct expenses", () => {
    const result = getExpensePermissions({
      currentUserId: "stranger",
      createdBy: "creator",
    });
    expect(result).toEqual({
      canEdit: false,
      canDelete: false,
      deleteNeedsOwnerConfirmation: false,
    });
  });

  it("group creator who is also expense creator gets full access", () => {
    const result = getExpensePermissions({
      currentUserId: "alice",
      createdBy: "alice",
      groupCreatedBy: "alice",
    });
    expect(result).toEqual({
      canEdit: true,
      canDelete: true,
      deleteNeedsOwnerConfirmation: false,
    });
  });

  it("group creator deletion flag when groupCreatedBy undefined", () => {
    const result = getExpensePermissions({
      currentUserId: "owner",
      createdBy: "creator",
    });
    expect(result).toEqual({
      canEdit: false,
      canDelete: false,
      deleteNeedsOwnerConfirmation: false,
    });
  });
});

describe("getGroupPermissions", () => {
  it("creator can edit, delete, add members, and cannot leave", () => {
    const result = getGroupPermissions({
      currentUserId: "alice",
      createdBy: "alice",
      memberIds: ["alice", "bob"],
    });
    expect(result.canEdit).toBe(true);
    expect(result.canDelete).toBe(true);
    expect(result.canLeave).toBe(false);
    expect(result.canAddMember).toBe(true);
  });

  it("creator can leave when they are the only member", () => {
    const result = getGroupPermissions({
      currentUserId: "alice",
      createdBy: "alice",
      memberIds: ["alice"],
    });
    expect(result.canLeave).toBe(true);
  });

  it("non-creator member can leave but cannot edit or delete", () => {
    const result = getGroupPermissions({
      currentUserId: "bob",
      createdBy: "alice",
      memberIds: ["alice", "bob"],
    });
    expect(result.canEdit).toBe(false);
    expect(result.canDelete).toBe(false);
    expect(result.canLeave).toBe(true);
    expect(result.canAddMember).toBe(false);
  });

  it("creator can remove other members but not themselves", () => {
    const result = getGroupPermissions({
      currentUserId: "alice",
      createdBy: "alice",
      memberIds: ["alice", "bob", "charlie"],
    });
    expect(result.canRemoveMember("bob")).toBe(true);
    expect(result.canRemoveMember("charlie")).toBe(true);
    expect(result.canRemoveMember("alice")).toBe(false);
  });

  it("non-creator cannot remove any member", () => {
    const result = getGroupPermissions({
      currentUserId: "bob",
      createdBy: "alice",
      memberIds: ["alice", "bob"],
    });
    expect(result.canRemoveMember("alice")).toBe(false);
    expect(result.canRemoveMember("charlie")).toBe(false);
  });

  it("empty member list defaults", () => {
    const result = getGroupPermissions({
      currentUserId: "alice",
      createdBy: "alice",
      memberIds: [],
    });
    expect(result.canLeave).toBe(true);
    expect(result.canRemoveMember("anyone")).toBe(false);
  });
});

describe("getRelationshipPermissions", () => {
  it("can send request when no existing friendship", () => {
    const result = getRelationshipPermissions({
      currentUserId: "alice",
      targetUserId: "bob",
      friendshipStatus: undefined,
    });
    expect(result.canSendRequest).toBe(true);
    expect(result.canCancelRequest).toBe(false);
    expect(result.canAcceptRequest).toBe(false);
    expect(result.canRejectRequest).toBe(false);
    expect(result.canBlock).toBe(false);
    expect(result.canUnblock).toBe(false);
  });

  it("can cancel or accept/decline pending request", () => {
    const result = getRelationshipPermissions({
      currentUserId: "alice",
      targetUserId: "bob",
      friendshipStatus: "pending",
    });
    expect(result.canSendRequest).toBe(false);
    expect(result.canCancelRequest).toBe(true);
    expect(result.canAcceptRequest).toBe(true);
    expect(result.canRejectRequest).toBe(true);
    expect(result.canBlock).toBe(true);
    expect(result.canUnblock).toBe(false);
  });

  it("can remove friend and block when accepted", () => {
    const result = getRelationshipPermissions({
      currentUserId: "alice",
      targetUserId: "bob",
      friendshipStatus: "accepted",
    });
    expect(result.canSendRequest).toBe(false);
    expect(result.canRemoveFriend).toBe(true);
    expect(result.canBlock).toBe(true);
    expect(result.canUnblock).toBe(false);
  });

  it("can unblock when blocked", () => {
    const result = getRelationshipPermissions({
      currentUserId: "alice",
      targetUserId: "bob",
      friendshipStatus: "blocked",
    });
    expect(result.canSendRequest).toBe(false);
    expect(result.canRemoveFriend).toBe(false);
    expect(result.canBlock).toBe(false);
    expect(result.canUnblock).toBe(true);
  });

  it("can re-send request when declined or removed", () => {
    for (const status of ["declined", "removed"] as const) {
      const result = getRelationshipPermissions({
        currentUserId: "alice",
        targetUserId: "bob",
        friendshipStatus: status,
      });
      expect(result.canSendRequest).toBe(true);
      expect(result.canBlock).toBe(true);
    }
  });

  it("blocked settlement exception: no actions possible when blocked", () => {
    const result = getRelationshipPermissions({
      currentUserId: "alice",
      targetUserId: "bob",
      friendshipStatus: "blocked",
    });
    expect(result.canSendRequest).toBe(false);
    expect(result.canRemoveFriend).toBe(false);
  });
});
