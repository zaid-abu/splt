export type FriendRouteParams = {
  id: string;
};

export type SettleRouteParams = {
  id: string;
  groupId?: string;
  friendshipId?: string;
  currency?: string;
  expenseId?: string;
  returnTo?: string;
  contextType?: string;
  amountMinor?: string;
  isOwedToYou?: string;
};

export type GroupSettleRouteParams = {
  id: string;
};

export type ExpenseRouteParams = {
  id: string;
};

export type GroupRouteParams = {
  id: string;
  view?: string;
};

export type GroupSettingsRouteParams = {
  id: string;
};

export type ExpenseNewRouteParams = {
  groupId?: string;
  friendId?: string;
  returnTo?: string;
  resume?: string;
};

export type GroupView = "overview" | "expenses" | "schedule";

export type AppRouteParams = {
  "/friend/[id]": FriendRouteParams;
  "/settle/[id]": SettleRouteParams;
  "/group/[id]/settle": GroupSettleRouteParams;
  "/expense/[id]": ExpenseRouteParams;
  "/group/[id]": GroupRouteParams;
  "/group/[id]/settings": GroupSettingsRouteParams;
  "/expense/new": ExpenseNewRouteParams;
};
