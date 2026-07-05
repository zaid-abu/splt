/**
 * Shared test fixtures for the Splt test suite.
 * These mirror mock-data.ts but are standalone — they don't import from the app
 * so they can be used in any test context without triggering module resolution.
 */
import type { User, Group, Expense, Settlement, Activity, Currency } from "@/types";

// ─── Users ────────────────────────────────────────────────────────────────────

export const USER_1: User = {
  id: "user-1",
  name: "Alex Chen",
  email: "alex@example.com",
  initials: "AC",
  defaultCurrency: "USD",
};

export const USER_2: User = {
  id: "user-2",
  name: "Jordan Lee",
  email: "jordan@example.com",
  initials: "JL",
  defaultCurrency: "USD",
};

export const USER_3: User = {
  id: "user-3",
  name: "Sam Rivera",
  email: "sam@example.com",
  initials: "SR",
  defaultCurrency: "EUR",
};

export const ALL_USERS: User[] = [USER_1, USER_2, USER_3];

// ─── Currency ─────────────────────────────────────────────────────────────────

export const USD_CURRENCY: Currency = {
  code: "USD",
  symbol: "$",
  name: "US Dollar",
  flag: "🇺🇸",
};

export const INR_CURRENCY: Currency = {
  code: "INR",
  symbol: "₹",
  name: "Indian Rupee",
  flag: "🇮🇳",
};

// ─── Identity converter (no conversion) ──────────────────────────────────────

export const identityConverter = (amount: number, _from: string, _to: string) => amount;

/** A simple 2x rate converter: USD → EUR is 2x, anything else is identity */
export const mockConverter = (amount: number, from: string, to: string) => {
  if (from === to) return amount;
  if (from === "USD" && to === "EUR") return amount * 2;
  if (from === "EUR" && to === "USD") return amount / 2;
  return amount;
};

// ─── Groups ───────────────────────────────────────────────────────────────────

export const GROUP_1: Group = {
  id: "group-1",
  name: "Tokyo Trip",
  icon: "Plane",
  currency: "USD",
  createdAt: new Date("2025-01-01"),
  createdBy: "user-1",
  totalExpenses: 300,
  simplifyDebts: false,
  members: [
    { userId: "user-1", user: USER_1, balance: 0 },
    { userId: "user-2", user: USER_2, balance: 0 },
    { userId: "user-3", user: USER_3, balance: 0 },
  ],
};

export const GROUP_SIMPLIFY: Group = {
  ...GROUP_1,
  id: "group-simplify",
  name: "Simplify Group",
  simplifyDebts: true,
};

// ─── Expenses ─────────────────────────────────────────────────────────────────

/** Expense where user-1 paid $300 split equally among 3 users ($100 each) */
export const EXPENSE_EQUAL: Expense = {
  id: "exp-1",
  groupId: "group-1",
  title: "Dinner",
  amount: 300,
  currency: "USD",
  category: "food",
  paidBy: "user-1",
  paidByUser: USER_1,
  splitMethod: "equal",
  splits: [
    { userId: "user-1", user: USER_1, amount: 100, paid: true },
    { userId: "user-2", user: USER_2, amount: 100, paid: false },
    { userId: "user-3", user: USER_3, amount: 100, paid: false },
  ],
  date: new Date("2025-03-10"),
  createdAt: new Date("2025-03-10"),
};

/** Expense where user-2 paid $50 split equally among 2 */
export const EXPENSE_2: Expense = {
  id: "exp-2",
  groupId: "group-1",
  title: "Transport",
  amount: 50,
  currency: "USD",
  category: "transport",
  paidBy: "user-2",
  paidByUser: USER_2,
  splitMethod: "equal",
  splits: [
    { userId: "user-1", user: USER_1, amount: 25, paid: false },
    { userId: "user-2", user: USER_2, amount: 25, paid: true },
  ],
  date: new Date("2025-03-11"),
  createdAt: new Date("2025-03-11"),
};

// ─── Settlements ──────────────────────────────────────────────────────────────

/** user-2 pays user-1 $100 in group-1 */
export const SETTLEMENT_1: Settlement = {
  id: "settle-1",
  groupId: "group-1",
  fromUserId: "user-2",
  toUserId: "user-1",
  fromUser: USER_2,
  toUser: USER_1,
  amount: 100,
  currency: "USD",
  date: new Date("2025-03-15"),
};

// ─── DB Row Fixtures (for mapper tests) ──────────────────────────────────────

export const DB_USER_ROW = {
  id: "user-1",
  name: "Alex Chen",
  email: "alex@example.com",
  avatar: null,
  initials: "AC",
  default_currency: "USD",
  created_at: "2025-01-01T00:00:00Z",
  updated_at: "2025-01-01T00:00:00Z",
};

export const DB_GROUP_ROW = {
  id: "group-1",
  name: "Tokyo Trip",
  icon: "Plane",
  description: "A trip",
  currency: "USD",
  created_at: "2025-01-01T00:00:00Z",
  created_by: "user-1",
  total_expenses: 300,
  simplify_debts: false,
  updated_at: "2025-01-01T00:00:00Z",
  members: [
    {
      group_id: "group-1",
      user_id: "user-1",
      balance: 0,
      created_at: "2025-01-01T00:00:00Z",
      user: DB_USER_ROW,
    },
  ],
};

export const DB_EXPENSE_ROW = {
  id: "exp-1",
  group_id: "group-1",
  title: "Dinner",
  amount: 300,
  currency: "USD",
  category: "food" as const,
  paid_by: "user-1",
  split_method: "equal" as const,
  date: "2025-03-10T00:00:00Z",
  notes: null,
  created_at: "2025-03-10T00:00:00Z",
  updated_at: "2025-03-10T00:00:00Z",
  paidByUser: DB_USER_ROW,
  splits: [
    {
      id: "split-1",
      expense_id: "exp-1",
      user_id: "user-1",
      amount: 100,
      percentage: null,
      paid: true,
      created_at: "2025-03-10T00:00:00Z",
      user: DB_USER_ROW,
    },
  ],
};

export const DB_SETTLEMENT_ROW = {
  id: "settle-1",
  group_id: "group-1",
  from_user_id: "user-2",
  to_user_id: "user-1",
  amount: 100,
  currency: "USD",
  date: "2025-03-15T00:00:00Z",
  note: "Paying back",
  created_at: "2025-03-15T00:00:00Z",
  fromUser: { ...DB_USER_ROW, id: "user-2", name: "Jordan Lee", email: "jordan@example.com", initials: "JL" },
  toUser: DB_USER_ROW,
};
