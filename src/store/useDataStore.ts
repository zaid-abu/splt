import { create } from "zustand";
import {
  MOCK_ACTIVITIES,
  MOCK_EXPENSES,
  MOCK_GROUPS,
  MOCK_SETTLEMENTS,
} from "@/lib/mock-data";
import type {
  Activity,
  Expense,
  ExpenseCategory,
  ExpenseSplit,
  Group,
  GroupMember,
  SplitMethod,
  User,
  Settlement,
} from "@/types";
import { useUIStore } from "./useUIStore";

let expenseCounter = MOCK_EXPENSES.length + 1;
let groupCounter = MOCK_GROUPS.length + 1;

export interface DataState {
  groups: Group[];
  expenses: Expense[];
  activities: Activity[];
  settlements: Settlement[];

  // Actions
  createGroup: (
    data: {
      name: string;
      icon: string;
      description?: string;
      currency: string;
      memberEmails: string[];
      simplifyDebts?: boolean;
    },
    currentUser: User
  ) => Promise<Group>;
  updateGroup: (id: string, group: Partial<Omit<Group, "id" | "members">>) => Promise<Group>;
  addGroupMembers: (groupId: string, users: User[]) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  deleteGroup: (groupId: string) => void;
  getGroup: (id: string) => Group | undefined;
  getGroupExpenses: (groupId: string) => Expense[];

  addExpense: (
    data: {
      groupId?: string;
      title: string;
      amount: number;
      currency: string;
      category: ExpenseCategory;
      paidBy: string;
      splits: { userId: string; user: User; amount: number; percentage?: number }[];
      splitMethod: SplitMethod;
      date: Date;
      notes?: string;
    },
    currentUser: User
  ) => Promise<Expense>;
  updateExpense: (
    id: string,
    data: {
      title: string;
      amount: number;
      currency: string;
      category: ExpenseCategory;
      paidBy: string;
      splits: { userId: string; user: User; amount: number; percentage?: number }[];
      splitMethod: SplitMethod;
      date: Date;
      notes?: string;
    },
    currentUser: User
  ) => Promise<Expense>;
  getExpense: (id: string) => Expense | undefined;
  deleteExpense: (id: string) => Promise<void>;

  deleteActivity: (id: string) => Promise<void>;

  addSettlement: (
    data: {
      groupId?: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
      currency: string;
      date: Date;
      note?: string;
    },
    currentUser: User
  ) => Promise<Settlement>;

  // Derived state (getters)
  getGroupBalances: (groupId: string) => Map<string, number>;
  getSimplifiedDebts: (groupId: string) => { fromUserId: string; toUserId: string; amount: number }[];
  getExactPairwiseDebts: (groupId: string) => { fromUserId: string; toUserId: string; amount: number }[];
  getUserBalances: (currentUserId: string, groupId?: string) => Map<string, number>;
  getTotalOwedToMe: (currentUserId: string) => number;
  getTotalIOwe: (currentUserId: string) => number;
  getNetBalance: (currentUserId: string) => number;
}

export const useDataStore = create<DataState>((set, get) => ({
  groups: MOCK_GROUPS,
  expenses: MOCK_EXPENSES,
  activities: MOCK_ACTIVITIES,
  settlements: MOCK_SETTLEMENTS,

  getGroup: (id) => get().groups.find((g) => g.id === id),

  getGroupExpenses: (groupId) =>
    get().expenses
      .filter((e) => e.groupId === groupId)
      .sort((a, b) => b.date.getTime() - a.date.getTime()),

  createGroup: async (data, currentUser) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const selfMember: GroupMember = {
      userId: currentUser.id,
      user: currentUser,
      balance: 0,
    };
    const newGroup: Group = {
      id: `group-${groupCounter++}`,
      name: data.name,
      icon: data.icon,
      description: data.description,
      currency: data.currency,
      members: [selfMember],
      createdAt: new Date(),
      createdBy: currentUser.id,
      totalExpenses: 0,
      simplifyDebts: data.simplifyDebts ?? false,
    };

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: "group_created",
      groupId: newGroup.id,
      group: newGroup,
      userId: currentUser.id,
      user: currentUser,
      description: `You created ${newGroup.name}`,
      date: new Date(),
    };

    set((state) => ({
      groups: [newGroup, ...state.groups],
      activities: [newActivity, ...state.activities],
    }));

    return newGroup;
  },

  updateGroup: async (id, updates) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    set((state) => ({
      groups: state.groups.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
    return get().groups.find((g) => g.id === id)!;
  },

  addGroupMembers: (groupId, users) => {
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        const existingUserIds = new Set(g.members.map((m) => m.userId));
        const newMembers = users
          .filter((u) => !existingUserIds.has(u.id))
          .map((u) => ({
            userId: u.id,
            user: u,
            balance: 0,
          }));
        return { ...g, members: [...g.members, ...newMembers] };
      }),
    }));
  },

  removeGroupMember: (groupId, userId) => {
    set((state) => ({
      groups: state.groups.map((g) => {
        if (g.id !== groupId) return g;
        return { ...g, members: g.members.filter((m) => m.userId !== userId) };
      }),
    }));
  },

  deleteGroup: (groupId) => {
    set((state) => ({
      groups: state.groups.filter((g) => g.id !== groupId),
    }));
  },

  getExpense: (id) => get().expenses.find((e) => e.id === id),

  addExpense: async (data, currentUser) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const paidByUser = data.splits.find((s) => s.userId === data.paidBy)?.user ?? currentUser;
    const splits: ExpenseSplit[] = data.splits.map((s) => ({
      ...s,
      paid: s.userId === data.paidBy,
    }));

    const newExpense: Expense = {
      id: `exp-${expenseCounter++}`,
      groupId: data.groupId,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      paidBy: data.paidBy,
      paidByUser,
      splits,
      splitMethod: data.splitMethod,
      date: data.date,
      notes: data.notes,
      createdAt: new Date(),
    };

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: "expense",
      groupId: data.groupId,
      expense: newExpense,
      userId: currentUser.id,
      user: currentUser,
      description: `You added ${data.title}`,
      amount: data.amount,
      currency: data.currency,
      date: new Date(),
    };

    set((state) => {
      let nextGroups = state.groups;
      if (data.groupId) {
        nextGroups = state.groups.map((g) => {
          if (g.id !== data.groupId) return g;
          const { convertCurrency } = useUIStore.getState();
          const amountInGroupCurrency = convertCurrency(data.amount, data.currency, g.currency);
          return { ...g, totalExpenses: g.totalExpenses + amountInGroupCurrency };
        });
      }
      return {
        expenses: [newExpense, ...state.expenses],
        activities: [newActivity, ...state.activities],
        groups: nextGroups,
      };
    });

    return newExpense;
  },

  updateExpense: async (id, data, currentUser) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    const existingExpense = get().expenses.find((e) => e.id === id);
    if (!existingExpense) throw new Error("Expense not found");

    const paidByUser = data.splits.find((s) => s.userId === data.paidBy)?.user ?? currentUser;
    const splits = data.splits.map((s) => ({
      ...s,
      paid: s.userId === data.paidBy,
    }));

    const updatedExpense = {
      ...existingExpense,
      title: data.title,
      amount: data.amount,
      currency: data.currency,
      category: data.category,
      paidBy: data.paidBy,
      paidByUser,
      splits,
      splitMethod: data.splitMethod,
      date: data.date,
      notes: data.notes,
    };

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: "expense",
      groupId: existingExpense.groupId,
      expense: updatedExpense,
      userId: currentUser.id,
      user: currentUser,
      description: `You updated ${data.title}`,
      amount: data.amount,
      currency: data.currency,
      date: new Date(),
    };

    set((state) => {
      let nextGroups = state.groups;
      if (existingExpense.groupId) {
        nextGroups = state.groups.map((g) => {
          if (g.id !== existingExpense.groupId) return g;
          const { convertCurrency } = useUIStore.getState();
          const oldAmt = convertCurrency(existingExpense.amount, existingExpense.currency, g.currency);
          const newAmt = convertCurrency(data.amount, data.currency, g.currency);
          return {
            ...g,
            totalExpenses: Math.max(0, g.totalExpenses - oldAmt + newAmt),
          };
        });
      }
      return {
        expenses: state.expenses.map((e) => (e.id === id ? updatedExpense : e)),
        activities: [newActivity, ...state.activities],
        groups: nextGroups,
      };
    });

    return updatedExpense;
  },

  deleteExpense: async (id) => {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const expense = get().expenses.find((e) => e.id === id);
    if (!expense) return;

    set((state) => {
      let nextGroups = state.groups;
      if (expense.groupId) {
        nextGroups = state.groups.map((g) => {
          if (g.id !== expense.groupId) return g;
          const { convertCurrency } = useUIStore.getState();
          const amountInGroupCurrency = convertCurrency(expense.amount, expense.currency, g.currency);
          return { ...g, totalExpenses: Math.max(0, g.totalExpenses - amountInGroupCurrency) };
        });
      }
      return {
        groups: nextGroups,
        expenses: state.expenses.filter((e) => e.id !== id),
        activities: state.activities.filter((a) => a.type !== "expense" || a.expense?.id !== id),
      };
    });
  },

  deleteActivity: async (id) => {
    const activity = get().activities.find((a) => a.id === id);
    if (!activity) return;

    if (activity.expense) {
      await get().deleteExpense(activity.expense.id);
    } else {
      set((state) => ({ activities: state.activities.filter((a) => a.id !== id) }));
    }
  },

  addSettlement: async (data, currentUser) => {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const { groups } = get();
    const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
    const uniqueUsers = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
    const fromUser = uniqueUsers.find((u) => u.id === data.fromUserId) || currentUser;
    const toUser = uniqueUsers.find((u) => u.id === data.toUserId) || currentUser;

    const newSettlement: Settlement = {
      id: `settle-${Date.now()}`,
      groupId: data.groupId,
      fromUserId: data.fromUserId,
      toUserId: data.toUserId,
      fromUser,
      toUser,
      amount: data.amount,
      currency: data.currency,
      date: data.date,
      note: data.note,
    };

    const newActivity: Activity = {
      id: `act-${Date.now()}`,
      type: "settlement",
      groupId: data.groupId,
      settlement: newSettlement,
      userId: currentUser.id,
      user: currentUser,
      description:
        data.fromUserId === currentUser.id
          ? `You paid ${toUser.name.split(" ")[0]}`
          : `${fromUser.name.split(" ")[0]} paid you`,
      amount: data.amount,
      currency: data.currency,
      date: new Date(),
    };

    set((state) => ({
      settlements: [newSettlement, ...state.settlements],
      activities: [newActivity, ...state.activities],
    }));

    return newSettlement;
  },

  getGroupBalances: (groupId) => {
    const { expenses, settlements, groups } = get();
    const { preferredCurrency, convertCurrency } = useUIStore.getState();
    const balances = new Map<string, number>();
    const group = groups.find((g) => g.id === groupId);
    const targetCurrency = group ? group.currency : preferredCurrency.code;

    expenses
      .filter((e) => e.groupId === groupId)
      .forEach((exp) => {
        exp.splits.forEach((s) => {
          if (s.userId !== exp.paidBy) {
            const amtInPref = convertCurrency(s.amount, exp.currency, targetCurrency);
            balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) + amtInPref);
            balances.set(s.userId, (balances.get(s.userId) || 0) - amtInPref);
          }
        });
      });

    settlements
      .filter((s) => s.groupId === groupId)
      .forEach((set) => {
        const amtInPref = convertCurrency(set.amount, set.currency, targetCurrency);
        balances.set(set.toUserId, (balances.get(set.toUserId) || 0) - amtInPref);
        balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) + amtInPref);
      });

    return balances;
  },

  getSimplifiedDebts: (groupId) => {
    const balances = get().getGroupBalances(groupId);
    const debtors: { userId: string; amount: number }[] = [];
    const creditors: { userId: string; amount: number }[] = [];

    for (const [userId, balance] of balances.entries()) {
      if (balance < -0.01) debtors.push({ userId, amount: Math.abs(balance) });
      else if (balance > 0.01) creditors.push({ userId, amount: balance });
    }

    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    const payments: { fromUserId: string; toUserId: string; amount: number }[] = [];
    let i = 0;
    let j = 0;

    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i];
      const creditor = creditors[j];
      const amount = Math.min(debtor.amount, creditor.amount);

      if (amount > 0.01) {
        payments.push({
          fromUserId: debtor.userId,
          toUserId: creditor.userId,
          amount,
        });
      }

      debtor.amount -= amount;
      creditor.amount -= amount;

      if (debtor.amount < 0.01) i++;
      if (creditor.amount < 0.01) j++;
    }

    return payments;
  },

  getExactPairwiseDebts: (groupId) => {
    const { expenses, settlements, groups } = get();
    const { preferredCurrency, convertCurrency } = useUIStore.getState();
    const pairwise = new Map<string, number>();
    const group = groups.find((g) => g.id === groupId);
    const targetCurrency = group ? group.currency : preferredCurrency.code;

    expenses
      .filter((e) => e.groupId === groupId)
      .forEach((exp) => {
        exp.splits.forEach((s) => {
          if (s.userId !== exp.paidBy) {
            const amtInPref = convertCurrency(s.amount, exp.currency, targetCurrency);
            const key = `${s.userId}:${exp.paidBy}`;
            pairwise.set(key, (pairwise.get(key) || 0) + amtInPref);
          }
        });
      });

    settlements
      .filter((s) => s.groupId === groupId)
      .forEach((set) => {
        const amtInPref = convertCurrency(set.amount, set.currency, targetCurrency);
        const key = `${set.fromUserId}:${set.toUserId}`;
        if (pairwise.has(key)) {
          pairwise.set(key, pairwise.get(key)! - amtInPref);
        } else {
          const revKey = `${set.toUserId}:${set.fromUserId}`;
          pairwise.set(revKey, (pairwise.get(revKey) || 0) + amtInPref);
        }
      });

    const finalDebts: { fromUserId: string; toUserId: string; amount: number }[] = [];
    const processedPairs = new Set<string>();

    for (const [key, amount] of pairwise.entries()) {
      if (processedPairs.has(key)) continue;

      const [from, to] = key.split(":");
      const revKey = `${to}:${from}`;

      const revAmount = pairwise.get(revKey) || 0;
      processedPairs.add(key);
      processedPairs.add(revKey);

      const netAmount = amount - revAmount;
      if (netAmount > 0.01) {
        finalDebts.push({ fromUserId: from, toUserId: to, amount: netAmount });
      } else if (netAmount < -0.01) {
        finalDebts.push({ fromUserId: to, toUserId: from, amount: Math.abs(netAmount) });
      }
    }

    return finalDebts.sort((a, b) => b.amount - a.amount);
  },

  getUserBalances: (currentUserId, groupId) => {
    const { groups, expenses, settlements, getSimplifiedDebts, getExactPairwiseDebts } = get();
    const { preferredCurrency, convertCurrency } = useUIStore.getState();
    const balances = new Map<string, number>();

    const processDebts = (group: Group, exact: boolean) => {
      const debts = exact ? getExactPairwiseDebts(group.id) : getSimplifiedDebts(group.id);
      const targetCurrency = exact ? group.currency : preferredCurrency.code;
      
      debts.forEach((debt) => {
        if (debt.fromUserId === currentUserId) {
          const amtInPref = exact ? convertCurrency(debt.amount, targetCurrency, preferredCurrency.code) : convertCurrency(debt.amount, group.currency, preferredCurrency.code);
          balances.set(debt.toUserId, (balances.get(debt.toUserId) || 0) - amtInPref);
        } else if (debt.toUserId === currentUserId) {
          const amtInPref = exact ? convertCurrency(debt.amount, targetCurrency, preferredCurrency.code) : convertCurrency(debt.amount, group.currency, preferredCurrency.code);
          balances.set(debt.fromUserId, (balances.get(debt.fromUserId) || 0) + amtInPref);
        }
      });
    };

    if (groupId) {
      const group = groups.find((g) => g.id === groupId);
      if (group) {
        processDebts(group, !group.simplifyDebts);
      }
      return balances;
    }

    groups.forEach((group) => {
      processDebts(group, !group.simplifyDebts);
    });

    const nonGroupExpenses = expenses.filter((e) => !e.groupId);
    const nonGroupSettlements = settlements.filter((s) => !s.groupId);

    nonGroupExpenses.forEach((exp) => {
      if (exp.paidBy === currentUserId) {
        exp.splits.forEach((s) => {
          if (s.userId !== currentUserId) {
            const amtInPref = convertCurrency(s.amount, exp.currency, preferredCurrency.code);
            balances.set(s.userId, (balances.get(s.userId) || 0) + amtInPref);
          }
        });
      } else {
        const mySplit = exp.splits.find((s) => s.userId === currentUserId);
        if (mySplit) {
          const amtInPref = convertCurrency(mySplit.amount, exp.currency, preferredCurrency.code);
          balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) - amtInPref);
        }
      }
    });

    nonGroupSettlements.forEach((set) => {
      if (set.fromUserId === currentUserId) {
        const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
        balances.set(set.toUserId, (balances.get(set.toUserId) || 0) + amtInPref);
      } else if (set.toUserId === currentUserId) {
        const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
        balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) - amtInPref);
      }
    });

    return balances;
  },

  getTotalOwedToMe: (currentUserId) => {
    let total = 0;
    for (const [, balance] of get().getUserBalances(currentUserId)) {
      if (balance > 0) total += balance;
    }
    return total;
  },

  getTotalIOwe: (currentUserId) => {
    let total = 0;
    for (const [, balance] of get().getUserBalances(currentUserId)) {
      if (balance < 0) total += Math.abs(balance);
    }
    return total;
  },

  getNetBalance: (currentUserId) => {
    return get().getTotalOwedToMe(currentUserId) - get().getTotalIOwe(currentUserId);
  },
}));
