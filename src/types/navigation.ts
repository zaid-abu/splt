export type FriendRouteParams = {
  id: string;
};

export type SettleRouteParams = {
  id: string;
  groupId?: string;
  amount?: string;
  direction?: string;
};

export type GroupSettleRouteParams = {
  id: string;
};

export type ExpenseRouteParams = {
  id: string;
};

export type GroupRouteParams = {
  id: string;
};

export type GroupSettingsRouteParams = {
  id: string;
};

export type ExpenseNewRouteParams = {
  groupId?: string;
  friendId?: string;
  expenseId?: string;
};

export type AppRouteParams = {
  "/friend/[id]": FriendRouteParams;
  "/settle/[id]": SettleRouteParams;
  "/group/[id]/settle": GroupSettleRouteParams;
  "/expense/[id]": ExpenseRouteParams;
  "/group/[id]": GroupRouteParams;
  "/group/[id]/settings": GroupSettingsRouteParams;
  "/expense/new": ExpenseNewRouteParams;
};
