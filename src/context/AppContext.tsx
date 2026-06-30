import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useState } from "react";

import {
  MOCK_ACTIVITIES,
  MOCK_EXPENSES,
  MOCK_GROUPS,
  MOCK_ME,
  MOCK_SETTLEMENTS,
} from "@/lib/mock-data";
import type {
  Activity,
  Currency,
  Expense,
  ExpenseCategory,
  ExpenseSplit,
  Group,
  GroupMember,
  SplitMethod,
  User,
  Settlement,
} from "@/types";
import { CURRENCIES } from "@/types";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface AppContextValue {
  isAppLoading: boolean;
  currentUser: User;
  isAuthenticated: boolean;
  signIn: (email: string, _password: string) => Promise<void>;
  signOut: () => void;

  // Data
  groups: Group[];
  expenses: Expense[];
  activities: Activity[];

  // Currency
  preferredCurrency: Currency;
  setCurrency: (currency: Currency) => void;
  convertCurrency: (amount: number, from: string, to: string) => number;

  // Groups CRUD
  createGroup: (data: {
    name: string;
    icon: string;
    description?: string;
    currency: string;
    memberEmails: string[];
  }) => Promise<Group>;
  updateGroup: (id: string, group: Partial<Omit<Group, "id" | "members">>) => Promise<Group>;
  addGroupMembers: (groupId: string, users: User[]) => void;
  removeGroupMember: (groupId: string, userId: string) => void;
  deleteGroup: (groupId: string) => void;
  getGroup: (id: string) => Group | undefined;
  getGroupExpenses: (groupId: string) => Expense[];

  // Expenses CRUD
  addExpense: (data: {
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
  }) => Promise<Expense>;
  getExpense: (id: string) => Expense | undefined;

  // Balances
  getNetBalance: () => number;
  getTotalOwedToMe: () => number;
  getTotalIOwe: () => number;
  getUserBalances: (groupId?: string) => Map<string, number>;
  getGroupBalances: (groupId: string) => Map<string, number>;

  // Settlements
  addSettlement: (data: {
    groupId?: string;
    fromUserId: string;
    toUserId: string;
    amount: number;
    currency: string;
    date: Date;
    note?: string;
  }) => Promise<Settlement>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

const FALLBACK_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 151,
  INR: 83.5,
  CAD: 1.36,
  AUD: 1.53,
  CHF: 0.90,
  CNY: 7.23,
  MXN: 16.7,
  BRL: 5.0,
  AED: 3.67,
  SAR: 3.75,
  SGD: 1.35,
  HKD: 7.83,
  KRW: 1350,
  SEK: 10.7,
  NOK: 10.9,
  NZD: 1.67,
};

let expenseCounter = MOCK_EXPENSES.length + 1;
let groupCounter = MOCK_GROUPS.length + 1;

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_ME);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // mock: start authenticated
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [settlements, setSettlements] = useState<Settlement[]>(MOCK_SETTLEMENTS);
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>(
    CURRENCIES.find((c) => c.code === "INR") ?? CURRENCIES[0]!,
  );
  const [exchangeRates, setExchangeRates] = useState<Record<string, number>>(FALLBACK_RATES);
  const [isAppLoading, setIsAppLoading] = useState(true);

  // Initial load simulation
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  // Fetch live rates on mount
  React.useEffect(() => {
    fetch("https://open.er-api.com/v6/latest/USD")
      .then((res) => res.json())
      .then((data) => {
        if (data && data.result === "success" && data.rates) {
          setExchangeRates(data.rates);
        }
      })
      .catch((err) => console.warn("Failed to fetch live rates, using fallbacks:", err));
  }, []);

  // ── Auth ──────────────────────────────────────────────────────────────────

  const signIn = useCallback(async (email: string, _password: string) => {
    // Phase 1: mock sign-in
    setCurrentUser({ ...MOCK_ME, email });
    setIsAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    setIsAuthenticated(false);
  }, []);

  // ── Currency ──────────────────────────────────────────────────────────────

  const setCurrency = useCallback((currency: Currency) => {
    setPreferredCurrency(currency);
  }, []);

  const convertCurrency = useCallback((amount: number, from: string, to: string) => {
    if (from === to) return amount;
    const rateFrom = exchangeRates[from] || FALLBACK_RATES[from] || 1;
    const rateTo = exchangeRates[to] || FALLBACK_RATES[to] || 1;
    return (amount / rateFrom) * rateTo;
  }, [exchangeRates]);

  // ── Groups ────────────────────────────────────────────────────────────────

  const getGroup = useCallback(
    (id: string) => groups.find((g) => g.id === id),
    [groups],
  );

  const getGroupExpenses = useCallback(
    (groupId: string) =>
      expenses.filter((e) => e.groupId === groupId).sort((a, b) => b.date.getTime() - a.date.getTime()),
    [expenses],
  );

  const createGroup = useCallback(
    async (data: {
      name: string;
      icon: string;
      description?: string;
      currency: string;
      memberEmails: string[];
    }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
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
      };
      setGroups((prev) => [newGroup, ...prev]);

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
      setActivities((prev) => [newActivity, ...prev]);

      return newGroup;
    },
    [currentUser],
  );

  const updateGroup = async (id: string, updates: Partial<Omit<Group, "id" | "members">>) => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    setGroups((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updates } : g))
    );
    return groups.find((g) => g.id === id)!;
  };

  const addGroupMembers = useCallback((groupId: string, users: User[]) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      const existingUserIds = new Set(g.members.map(m => m.userId));
      const newMembers = users.filter(u => !existingUserIds.has(u.id)).map(u => ({
        userId: u.id,
        user: u,
        balance: 0,
      }));
      return { ...g, members: [...g.members, ...newMembers] };
    }));
  }, []);

  const removeGroupMember = useCallback((groupId: string, userId: string) => {
    setGroups(prev => prev.map(g => {
      if (g.id !== groupId) return g;
      return { ...g, members: g.members.filter(m => m.userId !== userId) };
    }));
  }, []);

  const deleteGroup = useCallback((groupId: string) => {
    setGroups(prev => prev.filter(g => g.id !== groupId));
    // Optionally clean up expenses/settlements/activities related to this group,
    // but in a real app this might be handled via a cascade delete on the backend.
  }, []);

  // ── Expenses ──────────────────────────────────────────────────────────────

  const getExpense = useCallback(
    (id: string) => expenses.find((e) => e.id === id),
    [expenses],
  );

  const addExpense = useCallback(
    async (data: {
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
    }) => {
      await new Promise(resolve => setTimeout(resolve, 500));
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

      setExpenses((prev) => [newExpense, ...prev]);

      // Update group totals
      if (data.groupId) {
        setGroups((prev) =>
          prev.map((g) => {
            if (g.id !== data.groupId) return g;
            const amountInGroupCurrency = convertCurrency(data.amount, data.currency, g.currency);
            return { ...g, totalExpenses: g.totalExpenses + amountInGroupCurrency };
          }),
        );
      }

      // Add activity
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
      setActivities((prev) => [newActivity, ...prev]);

      return newExpense;
    },
    [currentUser, convertCurrency],
  );

  // ── Balances ──────────────────────────────────────────────────────────────

  const getUserBalances = useCallback((groupId?: string) => {
    const balances = new Map<string, number>();
    
    const relevantExpenses = groupId ? expenses.filter(e => e.groupId === groupId) : expenses;
    const relevantSettlements = groupId ? settlements.filter(s => s.groupId === groupId) : settlements;
    
    relevantExpenses.forEach((exp) => {
      if (exp.paidBy === currentUser.id) {
        exp.splits.forEach((s) => {
          if (s.userId !== currentUser.id) {
            const amtInPref = convertCurrency(s.amount, exp.currency, preferredCurrency.code);
            balances.set(s.userId, (balances.get(s.userId) || 0) + amtInPref);
          }
        });
      } else {
        const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
        if (mySplit) {
          const amtInPref = convertCurrency(mySplit.amount, exp.currency, preferredCurrency.code);
          balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) - amtInPref);
        }
      }
    });

    relevantSettlements.forEach((set) => {
      if (set.fromUserId === currentUser.id) {
        const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
        balances.set(set.toUserId, (balances.get(set.toUserId) || 0) + amtInPref);
      } else if (set.toUserId === currentUser.id) {
        const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
        balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) - amtInPref);
      }
    });

    return balances;
  }, [expenses, settlements, currentUser.id, preferredCurrency.code, convertCurrency]);

  const getTotalOwedToMe = useCallback(() => {
    let total = 0;
    for (const [, balance] of getUserBalances()) {
      if (balance > 0) total += balance;
    }
    return total;
  }, [getUserBalances]);

  const getTotalIOwe = useCallback(() => {
    let total = 0;
    for (const [, balance] of getUserBalances()) {
      if (balance < 0) total += Math.abs(balance);
    }
    return total;
  }, [getUserBalances]);

  const getGroupBalances = useCallback((groupId: string) => {
    const balances = new Map<string, number>();
    
    expenses.filter(e => e.groupId === groupId).forEach((exp) => {
      exp.splits.forEach((s) => {
        if (s.userId !== exp.paidBy) {
          const amtInPref = convertCurrency(s.amount, exp.currency, preferredCurrency.code);
          balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) + amtInPref);
          balances.set(s.userId, (balances.get(s.userId) || 0) - amtInPref);
        }
      });
    });

    settlements.filter(s => s.groupId === groupId).forEach((set) => {
      const amtInPref = convertCurrency(set.amount, set.currency, preferredCurrency.code);
      balances.set(set.toUserId, (balances.get(set.toUserId) || 0) - amtInPref);
      balances.set(set.fromUserId, (balances.get(set.fromUserId) || 0) + amtInPref);
    });

    return balances;
  }, [expenses, settlements, preferredCurrency.code, convertCurrency]);

  const getNetBalance = useCallback(() => {
    return getTotalOwedToMe() - getTotalIOwe();
  }, [getTotalOwedToMe, getTotalIOwe]);

  // ── Settlements ──────────────────────────────────────────────────────────

  const addSettlement = useCallback(
    async (data: {
      groupId?: string;
      fromUserId: string;
      toUserId: string;
      amount: number;
      currency: string;
      date: Date;
      note?: string;
    }) => {
      await new Promise(resolve => setTimeout(resolve, 500));

      const allMembers = groups.flatMap((g) => g.members.map((m) => m.user));
      const uniqueUsers = Array.from(new Map(allMembers.map((user) => [user.id, user])).values());
      const fromUser = uniqueUsers.find(u => u.id === data.fromUserId) || currentUser;
      const toUser = uniqueUsers.find(u => u.id === data.toUserId) || currentUser;

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

      setSettlements((prev) => [newSettlement, ...prev]);

      const newActivity: Activity = {
        id: `act-${Date.now()}`,
        type: "settlement",
        groupId: data.groupId,
        settlement: newSettlement,
        userId: currentUser.id,
        user: currentUser,
        description: data.fromUserId === currentUser.id 
          ? `You paid ${toUser.name.split(" ")[0]}` 
          : `${fromUser.name.split(" ")[0]} paid you`,
        amount: data.amount,
        currency: data.currency,
        date: new Date(),
      };
      setActivities((prev) => [newActivity, ...prev]);

      return newSettlement;
    },
    [currentUser, groups],
  );

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        isAppLoading,
        currentUser,
        isAuthenticated,
        signIn,
        signOut,
        groups,
        expenses,
        activities,
        preferredCurrency,
        setCurrency,
        convertCurrency,
        createGroup,
        updateGroup,
        addGroupMembers,
        removeGroupMember,
        deleteGroup,
        getGroup,
        getGroupExpenses,
        addExpense,
        getExpense,
        getNetBalance,
        getTotalOwedToMe,
        getTotalIOwe,
        getUserBalances,
        getGroupBalances,
        addSettlement,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
