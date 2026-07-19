// ─── App-wide TypeScript interfaces for SPLT ───────────────────────────────

export type Currency = {
  code: string; // e.g. "USD"
  symbol: string; // e.g. "$"
  name: string; // e.g. "US Dollar"
};

export const CURRENCIES: Currency[] = [
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
  { code: "INR", symbol: "₹", name: "Indian Rupee" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
  { code: "CNY", symbol: "¥", name: "Chinese Yuan" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
  { code: "SAR", symbol: "﷼", name: "Saudi Riyal" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "KRW", symbol: "₩", name: "South Korean Won" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
];

export type ExpenseCategory =
  | "food"
  | "transport"
  | "accommodation"
  | "entertainment"
  | "shopping"
  | "utilities"
  | "health"
  | "travel"
  | "other";

export const EXPENSE_CATEGORIES: { key: ExpenseCategory; label: string; icon: string }[] = [
  { key: "food", label: "Food & Drink", icon: "Utensils" },
  { key: "transport", label: "Transport", icon: "Car" },
  { key: "accommodation", label: "Accommodation", icon: "Home" },
  { key: "entertainment", label: "Entertainment", icon: "Film" },
  { key: "shopping", label: "Shopping", icon: "ShoppingBag" },
  { key: "utilities", label: "Utilities", icon: "Zap" },
  { key: "health", label: "Health", icon: "Pill" },
  { key: "travel", label: "Travel", icon: "Plane" },
  { key: "other", label: "Other", icon: "Package" },
];

export type SplitMethod = "equal" | "custom" | "percentage" | "shares";

export type AccountSetupState = "profile_pending" | "activation_pending" | "complete";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  defaultCurrency: string;
  setupState: AccountSetupState;
  createdAt?: Date;
}

export type FriendshipStatus = "pending" | "accepted" | "blocked" | "declined" | "removed";

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  requestedBy: string;
  blockedBy?: string;
  requestExpiresAt?: Date;
  statusBeforeBlock?: string;
  createdAt: Date;
  updatedAt: Date;
  friendUser?: User; // joined data
}

export interface GroupMember {
  userId: string;
  user: User;
  balance: number; // positive = owed money, negative = owes money
  newExpenseAlerts?: boolean;
}

export interface Group {
  id: string;
  name: string;
  icon: string;
  description?: string;
  currency: string;
  members: GroupMember[];
  createdAt: Date;
  createdBy: string;
  totalExpenses: number;
  simplifyDebts?: boolean;
  defaultSplitMethod?: SplitMethod;
  kind?: string;
  archivedAt?: Date | null;
}

export interface ExpenseSplit {
  userId: string;
  user: User;
  amount: number;
  amountMinor: number;
  percentage?: number;
  shares?: number;
  position: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  groupId?: string;
  friendshipId?: string;
  title: string;
  amount: number;
  amountMinor: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string; // userId
  paidByUser: User;
  createdBy: string;
  splits: ExpenseSplit[];
  splitMethod: SplitMethod;
  date: Date;
  notes?: string;
  receiptUrl?: string;
  receiptKey?: string;
  legacyReceiptUrl?: string;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  groupId?: string;
  friendshipId?: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
  amount: number;
  amountMinor: number;
  currency: string;
  method: "cash" | "bank_transfer" | "other";
  date: Date;
  note?: string;
}

export type ActivityType = "expense" | "settlement" | "member_joined" | "group_created";

export interface Activity {
  id: string;
  type: ActivityType;
  groupId?: string;
  group?: Group;
  expense?: Expense;
  settlement?: Settlement;
  userId: string;
  user: User;
  description: string;
  amount?: number;
  amountMinor?: number;
  currency?: string;
  date: Date;
}

export interface Balance {
  userId: string;
  user: User;
  owedToYou: number;
  youOwe: number;
  net: number;
  currency: string;
}

// ─── New domain types ──────────────────────────────────────────────────────

export interface GroupInvitation {
  id: string;
  groupId: string;
  inviterId: string;
  inviteeId: string;
  status: "pending" | "accepted" | "declined" | "cancelled" | "expired";
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface FriendInvite {
  id: string;
  createdBy: string;
  expiresAt: Date;
  revokedAt?: Date;
  redeemedBy?: string;
  redeemedAt?: Date;
  createdAt: Date;
}

export type NotificationKind =
  "friend_request" | "group_invite" | "balance_reminder" | "expense_added";

export interface AppNotification {
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
}

export interface ReceiptUpload {
  id: string;
  ownerId: string;
  clientOperationId: string;
  objectKey: string;
  status: "staged" | "attached" | "cleanup_pending" | "cleaned";
  attachedExpenseId?: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: Date;
  cleanedAt?: Date;
}

export interface ExpenseComment {
  id: string;
  expenseId: string;
  userId: string;
  text: string;
  createdAt: Date;
}

// ─── Screen-specific filter types ───────────────────────────────────────────
export type ActivityFilterType = "All" | "Expenses" | "Settlements" | "Groups" | "Friends";
export type FriendFilter = "all" | "owes_you" | "you_owe" | "settled";
export type FriendSectionKey = "owes_you" | "you_owe" | "settled";
export type GroupFilter = "all" | "owe" | "owed" | "settled";

// ─── Analytics types ────────────────────────────────────────────────────────
export type AnalyticsPeriod = "week" | "month" | "3mo" | "year" | "all";

export interface CategoryData {
  category: ExpenseCategory;
  amount: number;
}

export interface TrendData {
  label: string;
  value: number;
}

export * from "./recurring";
