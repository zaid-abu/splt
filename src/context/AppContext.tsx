import type { ReactNode } from "react";
import React, { createContext, useCallback, useContext, useState } from "react";

import {
  MOCK_ACTIVITIES,
  MOCK_EXPENSES,
  MOCK_GROUPS,
  MOCK_ME,
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
} from "@/types";
import { CURRENCIES } from "@/types";

// ─── Context shape ────────────────────────────────────────────────────────────

interface AppContextValue {
  // Auth (mock Phase 1)
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

  // Groups CRUD
  createGroup: (data: {
    name: string;
    icon: string;
    description?: string;
    currency: string;
    memberEmails: string[];
  }) => Group;
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
  }) => Expense;
  getExpense: (id: string) => Expense | undefined;

  // Balances
  getNetBalance: () => number;
  getTotalOwedToMe: () => number;
  getTotalIOwe: () => number;
  getUserBalances: () => Map<string, number>;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AppContext = createContext<AppContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

let expenseCounter = MOCK_EXPENSES.length + 1;
let groupCounter = MOCK_GROUPS.length + 1;

export function AppProvider({ children }: { children: ReactNode }): React.JSX.Element {
  const [currentUser, setCurrentUser] = useState<User>(MOCK_ME);
  const [isAuthenticated, setIsAuthenticated] = useState(true); // mock: start authenticated
  const [groups, setGroups] = useState<Group[]>(MOCK_GROUPS);
  const [expenses, setExpenses] = useState<Expense[]>(MOCK_EXPENSES);
  const [activities, setActivities] = useState<Activity[]>(MOCK_ACTIVITIES);
  const [preferredCurrency, setPreferredCurrency] = useState<Currency>(
    CURRENCIES.find((c) => c.code === "USD") ?? CURRENCIES[0]!,
  );

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
    (data: {
      name: string;
      icon: string;
      description?: string;
      currency: string;
      memberEmails: string[];
    }) => {
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

  // ── Expenses ──────────────────────────────────────────────────────────────

  const getExpense = useCallback(
    (id: string) => expenses.find((e) => e.id === id),
    [expenses],
  );

  const addExpense = useCallback(
    (data: {
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
            return { ...g, totalExpenses: g.totalExpenses + data.amount };
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
    [currentUser],
  );

  // ── Balances ──────────────────────────────────────────────────────────────

  const getUserBalances = useCallback(() => {
    const balances = new Map<string, number>();
    expenses.forEach((exp) => {
      if (exp.paidBy === currentUser.id) {
        exp.splits.forEach((s) => {
          if (s.userId !== currentUser.id) {
            balances.set(s.userId, (balances.get(s.userId) || 0) + s.amount);
          }
        });
      } else {
        const mySplit = exp.splits.find((s) => s.userId === currentUser.id);
        if (mySplit) {
          balances.set(exp.paidBy, (balances.get(exp.paidBy) || 0) - mySplit.amount);
        }
      }
    });
    return balances;
  }, [expenses, currentUser.id]);

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

  const getNetBalance = useCallback(() => {
    return getTotalOwedToMe() - getTotalIOwe();
  }, [getTotalOwedToMe, getTotalIOwe]);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <AppContext.Provider
      value={{
        currentUser,
        isAuthenticated,
        signIn,
        signOut,
        groups,
        expenses,
        activities,
        preferredCurrency,
        setCurrency,
        createGroup,
        getGroup,
        getGroupExpenses,
        addExpense,
        getExpense,
        getNetBalance,
        getTotalOwedToMe,
        getTotalIOwe,
        getUserBalances,
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
