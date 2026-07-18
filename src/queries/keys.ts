/**
 * Query Key Factory for React Query
 * Consistent query key management across the application.
 */
export const queryKeys = {
  account: {
    all: ["account"] as const,
    session: ["account", "session"] as const,
    currentUser: ["account", "current-user"] as const,
    profile: (userId: string) => ["account", "profile", userId] as const,
  },

  // Groups
  groups: ["groups"] as const,
  groupDetails: (groupId: string) => ["groups", groupId] as const,
  groupMembers: (groupId: string) => ["groups", groupId, "members"] as const,

  // Expenses
  expenses: ["expenses"] as const,
  groupExpenses: (groupId: string) => ["expenses", "group", groupId] as const,
  expenseDetails: (expenseId: string) => ["expenses", expenseId] as const,

  // Settlements
  settlements: ["settlements"] as const,
  groupSettlements: (groupId: string) => ["settlements", "group", groupId] as const,

  // Activities
  activities: ["activities"] as const,
  groupActivities: (groupId: string) => ["activities", "group", groupId] as const,

  // Balances
  userBalances: (userId: string) => ["balances", "user", userId] as const,
  groupBalances: (groupId: string) => ["balances", "group", groupId] as const,

  // Friends
  friends: ["friends"] as const,
  friendList: (userId?: string) => ["friends", "list", userId] as const,
  allFriendships: (userId?: string) => ["friends", "list", userId, "all-friendships"] as const,

  // Users
  userSearch: (query: string, currentUserId?: string) =>
    ["users", "search", query, currentUserId] as const,

  // Notifications
  notifications: (userId?: string) => ["notifications", userId] as const,

  // Recurring
  recurring: {
    all: ["recurring"] as const,
    list: (userId: string) => ["recurring", "list", userId] as const,
    detail: (id: string) => ["recurring", id] as const,
    occurrences: (id: string) => ["recurring", id, "occurrences"] as const,
  },
} as const;
