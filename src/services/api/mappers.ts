import type {
  Activity,
  Expense,
  ExpenseSplit,
  Group,
  GroupMember,
  Settlement,
  User,
} from "@/types";
import type { Inserts, Tables, Updates } from "@/services/supabase/database.types";

type DbActivity = Tables<"activities">;
type DbExpense = Tables<"expenses">;
type DbExpenseSplit = Tables<"expense_splits">;
type DbGroup = Tables<"groups">;
type DbGroupMember = Tables<"group_members">;
type DbSettlement = Tables<"settlements">;
type DbUser = Tables<"users">;

export type GroupRow = DbGroup & {
  members?: (DbGroupMember & { user?: DbUser | null })[] | null;
};

export type ExpenseRow = DbExpense & {
  paidByUser?: DbUser | null;
  splits?: (DbExpenseSplit & { user?: DbUser | null })[] | null;
};

export type SettlementRow = DbSettlement & {
  fromUser?: DbUser | null;
  toUser?: DbUser | null;
};

export type ActivityRow = DbActivity & {
  group?: GroupRow | null;
  expense?: ExpenseRow | null;
  settlement?: SettlementRow | null;
  user?: DbUser | null;
};

function compact<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined)) as T;
}

export function mapUser(row: DbUser): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    avatar: row.avatar ?? undefined,
    initials: row.initials,
    defaultCurrency: row.default_currency,
    createdAt: new Date(row.created_at),
  };
}

export function mapGroupMember(row: DbGroupMember & { user?: DbUser | null }): GroupMember {
  return {
    userId: row.user_id,
    user: row.user ? mapUser(row.user) : emptyUser(row.user_id),
    balance: Number(row.balance),
  };
}

export function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    icon: row.icon,
    description: row.description ?? undefined,
    currency: row.currency,
    members: row.members?.map(mapGroupMember) ?? [],
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    totalExpenses: Number(row.total_expenses),
    simplifyDebts: row.simplify_debts,
    defaultSplitMethod: (row as any).default_split_method ?? undefined,
  };
}

export function mapExpenseSplit(row: DbExpenseSplit & { user?: DbUser | null }): ExpenseSplit {
  return {
    userId: row.user_id,
    user: row.user ? mapUser(row.user) : emptyUser(row.user_id),
    amount: Number(row.amount),
    percentage: row.percentage === null ? undefined : Number(row.percentage),
    paid: row.paid,
  };
}

export function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    groupId: row.group_id ?? undefined,
    title: row.title,
    amount: Number(row.amount),
    currency: row.currency,
    category: row.category,
    paidBy: row.paid_by,
    paidByUser: row.paidByUser ? mapUser(row.paidByUser) : emptyUser(row.paid_by),
    splits: row.splits?.map(mapExpenseSplit) ?? [],
    splitMethod: row.split_method,
    date: new Date(row.date),
    notes: row.notes ?? undefined,
    receiptUrl: (row as any).receipt_url ?? undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    groupId: row.group_id ?? undefined,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    fromUser: row.fromUser ? mapUser(row.fromUser) : emptyUser(row.from_user_id),
    toUser: row.toUser ? mapUser(row.toUser) : emptyUser(row.to_user_id),
    amount: Number(row.amount),
    currency: row.currency,
    date: new Date(row.date),
    note: row.note ?? undefined,
  };
}

export function mapActivity(row: ActivityRow): Activity {
  return {
    id: row.id,
    type: row.type,
    groupId: row.group_id ?? undefined,
    group: row.group ? mapGroup(row.group) : undefined,
    expense: row.expense ? mapExpense(row.expense) : undefined,
    settlement: row.settlement ? mapSettlement(row.settlement) : undefined,
    userId: row.user_id,
    user: row.user ? mapUser(row.user) : emptyUser(row.user_id),
    description: row.description,
    amount: row.amount === null ? undefined : Number(row.amount),
    currency: row.currency ?? undefined,
    date: new Date(row.date),
  };
}

export function toGroupInsert(group: Partial<Group>): Inserts<"groups"> {
  return compact({
    id: group.id,
    name: group.name,
    icon: group.icon,
    description: group.description ?? null,
    currency: group.currency,
    created_at: group.createdAt?.toISOString(),
    created_by: group.createdBy,
    total_expenses: group.totalExpenses,
    simplify_debts: group.simplifyDebts,
    default_split_method: group.defaultSplitMethod,
  }) as Inserts<"groups">;
}

export function toGroupUpdate(group: Partial<Group>): Updates<"groups"> {
  return compact({
    name: group.name,
    icon: group.icon,
    description: "description" in group ? (group.description ?? null) : undefined,
    currency: group.currency,
    total_expenses: group.totalExpenses,
    simplify_debts: group.simplifyDebts,
    default_split_method: "defaultSplitMethod" in group ? group.defaultSplitMethod : undefined,
  });
}

export function toExpenseInsert(expense: Partial<Expense>): Inserts<"expenses"> {
  return compact({
    id: expense.id,
    group_id: expense.groupId ?? null,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    paid_by: expense.paidBy,
    split_method: expense.splitMethod,
    date: expense.date?.toISOString(),
    notes: expense.notes ?? null,
    receipt_url: expense.receiptUrl ?? null,
    created_at: expense.createdAt?.toISOString(),
  }) as Inserts<"expenses">;
}

export function toExpenseUpdate(expense: Partial<Expense>): Updates<"expenses"> {
  return compact({
    group_id: "groupId" in expense ? (expense.groupId ?? null) : undefined,
    title: expense.title,
    amount: expense.amount,
    currency: expense.currency,
    category: expense.category,
    paid_by: expense.paidBy,
    split_method: expense.splitMethod,
    date: expense.date?.toISOString(),
    notes: "notes" in expense ? (expense.notes ?? null) : undefined,
    receipt_url: "receiptUrl" in expense ? (expense.receiptUrl ?? null) : undefined,
  });
}

export function toExpenseSplitInsert(
  expenseId: string,
  split: ExpenseSplit
): Inserts<"expense_splits"> {
  return compact({
    expense_id: expenseId,
    user_id: split.userId,
    amount: split.amount,
    percentage: split.percentage ?? null,
    paid: split.paid,
  });
}

export function toSettlementInsert(settlement: Partial<Settlement>): Inserts<"settlements"> {
  return compact({
    id: settlement.id,
    group_id: settlement.groupId ?? null,
    from_user_id: settlement.fromUserId,
    to_user_id: settlement.toUserId,
    amount: settlement.amount,
    currency: settlement.currency,
    date: settlement.date?.toISOString(),
    note: settlement.note ?? null,
  }) as Inserts<"settlements">;
}

export function toActivityInsert(activity: Partial<Activity>): Inserts<"activities"> {
  return compact({
    id: activity.id,
    type: activity.type,
    group_id: activity.groupId ?? null,
    expense_id: activity.expense?.id ?? null,
    settlement_id: activity.settlement?.id ?? null,
    user_id: activity.userId,
    description: activity.description,
    amount: activity.amount ?? null,
    currency: activity.currency ?? null,
    date: activity.date?.toISOString(),
  }) as Inserts<"activities">;
}

function emptyUser(id: string): User {
  return {
    id,
    name: "Unknown user",
    email: "",
    initials: "?",
    defaultCurrency: "USD",
  };
}
