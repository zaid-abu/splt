import {
  mapUser,
  mapGroup,
  mapGroupMember,
  mapExpense,
  mapExpenseSplit,
  mapSettlement,
  mapActivity,
  mapFriendship,
  mapGroupInvitation,
  mapFriendInvite,
  mapNotification,
  mapReceiptUpload,
  mapExpenseComment,
} from "./mappers";
import type { Tables } from "@/services/supabase/database.types";

const defaultDate = "2026-07-19T10:00:00.000Z";

describe("mapUser", () => {
  it("maps account setup state", () => {
    const row = {
      id: "user-1",
      name: "Abu Zaid",
      email: "abu@example.com",
      avatar: null,
      initials: "AZ",
      default_currency: "USD",
      setup_state: "activation_pending",
      created_at: defaultDate,
      updated_at: defaultDate,
    } as Tables<"users">;

    expect(mapUser(row)).toMatchObject({
      id: "user-1",
      setupState: "activation_pending",
    });
  });
});

describe("mapGroupMember", () => {
  it("maps new_expense_alerts", () => {
    const row = {
      group_id: "g-1",
      user_id: "u-1",
      balance: 15.5,
      new_expense_alerts: false,
      created_at: defaultDate,
    } as Tables<"group_members">;

    const result = mapGroupMember(row);
    expect(result.newExpenseAlerts).toBe(false);
  });
});

describe("mapGroup", () => {
  it("maps kind and archived_at", () => {
    const row = {
      id: "g-1",
      name: "Trip",
      kind: "trip",
      icon: "plane",
      description: null,
      currency: "USD",
      archived_at: null,
      created_at: defaultDate,
      created_by: "u-1",
      total_expenses: 100,
      simplify_debts: false,
      default_split_method: "equal",
      client_operation_id: null,
      updated_at: defaultDate,
      members: [],
    } as Tables<"groups"> & { members?: never[] };

    const result = mapGroup(row);
    expect(result.kind).toBe("trip");
    expect(result.archivedAt).toBeNull();
  });

  it("maps archived_at as Date when present", () => {
    const row = {
      id: "g-1",
      name: "Trip",
      kind: null,
      icon: "plane",
      description: null,
      currency: "USD",
      archived_at: "2026-08-01T00:00:00.000Z",
      created_at: defaultDate,
      created_by: "u-1",
      total_expenses: 100,
      simplify_debts: false,
      default_split_method: "equal",
      client_operation_id: null,
      updated_at: defaultDate,
      members: [],
    } as Tables<"groups"> & { members?: never[] };

    const result = mapGroup(row);
    expect(result.archivedAt).toEqual(new Date("2026-08-01T00:00:00.000Z"));
  });
});

describe("mapExpenseSplit", () => {
  it("maps amount_minor, shares, and position", () => {
    const row = {
      id: "es-1",
      expense_id: "e-1",
      user_id: "u-1",
      amount: 10,
      amount_minor: 1000,
      percentage: null,
      shares: null,
      position: 0,
      paid: false,
      created_at: defaultDate,
    } as Tables<"expense_splits">;

    const result = mapExpenseSplit(row);
    expect(result.amountMinor).toBe(1000);
    expect(result.shares).toBeUndefined();
    expect(result.position).toBe(0);
  });

  it("maps shares when present", () => {
    const row = {
      id: "es-2",
      expense_id: "e-1",
      user_id: "u-2",
      amount: 20,
      amount_minor: 2000,
      percentage: null,
      shares: 3.5,
      position: 1,
      paid: false,
      created_at: defaultDate,
    } as Tables<"expense_splits">;

    const result = mapExpenseSplit(row);
    expect(result.shares).toBe(3.5);
    expect(result.position).toBe(1);
  });
});

describe("mapExpense", () => {
  const baseRow = {
    id: "e-1",
    group_id: "g-1",
    friendship_id: null,
    title: "Dinner",
    amount: 50,
    amount_minor: 5000,
    currency: "USD",
    category: "food" as const,
    paid_by: "u-1",
    created_by: "u-1",
    split_method: "equal" as const,
    date: defaultDate,
    notes: null,
    receipt_url: "https://example.com/receipt.jpg",
    receipt_key: null,
    client_operation_id: null,
    recurring_expense_id: null,
    created_at: defaultDate,
    updated_at: defaultDate,
  };

  it("maps amount_minor", () => {
    const row = { ...baseRow, splits: [] } as any;
    expect(mapExpense(row).amountMinor).toBe(5000);
  });

  it("maps created_by", () => {
    const row = { ...baseRow, splits: [] } as any;
    expect(mapExpense(row).createdBy).toBe("u-1");
  });

  it("maps friendshipId when present", () => {
    const row = { ...baseRow, group_id: null, friendship_id: "f-1", splits: [] } as any;
    expect(mapExpense(row).friendshipId).toBe("f-1");
    expect(mapExpense(row).groupId).toBeUndefined();
  });

  it("maps receiptKey and legacyReceiptUrl correctly", () => {
    const rowWithKey = { ...baseRow, receipt_key: "abc123", splits: [] } as any;
    const mappedWithKey = mapExpense(rowWithKey);
    expect(mappedWithKey.receiptKey).toBe("abc123");
    expect(mappedWithKey.legacyReceiptUrl).toBeUndefined();

    const rowWithoutKey = { ...baseRow, splits: [] } as any;
    const mappedWithoutKey = mapExpense(rowWithoutKey);
    expect(mappedWithoutKey.receiptKey).toBeUndefined();
    expect(mappedWithoutKey.legacyReceiptUrl).toBe("https://example.com/receipt.jpg");
  });
});

describe("mapSettlement", () => {
  const baseRow = {
    id: "s-1",
    group_id: null,
    friendship_id: "f-1",
    from_user_id: "u-1",
    to_user_id: "u-2",
    amount: 25,
    amount_minor: 2500,
    currency: "USD",
    method: "cash" as const,
    date: defaultDate,
    note: null,
    client_operation_id: null,
    created_at: defaultDate,
  };

  it("maps amount_minor", () => {
    expect(mapSettlement(baseRow as any).amountMinor).toBe(2500);
  });

  it("maps method", () => {
    expect(mapSettlement(baseRow as any).method).toBe("cash");
  });

  it("maps friendshipId", () => {
    expect(mapSettlement(baseRow as any).friendshipId).toBe("f-1");
  });

  it("maps groupId when present", () => {
    const row = { ...baseRow, group_id: "g-1", friendship_id: null };
    const result = mapSettlement(row as any);
    expect(result.groupId).toBe("g-1");
    expect(result.friendshipId).toBeUndefined();
  });
});

describe("mapActivity", () => {
  it("maps amount_minor", () => {
    const row = {
      id: "a-1",
      type: "expense" as const,
      group_id: "g-1",
      expense_id: null,
      settlement_id: null,
      user_id: "u-1",
      description: "test",
      amount: 50,
      amount_minor: 5000,
      currency: "USD",
      date: defaultDate,
      created_at: defaultDate,
    } as Tables<"activities">;

    const result = mapActivity(row as any);
    expect(result.amountMinor).toBe(5000);
  });

  it("handles null amount_minor", () => {
    const row = {
      id: "a-2",
      type: "member_joined" as const,
      group_id: "g-1",
      expense_id: null,
      settlement_id: null,
      user_id: "u-1",
      description: "joined",
      amount: null,
      amount_minor: null,
      currency: null,
      date: defaultDate,
      created_at: defaultDate,
    } as Tables<"activities">;

    const result = mapActivity(row as any);
    expect(result.amountMinor).toBeUndefined();
  });
});

describe("mapFriendship", () => {
  it("maps new friendship lifecycle fields", () => {
    const row = {
      id: "f-1",
      user_id: "u-1",
      friend_id: "u-2",
      status: "accepted" as const,
      metadata: null,
      requested_by: "u-1",
      blocked_by: null,
      request_expires_at: null,
      status_before_block: null,
      created_at: defaultDate,
      updated_at: defaultDate,
    } as Tables<"friendships">;

    const result = mapFriendship(row as any);
    expect(result.requestedBy).toBe("u-1");
    expect(result.blockedBy).toBeUndefined();
    expect(result.requestExpiresAt).toBeUndefined();
    expect(result.statusBeforeBlock).toBeUndefined();
  });

  it("maps status_before_block when blocked", () => {
    const row = {
      id: "f-2",
      user_id: "u-1",
      friend_id: "u-2",
      status: "blocked" as const,
      metadata: null,
      requested_by: "u-1",
      blocked_by: "u-1",
      request_expires_at: null,
      status_before_block: "accepted",
      created_at: defaultDate,
      updated_at: defaultDate,
    } as Tables<"friendships">;

    const result = mapFriendship(row as any);
    expect(result.status).toBe("blocked");
    expect(result.statusBeforeBlock).toBe("accepted");
    expect(result.blockedBy).toBe("u-1");
  });
});

describe("mapGroupInvitation", () => {
  it("maps all fields", () => {
    const row = {
      id: "gi-1",
      group_id: "g-1",
      inviter_id: "u-1",
      invitee_id: "u-2",
      status: "pending" as const,
      expires_at: "2026-08-02T10:00:00.000Z",
      created_at: defaultDate,
      updated_at: defaultDate,
    } as Tables<"group_invitations">;

    const result = mapGroupInvitation(row);
    expect(result.groupId).toBe("g-1");
    expect(result.status).toBe("pending");
    expect(result.expiresAt).toEqual(new Date("2026-08-02T10:00:00.000Z"));
  });
});

describe("mapFriendInvite", () => {
  it("maps all fields", () => {
    const row = {
      id: "fi-1",
      created_by: "u-1",
      token_hash: Buffer.from("hash"),
      client_operation_id: "co-1",
      expires_at: "2026-07-26T10:00:00.000Z",
      revoked_at: null,
      redeemed_by: null,
      redeemed_at: null,
      created_at: defaultDate,
    } as Tables<"friend_invites">;

    const result = mapFriendInvite(row);
    expect(result.createdBy).toBe("u-1");
    expect(result.revokedAt).toBeUndefined();
    expect(result.redeemedBy).toBeUndefined();
  });
});

describe("mapNotification", () => {
  it("maps notification with payload", () => {
    const row = {
      id: "n-1",
      recipient_id: "u-1",
      kind: "balance_reminder" as const,
      actor_id: "u-2",
      group_id: "g-1",
      friendship_id: null,
      expense_id: null,
      payload: { currency: "USD", message: "Please settle up" },
      client_operation_id: null,
      created_at: defaultDate,
      read_at: null,
    } as Tables<"notifications">;

    const result = mapNotification(row);
    expect(result.kind).toBe("balance_reminder");
    expect(result.data).toEqual({ currency: "USD", message: "Please settle up" });
    expect(result.title).toBe("Balance Reminder");
  });
});

describe("mapReceiptUpload", () => {
  it("maps all fields", () => {
    const row = {
      id: "ru-1",
      owner_id: "u-1",
      client_operation_id: "co-1",
      object_key: "staging/u-1/rec.jpg",
      status: "staged" as const,
      attached_expense_id: null,
      mime_type: "image/jpeg",
      size_bytes: 102400,
      created_at: defaultDate,
      cleaned_at: null,
    } as Tables<"receipt_uploads">;

    const result = mapReceiptUpload(row);
    expect(result.status).toBe("staged");
    expect(result.mimeType).toBe("image/jpeg");
    expect(result.sizeBytes).toBe(102400);
  });
});

describe("mapExpenseComment", () => {
  it("maps all fields", () => {
    const row = {
      id: "ec-1",
      expense_id: "e-1",
      user_id: "u-1",
      text: "Looks good!",
      created_at: defaultDate,
    } as Tables<"expense_comments">;

    const result = mapExpenseComment(row);
    expect(result.expenseId).toBe("e-1");
    expect(result.text).toBe("Looks good!");
    expect(result.createdAt).toEqual(new Date(defaultDate));
  });
});

describe("no `as any` casting in mappers", () => {
  it("all mappers accept typed rows", () => {
    const expenseRow = {
      id: "e-1",
      group_id: null,
      friendship_id: null,
      title: "Test",
      amount: 10,
      amount_minor: 1000,
      currency: "USD",
      category: "food" as const,
      paid_by: "u-1",
      created_by: "u-1",
      split_method: "equal" as const,
      date: defaultDate,
      notes: null,
      receipt_url: null,
      receipt_key: null,
      client_operation_id: null,
      recurring_expense_id: null,
      created_at: defaultDate,
      updated_at: defaultDate,
      splits: [],
    };

    const result = mapExpense(expenseRow as any);
    expect(result.amountMinor).toBe(1000);
    expect(result.createdBy).toBe("u-1");
    expect(result.splitMethod).toBe("equal");
  });
});
