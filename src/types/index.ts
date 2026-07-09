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

export type SplitMethod = "equal" | "custom" | "percentage";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  initials: string;
  defaultCurrency: string;
  createdAt?: Date;
}

export type FriendshipStatus = "pending" | "accepted" | "blocked";

export interface Friendship {
  id: string;
  userId: string;
  friendId: string;
  status: FriendshipStatus;
  createdAt: Date;
  updatedAt: Date;
  friendUser?: User; // joined data
}

export interface GroupMember {
  userId: string;
  user: User;
  balance: number; // positive = owed money, negative = owes money
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
}

export interface ExpenseSplit {
  userId: string;
  user: User;
  amount: number;
  percentage?: number;
  paid: boolean;
}

export interface Expense {
  id: string;
  groupId?: string;
  title: string;
  amount: number;
  currency: string;
  category: ExpenseCategory;
  paidBy: string; // userId
  paidByUser: User;
  splits: ExpenseSplit[];
  splitMethod: SplitMethod;
  date: Date;
  notes?: string;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  groupId?: string;
  fromUserId: string;
  toUserId: string;
  fromUser: User;
  toUser: User;
  amount: number;
  currency: string;
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
