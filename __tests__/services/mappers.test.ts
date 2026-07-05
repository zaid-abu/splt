/**
 * Unit tests for src/services/api/mappers.ts
 *
 * All mapper functions are pure — no mocking required.
 */
import {
  mapUser,
  mapGroupMember,
  mapGroup,
  mapExpenseSplit,
  mapExpense,
  mapSettlement,
  mapActivity,
  toGroupInsert,
  toGroupUpdate,
  toExpenseInsert,
  toExpenseUpdate,
  toExpenseSplitInsert,
  toSettlementInsert,
} from "@/services/api/mappers";
import {
  DB_USER_ROW,
  DB_GROUP_ROW,
  DB_EXPENSE_ROW,
  DB_SETTLEMENT_ROW,
  USER_1,
  GROUP_1,
  EXPENSE_EQUAL,
  SETTLEMENT_1,
} from "../setup/fixtures";

// ─── mapUser ──────────────────────────────────────────────────────────────────

describe("mapUser", () => {
  it("maps a DB user row to a User domain object", () => {
    const user = mapUser(DB_USER_ROW);
    expect(user.id).toBe("user-1");
    expect(user.name).toBe("Alex Chen");
    expect(user.email).toBe("alex@example.com");
    expect(user.initials).toBe("AC");
    expect(user.defaultCurrency).toBe("USD");
  });

  it("maps null avatar to undefined", () => {
    const user = mapUser({ ...DB_USER_ROW, avatar: null });
    expect(user.avatar).toBeUndefined();
  });

  it("maps avatar URL when present", () => {
    const user = mapUser({ ...DB_USER_ROW, avatar: "https://example.com/photo.jpg" });
    expect(user.avatar).toBe("https://example.com/photo.jpg");
  });
});

// ─── mapGroupMember ───────────────────────────────────────────────────────────

describe("mapGroupMember", () => {
  const dbMember = {
    group_id: "group-1",
    user_id: "user-1",
    balance: 50,
    created_at: "2025-01-01T00:00:00Z",
    user: DB_USER_ROW,
  };

  it("maps a DB group member row to a GroupMember", () => {
    const member = mapGroupMember(dbMember);
    expect(member.userId).toBe("user-1");
    expect(member.balance).toBe(50);
    expect(member.user.name).toBe("Alex Chen");
  });

  it("creates an empty user placeholder when user is null", () => {
    const member = mapGroupMember({ ...dbMember, user: null });
    expect(member.user.id).toBe("user-1");
    expect(member.user.name).toBe("Unknown user");
    expect(member.user.initials).toBe("?");
  });
});

// ─── mapGroup ────────────────────────────────────────────────────────────────

describe("mapGroup", () => {
  it("maps a DB group row with members to a Group", () => {
    const group = mapGroup(DB_GROUP_ROW);
    expect(group.id).toBe("group-1");
    expect(group.name).toBe("Tokyo Trip");
    expect(group.icon).toBe("Plane");
    expect(group.currency).toBe("USD");
    expect(group.simplifyDebts).toBe(false);
    expect(group.totalExpenses).toBe(300);
    expect(group.members).toHaveLength(1);
    expect(group.members[0].userId).toBe("user-1");
  });

  it("maps null description to undefined", () => {
    const group = mapGroup({ ...DB_GROUP_ROW, description: null });
    expect(group.description).toBeUndefined();
  });

  it("returns empty members array when members is null", () => {
    const group = mapGroup({ ...DB_GROUP_ROW, members: null });
    expect(group.members).toHaveLength(0);
  });

  it("converts created_at string to Date", () => {
    const group = mapGroup(DB_GROUP_ROW);
    expect(group.createdAt).toBeInstanceOf(Date);
  });
});

// ─── mapExpenseSplit ─────────────────────────────────────────────────────────

describe("mapExpenseSplit", () => {
  const dbSplit = {
    id: "split-1",
    expense_id: "exp-1",
    user_id: "user-1",
    amount: 100,
    percentage: 33.33,
    paid: true,
    created_at: "2025-03-10T00:00:00Z",
    user: DB_USER_ROW,
  };

  it("maps a DB split row to an ExpenseSplit", () => {
    const split = mapExpenseSplit(dbSplit);
    expect(split.userId).toBe("user-1");
    expect(split.amount).toBe(100);
    expect(split.percentage).toBeCloseTo(33.33);
    expect(split.paid).toBe(true);
  });

  it("maps null percentage to undefined", () => {
    const split = mapExpenseSplit({ ...dbSplit, percentage: null });
    expect(split.percentage).toBeUndefined();
  });

  it("creates placeholder user when user is null", () => {
    const split = mapExpenseSplit({ ...dbSplit, user: null });
    expect(split.user.name).toBe("Unknown user");
  });
});

// ─── mapExpense ───────────────────────────────────────────────────────────────

describe("mapExpense", () => {
  it("maps a DB expense row to an Expense domain object", () => {
    const expense = mapExpense(DB_EXPENSE_ROW);
    expect(expense.id).toBe("exp-1");
    expect(expense.groupId).toBe("group-1");
    expect(expense.title).toBe("Dinner");
    expect(expense.amount).toBe(300);
    expect(expense.currency).toBe("USD");
    expect(expense.category).toBe("food");
    expect(expense.paidBy).toBe("user-1");
    expect(expense.splitMethod).toBe("equal");
    expect(expense.splits).toHaveLength(1);
  });

  it("maps null group_id to undefined", () => {
    const expense = mapExpense({ ...DB_EXPENSE_ROW, group_id: null });
    expect(expense.groupId).toBeUndefined();
  });

  it("maps null notes to undefined", () => {
    const expense = mapExpense({ ...DB_EXPENSE_ROW, notes: null });
    expect(expense.notes).toBeUndefined();
  });

  it("converts date string to Date instance", () => {
    const expense = mapExpense(DB_EXPENSE_ROW);
    expect(expense.date).toBeInstanceOf(Date);
    expect(expense.createdAt).toBeInstanceOf(Date);
  });

  it("creates placeholder paidByUser when paidByUser is null", () => {
    const expense = mapExpense({ ...DB_EXPENSE_ROW, paidByUser: null });
    expect(expense.paidByUser.name).toBe("Unknown user");
  });
});

// ─── mapSettlement ────────────────────────────────────────────────────────────

describe("mapSettlement", () => {
  it("maps a DB settlement row to a Settlement", () => {
    const settlement = mapSettlement(DB_SETTLEMENT_ROW);
    expect(settlement.id).toBe("settle-1");
    expect(settlement.groupId).toBe("group-1");
    expect(settlement.fromUserId).toBe("user-2");
    expect(settlement.toUserId).toBe("user-1");
    expect(settlement.amount).toBe(100);
    expect(settlement.currency).toBe("USD");
    expect(settlement.note).toBe("Paying back");
  });

  it("maps null group_id to undefined", () => {
    const settlement = mapSettlement({ ...DB_SETTLEMENT_ROW, group_id: null });
    expect(settlement.groupId).toBeUndefined();
  });

  it("maps null note to undefined", () => {
    const settlement = mapSettlement({ ...DB_SETTLEMENT_ROW, note: null });
    expect(settlement.note).toBeUndefined();
  });

  it("converts date string to Date", () => {
    const settlement = mapSettlement(DB_SETTLEMENT_ROW);
    expect(settlement.date).toBeInstanceOf(Date);
  });
});

// ─── mapActivity ──────────────────────────────────────────────────────────────

describe("mapActivity", () => {
  const dbActivity = {
    id: "act-1",
    type: "expense" as const,
    group_id: "group-1",
    expense_id: "exp-1",
    settlement_id: null,
    user_id: "user-1",
    description: "You added Dinner",
    amount: 300,
    currency: "USD",
    date: "2025-03-10T00:00:00Z",
    created_at: "2025-03-10T00:00:00Z",
    user: DB_USER_ROW,
    group: null,
    expense: DB_EXPENSE_ROW,
    settlement: null,
  };

  it("maps an expense activity correctly", () => {
    const activity = mapActivity(dbActivity);
    expect(activity.id).toBe("act-1");
    expect(activity.type).toBe("expense");
    expect(activity.description).toBe("You added Dinner");
    expect(activity.amount).toBe(300);
    expect(activity.expense).toBeDefined();
    expect(activity.settlement).toBeUndefined();
  });

  it("maps null amount to undefined", () => {
    const activity = mapActivity({ ...dbActivity, amount: null });
    expect(activity.amount).toBeUndefined();
  });

  it("maps null currency to undefined", () => {
    const activity = mapActivity({ ...dbActivity, currency: null });
    expect(activity.currency).toBeUndefined();
  });

  it("converts date to Date instance", () => {
    const activity = mapActivity(dbActivity);
    expect(activity.date).toBeInstanceOf(Date);
  });
});

// ─── toGroupInsert ────────────────────────────────────────────────────────────

describe("toGroupInsert", () => {
  it("converts a Group to a DB insert shape", () => {
    const insert = toGroupInsert(GROUP_1);
    expect(insert.name).toBe("Tokyo Trip");
    expect(insert.icon).toBe("Plane");
    expect(insert.currency).toBe("USD");
    expect(insert.created_by).toBe("user-1");
    expect(insert.simplify_debts).toBe(false);
  });

  it("maps undefined description to null", () => {
    const insert = toGroupInsert({ ...GROUP_1, description: undefined });
    expect(insert.description).toBeNull();
  });
});

// ─── toGroupUpdate ────────────────────────────────────────────────────────────

describe("toGroupUpdate", () => {
  it("only includes defined fields", () => {
    const update = toGroupUpdate({ name: "New Name" });
    expect(update.name).toBe("New Name");
    expect(update.currency).toBeUndefined();
  });
});

// ─── toExpenseInsert ──────────────────────────────────────────────────────────

describe("toExpenseInsert", () => {
  it("converts an Expense to a DB insert shape", () => {
    const insert = toExpenseInsert(EXPENSE_EQUAL);
    expect(insert.title).toBe("Dinner");
    expect(insert.amount).toBe(300);
    expect(insert.currency).toBe("USD");
    expect(insert.category).toBe("food");
    expect(insert.paid_by).toBe("user-1");
    expect(insert.split_method).toBe("equal");
    expect(insert.group_id).toBe("group-1");
  });

  it("maps undefined groupId to null", () => {
    const insert = toExpenseInsert({ ...EXPENSE_EQUAL, groupId: undefined });
    expect(insert.group_id).toBeNull();
  });
});

// ─── toExpenseSplitInsert ─────────────────────────────────────────────────────

describe("toExpenseSplitInsert", () => {
  it("converts an ExpenseSplit to a DB insert shape", () => {
    const split = { userId: "user-1", user: USER_1, amount: 100, paid: true };
    const insert = toExpenseSplitInsert("exp-1", split);
    expect(insert.expense_id).toBe("exp-1");
    expect(insert.user_id).toBe("user-1");
    expect(insert.amount).toBe(100);
    expect(insert.paid).toBe(true);
  });

  it("maps undefined percentage to null", () => {
    const split = { userId: "user-1", user: USER_1, amount: 100, paid: true, percentage: undefined };
    const insert = toExpenseSplitInsert("exp-1", split);
    expect(insert.percentage).toBeNull();
  });
});

// ─── toSettlementInsert ───────────────────────────────────────────────────────

describe("toSettlementInsert", () => {
  it("converts a Settlement to a DB insert shape", () => {
    const insert = toSettlementInsert(SETTLEMENT_1);
    expect(insert.from_user_id).toBe("user-2");
    expect(insert.to_user_id).toBe("user-1");
    expect(insert.amount).toBe(100);
    expect(insert.currency).toBe("USD");
    expect(insert.group_id).toBe("group-1");
  });

  it("maps undefined groupId to null", () => {
    const insert = toSettlementInsert({ ...SETTLEMENT_1, groupId: undefined });
    expect(insert.group_id).toBeNull();
  });

  it("maps undefined note to null", () => {
    const insert = toSettlementInsert({ ...SETTLEMENT_1, note: undefined });
    expect(insert.note).toBeNull();
  });
});
