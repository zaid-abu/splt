/**
 * Query Key Factory for React Query
 * Consistent query key management across the application.
 */
export const queryKeys = {
  // Auth & User
  user: ["user"] as const,
  userProfile: (userId: string) => ["user", userId] as const,

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

  // Friends
  friends: ["friends"] as const,
  friendDetail: (friendId: string) => ["friends", friendId] as const,

  // Notifications
  notifications: (userId: string) => ["notifications", userId] as const,

  // Activities
  activities: ["activities"] as const,
  groupActivities: (groupId: string) => ["activities", "group", groupId] as const,

  // Balances
  userBalances: (userId: string) => ["balances", "user", userId] as const,
  groupBalances: (groupId: string) => ["balances", "group", groupId] as const,
} as const;
