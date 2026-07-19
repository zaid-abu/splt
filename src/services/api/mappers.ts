import type {
  Activity,
  Expense,
  ExpenseComment,
  ExpenseSplit,
  FriendInvite,
  Friendship,
  Group,
  GroupInvitation,
  GroupMember,
  NotificationKind,
  RecurringExpense,
  RecurringFormValues,
  RecurringOccurrence,
  Settlement,
  User,
} from "@/types";
import type { Inserts, Tables, Updates, Json } from "@/services/supabase/database.types";

type DbActivity = Tables<"activities">;
type DbExpense = Tables<"expenses">;
type DbExpenseComment = Tables<"expense_comments">;
type DbExpenseSplit = Tables<"expense_splits">;
type DbFriendInvite = Tables<"friend_invites">;
type DbFriendship = Tables<"friendships">;
type DbGroup = Tables<"groups">;
type DbGroupInvitation = Tables<"group_invitations">;
type DbGroupMember = Tables<"group_members">;
type DbNotification = Tables<"notifications">;
type DbReceiptUpload = Tables<"receipt_uploads">;
type DbRecurringExpense = Tables<"recurring_expenses">;
type DbRecurringOccurrence = Tables<"recurring_occurrences">;
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

export type FriendshipRow = DbFriendship & {
  friendUser?: DbUser | null;
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
    setupState: row.setup_state,
    createdAt: new Date(row.created_at),
  };
}

export function mapGroupMember(row: DbGroupMember & { user?: DbUser | null }): GroupMember {
  return {
    userId: row.user_id,
    user: row.user ? mapUser(row.user) : emptyUser(row.user_id),
    balance: Number(row.balance),
    newExpenseAlerts: row.new_expense_alerts,
  };
}

export function mapGroup(row: GroupRow): Group {
  return {
    id: row.id,
    name: row.name,
    kind: row.kind ?? undefined,
    icon: row.icon,
    description: row.description ?? undefined,
    currency: row.currency,
    members: row.members?.map(mapGroupMember) ?? [],
    archivedAt: row.archived_at ? new Date(row.archived_at) : null,
    createdAt: new Date(row.created_at),
    createdBy: row.created_by,
    totalExpenses: Number(row.total_expenses),
    simplifyDebts: row.simplify_debts,
    defaultSplitMethod: row.default_split_method,
  };
}

export function mapExpenseSplit(row: DbExpenseSplit & { user?: DbUser | null }): ExpenseSplit {
  return {
    userId: row.user_id,
    user: row.user ? mapUser(row.user) : emptyUser(row.user_id),
    amount: Number(row.amount),
    amountMinor: Number(row.amount_minor),
    percentage: row.percentage === null ? undefined : Number(row.percentage),
    shares: row.shares === null ? undefined : Number(row.shares),
    position: row.position,
    paid: row.paid,
  };
}

export function mapExpense(row: ExpenseRow): Expense {
  return {
    id: row.id,
    groupId: row.group_id ?? undefined,
    friendshipId: row.friendship_id ?? undefined,
    title: row.title,
    amount: Number(row.amount),
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    category: row.category,
    paidBy: row.paid_by,
    paidByUser: row.paidByUser ? mapUser(row.paidByUser) : emptyUser(row.paid_by),
    createdBy: row.created_by,
    splits: row.splits?.map(mapExpenseSplit) ?? [],
    splitMethod: row.split_method,
    date: new Date(row.date),
    notes: row.notes ?? undefined,
    receiptUrl: row.receipt_url ?? undefined,
    receiptKey: row.receipt_key ?? undefined,
    legacyReceiptUrl: row.receipt_key ? undefined : (row.receipt_url ?? undefined),
    createdAt: new Date(row.created_at),
  };
}

export function mapSettlement(row: SettlementRow): Settlement {
  return {
    id: row.id,
    groupId: row.group_id ?? undefined,
    friendshipId: row.friendship_id ?? undefined,
    fromUserId: row.from_user_id,
    toUserId: row.to_user_id,
    fromUser: row.fromUser ? mapUser(row.fromUser) : emptyUser(row.from_user_id),
    toUser: row.toUser ? mapUser(row.toUser) : emptyUser(row.to_user_id),
    amount: Number(row.amount),
    amountMinor: Number(row.amount_minor),
    currency: row.currency,
    method: row.method,
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
    amountMinor: row.amount_minor === null ? undefined : Number(row.amount_minor),
    currency: row.currency ?? undefined,
    date: new Date(row.date),
  };
}

export function mapFriendship(row: FriendshipRow): Friendship {
  return {
    id: row.id,
    userId: row.user_id,
    friendId: row.friend_id,
    status: row.status,
    requestedBy: row.requested_by,
    blockedBy: row.blocked_by ?? undefined,
    requestExpiresAt: row.request_expires_at ? new Date(row.request_expires_at) : undefined,
    statusBeforeBlock: row.status_before_block ?? undefined,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
    friendUser: row.friendUser ? mapUser(row.friendUser) : undefined,
  };
}

export function mapGroupInvitation(row: DbGroupInvitation): GroupInvitation {
  return {
    id: row.id,
    groupId: row.group_id,
    inviterId: row.inviter_id,
    inviteeId: row.invitee_id,
    status: row.status,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export function mapFriendInvite(row: DbFriendInvite): FriendInvite {
  return {
    id: row.id,
    createdBy: row.created_by,
    expiresAt: new Date(row.expires_at),
    revokedAt: row.revoked_at ? new Date(row.revoked_at) : undefined,
    redeemedBy: row.redeemed_by ?? undefined,
    redeemedAt: row.redeemed_at ? new Date(row.redeemed_at) : undefined,
    createdAt: new Date(row.created_at),
  };
}

export function mapNotification(row: DbNotification): {
  id: string;
  kind: NotificationKind;
  title: string;
  subtitle: string;
  date: Date;
  data?: Record<string, unknown>;
  actorId?: string;
  groupId?: string;
  friendshipId?: string;
  expenseId?: string;
} {
  const titleMap: Record<string, string> = {
    friend_request: "Friend Request",
    group_invite: "Group Invitation",
    balance_reminder: "Balance Reminder",
    expense_added: "New Expense",
  };
  const subtitleMap: Record<string, string> = {
    friend_request: "Someone wants to be friends",
    group_invite: "You've been invited to a group",
    balance_reminder: "You have an outstanding balance",
    expense_added: "An expense was added",
  };
  return {
    id: row.id,
    kind: row.kind,
    title: titleMap[row.kind] ?? row.kind,
    subtitle:
      (row.payload as Record<string, string> | undefined)?.message ?? subtitleMap[row.kind] ?? "",
    date: new Date(row.created_at),
    data: row.payload as Record<string, unknown> | undefined,
    actorId: row.actor_id ?? undefined,
    groupId: row.group_id ?? undefined,
    friendshipId: row.friendship_id ?? undefined,
    expenseId: row.expense_id ?? undefined,
  };
}

export function mapReceiptUpload(row: DbReceiptUpload): import("@/types").ReceiptUpload {
  return {
    id: row.id,
    ownerId: row.owner_id,
    clientOperationId: row.client_operation_id,
    objectKey: row.object_key,
    status: row.status,
    attachedExpenseId: row.attached_expense_id ?? undefined,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    createdAt: new Date(row.created_at),
    cleanedAt: row.cleaned_at ? new Date(row.cleaned_at) : undefined,
  };
}

export function mapExpenseComment(row: DbExpenseComment): ExpenseComment {
  return {
    id: row.id,
    expenseId: row.expense_id,
    userId: row.user_id,
    text: row.text,
    createdAt: new Date(row.created_at),
  };
}

export function toGroupInsert(group: Partial<Group>): Inserts<"groups"> {
  return compact({
    id: group.id,
    name: group.name,
    kind: group.kind ?? null,
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
    kind: "kind" in group ? (group.kind ?? null) : undefined,
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
    friendship_id: expense.friendshipId ?? null,
    title: expense.title,
    amount: expense.amount,
    amount_minor: expense.amountMinor,
    currency: expense.currency,
    category: expense.category,
    paid_by: expense.paidBy,
    created_by: expense.createdBy,
    split_method: expense.splitMethod,
    date: expense.date?.toISOString(),
    notes: expense.notes ?? null,
    receipt_url: expense.receiptUrl ?? null,
    receipt_key: expense.receiptKey ?? null,
    created_at: expense.createdAt?.toISOString(),
  }) as Inserts<"expenses">;
}

export function toExpenseUpdate(expense: Partial<Expense>): Updates<"expenses"> {
  return compact({
    group_id: "groupId" in expense ? (expense.groupId ?? null) : undefined,
    friendship_id: "friendshipId" in expense ? (expense.friendshipId ?? null) : undefined,
    title: expense.title,
    amount: expense.amount,
    amount_minor: expense.amountMinor,
    currency: expense.currency,
    category: expense.category,
    paid_by: expense.paidBy,
    created_by: expense.createdBy,
    split_method: expense.splitMethod,
    date: expense.date?.toISOString(),
    notes: "notes" in expense ? (expense.notes ?? null) : undefined,
    receipt_url: "receiptUrl" in expense ? (expense.receiptUrl ?? null) : undefined,
    receipt_key: "receiptKey" in expense ? (expense.receiptKey ?? null) : undefined,
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
    amount_minor: split.amountMinor,
    percentage: split.percentage ?? null,
    shares: split.shares ?? null,
    position: split.position,
    paid: split.paid,
  });
}

export function toSettlementInsert(settlement: Partial<Settlement>): Inserts<"settlements"> {
  return compact({
    id: settlement.id,
    group_id: settlement.groupId ?? null,
    friendship_id: settlement.friendshipId ?? null,
    from_user_id: settlement.fromUserId,
    to_user_id: settlement.toUserId,
    amount: settlement.amount,
    amount_minor: settlement.amountMinor,
    currency: settlement.currency,
    method: settlement.method,
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
    amount_minor: activity.amountMinor ?? null,
    currency: activity.currency ?? null,
    date: activity.date?.toISOString(),
  }) as Inserts<"activities">;
}

export function mapRecurringExpense(row: DbRecurringExpense): RecurringExpense {
  return {
    id: row.id,
    groupId: row.group_id,
    createdBy: row.created_by,
    paidByUserId: row.paid_by_user_id,
    title: row.title,
    amount: row.amount,
    amountMinor: row.amount_minor ?? undefined,
    currencyCode: row.currency_code,
    splitMethod: row.split_method,
    splitConfig: row.split_config as RecurringExpense["splitConfig"],
    frequency: row.frequency,
    intervalValue: row.interval_value,
    dayOfWeek: row.day_of_week,
    dayOfMonth: row.day_of_month,
    startDate: row.start_date,
    nextRunDate: row.next_run_date,
    reminderDaysBefore: row.reminder_days_before,
    autoPost: row.auto_post,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function mapRecurringOccurrence(row: DbRecurringOccurrence): RecurringOccurrence {
  return {
    id: row.id,
    recurringExpenseId: row.recurring_expense_id,
    scheduledFor: row.scheduled_for,
    expenseId: row.expense_id,
    status: row.status,
    createdAt: row.created_at,
  };
}

export function toRecurringExpenseInsert(
  input: RecurringFormValues,
  createdBy: string
): Inserts<"recurring_expenses"> {
  return compact({
    group_id: input.groupId,
    created_by: createdBy,
    paid_by_user_id: input.paidByUserId,
    title: input.title,
    amount: input.amount,
    amount_minor: null,
    currency_code: input.currencyCode,
    split_method: input.splitMethod,
    split_config: input.splitConfig as Json,
    frequency: input.frequency,
    interval_value: input.intervalValue,
    day_of_week: input.dayOfWeek,
    day_of_month: input.dayOfMonth,
    start_date: input.startDate,
    next_run_date: input.startDate,
    reminder_days_before: input.reminderDaysBefore,
    auto_post: input.autoPost,
    status: input.status,
  }) as Inserts<"recurring_expenses">;
}

export function toRecurringExpenseUpdate(
  input: Partial<RecurringFormValues>
): Updates<"recurring_expenses"> {
  return compact({
    group_id: input.groupId,
    paid_by_user_id: input.paidByUserId,
    title: input.title,
    amount: "amount" in input ? input.amount : undefined,
    amount_minor: "amount" in input ? (input.amount != null ? null : undefined) : undefined,
    currency_code: input.currencyCode,
    split_method: input.splitMethod,
    split_config: "splitConfig" in input ? (input.splitConfig as Json) : undefined,
    frequency: input.frequency,
    interval_value: input.intervalValue,
    day_of_week: "dayOfWeek" in input ? input.dayOfWeek : undefined,
    day_of_month: "dayOfMonth" in input ? input.dayOfMonth : undefined,
    start_date: input.startDate,
    reminder_days_before: input.reminderDaysBefore,
    auto_post: "autoPost" in input ? input.autoPost : undefined,
    status: input.status,
  });
}

function emptyUser(id: string): User {
  return {
    id,
    name: "Unknown user",
    email: "",
    initials: "?",
    defaultCurrency: "USD",
    setupState: "complete",
  };
}
