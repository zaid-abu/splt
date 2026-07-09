import { useState, useMemo, useEffect, useCallback } from "react";
import * as Haptics from "expo-haptics";
import type { ExpenseCategory, SplitMethod, Expense, Group, User, Currency } from "@/types";
import {
  calculateEqualShare,
  calculateCustomSum,
  calculatePercentSum,
  generateSplits,
} from "@/features/expenses/utils/splits";
import { formatAmount } from "@/components/ui/AmountDisplay";

interface UseExpenseFormProps {
  currentUser: User;
  groups: Group[];
  friends: User[];
  expenses: Expense[];
  initialGroupId?: string;
  initialFriendId?: string;
  expenseId?: string;
  expenseDetail?: Expense;
  preferredCurrency: Currency;
  setCurrency: (c: Currency) => void;
  addExpense: (data: any) => Promise<any>;
  updateExpense: (data: any) => Promise<any>;
  router: any;
  toast: any;
}

export function useExpenseForm({
  currentUser,
  groups,
  friends,
  expenses,
  initialGroupId,
  initialFriendId,
  expenseId,
  expenseDetail,
  preferredCurrency,
  setCurrency,
  addExpense,
  updateExpense,
  router,
  toast,
}: UseExpenseFormProps) {
  const getGroup = (id: string) => groups.find((g: any) => g.id === id);
  const getExistingIncludedMap = (expense: Expense | undefined): Record<string, boolean> => {
    if (!expense) return {};

    return Object.fromEntries(expense.splits.map((split) => [split.userId, true]));
  };
  const getIndividualExpenseFriendIds = useCallback(
    (expense: Expense | undefined): string[] => {
      if (!expense || expense.groupId) return [];

      const friendIds = new Set<string>();

      expense.splits.forEach((split) => {
        if (split.userId !== currentUser.id) {
          friendIds.add(split.userId);
        }
      });

      if (expense.paidBy && expense.paidBy !== currentUser.id) {
        friendIds.add(expense.paidBy);
      }

      return Array.from(friendIds);
    },
    [currentUser.id]
  );

  const existingExpense = useMemo(
    () =>
      expenseDetail ||
      (expenseId ? expenses.find((expense) => expense.id === expenseId) : undefined),
    [expenseDetail, expenseId, expenses]
  );

  const initialGroup = existingExpense?.groupId || initialGroupId || "";
  const initialFriends = (() => {
    if (existingExpense && !existingExpense.groupId) {
      return getIndividualExpenseFriendIds(existingExpense);
    }
    return initialFriendId ? [initialFriendId] : [];
  })();

  const [selectedGroupId, setSelectedGroupId] = useState(initialGroup);
  const [selectedFriendIds, setSelectedFriendIds] = useState<string[]>(initialFriends);
  const [selectionConfirmed, setSelectionConfirmed] = useState(
    !!initialGroup || initialFriends.length > 0 || !!existingExpense
  );
  const [selectionTab, setSelectionTab] = useState<"friends" | "groups">("friends");
  const [searchQuery, setSearchQuery] = useState("");

  const uniqueFriends = useMemo(() => {
    return friends.filter((user) => user.id !== currentUser.id);
  }, [friends, currentUser.id]);

  const filteredGroups = useMemo(() => {
    if (!searchQuery.trim()) return groups;
    const lowerQuery = searchQuery.toLowerCase();
    return groups.filter((g) => g.name.toLowerCase().includes(lowerQuery));
  }, [groups, searchQuery]);

  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) return uniqueFriends;
    const lowerQuery = searchQuery.toLowerCase();
    return uniqueFriends.filter((f) => f.name.toLowerCase().includes(lowerQuery));
  }, [uniqueFriends, searchQuery]);

  const selectedGroup = selectedGroupId ? getGroup(selectedGroupId) : undefined;
  const expenseSplitFriends = useMemo(() => {
    if (!existingExpense || existingExpense.groupId) return [];

    const relatedUsers = existingExpense.splits
      .map((split) => split.user)
      .filter((user): user is User => !!user && user.id !== currentUser.id);

    if (existingExpense.paidByUser && existingExpense.paidByUser.id !== currentUser.id) {
      relatedUsers.push(existingExpense.paidByUser);
    }

    const seen = new Set<string>();
    return relatedUsers.filter((user) => {
      if (seen.has(user.id)) return false;
      seen.add(user.id);
      return true;
    });
  }, [existingExpense, currentUser.id]);

  const selectedFriends = useMemo(() => {
    const friendMap = new Map<string, User>();

    uniqueFriends.forEach((friend) => {
      friendMap.set(friend.id, friend);
    });
    expenseSplitFriends.forEach((friend) => {
      if (!friendMap.has(friend.id)) {
        friendMap.set(friend.id, friend);
      }
    });

    return selectedFriendIds
      .map((friendId) => friendMap.get(friendId))
      .filter((friend): friend is User => !!friend);
  }, [uniqueFriends, expenseSplitFriends, selectedFriendIds]);

  const participants = useMemo(() => {
    if (selectedGroup) {
      return selectedGroup.members.map((m) => m.user);
    }
    if (selectedFriends.length > 0) {
      return [currentUser, ...selectedFriends];
    }
    return [];
  }, [selectedGroup, selectedFriends, currentUser]);

  const [expenseCurrency, setExpenseCurrency] = useState(preferredCurrency.code);

  useEffect(() => {
    if (selectedGroup) {
      setTimeout(() => setExpenseCurrency(selectedGroup.currency), 0);
    } else if (existingExpense && !existingExpense.groupId) {
      setTimeout(() => setExpenseCurrency(existingExpense.currency), 0);
    } else {
      setTimeout(() => setExpenseCurrency(preferredCurrency.code), 0);
    }
  }, [selectedGroup, existingExpense, preferredCurrency.code]);

  const [title, setTitle] = useState(existingExpense?.title || "");
  const [amount, setAmount] = useState(existingExpense?.amount.toString() || "");
  const [category, setCategory] = useState<ExpenseCategory>(existingExpense?.category || "food");
  const [splitMethod, setSplitMethod] = useState<SplitMethod>(
    existingExpense?.splitMethod || "equal"
  );
  const [paidBy, setPaidBy] = useState(existingExpense?.paidBy || currentUser.id);
  const [loading, setLoading] = useState(false);
  const [expenseDate, setExpenseDate] = useState<Date>(existingExpense?.date || new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [included, setIncluded] = useState<Record<string, boolean>>(() =>
    getExistingIncludedMap(existingExpense)
  );

  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "custom") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = s.amount.toString();
    });
    return map;
  });

  const [customPercentages, setCustomPercentages] = useState<Record<string, string>>(() => {
    if (existingExpense?.splitMethod !== "percentage") return {};
    const map: Record<string, string> = {};
    existingExpense.splits.forEach((s: any) => {
      map[s.userId] = ((s.amount / existingExpense.amount) * 100).toString();
    });
    return map;
  });

  useEffect(() => {
    if (!existingExpense) return;

    const timer = setTimeout(() => {
      const nextFriendIds = getIndividualExpenseFriendIds(existingExpense);

      setSelectedGroupId(existingExpense.groupId || "");
      setSelectedFriendIds(nextFriendIds);
      setSelectionConfirmed(true);
      setTitle(existingExpense.title || "");
      setAmount(existingExpense.amount.toString() || "");
      setCategory(existingExpense.category || "food");
      setSplitMethod(existingExpense.splitMethod || "equal");
      setPaidBy(existingExpense.paidBy || currentUser.id);
      setExpenseDate(existingExpense.date || new Date());
      setExpenseCurrency(existingExpense.currency || preferredCurrency.code);

      setIncluded(getExistingIncludedMap(existingExpense));

      if (existingExpense.splitMethod === "custom") {
        const customMap: Record<string, string> = {};
        existingExpense.splits.forEach((s: any) => {
          customMap[s.userId] = s.amount.toString();
        });
        setCustomAmounts(customMap);
        setCustomPercentages({});
      } else if (existingExpense.splitMethod === "percentage") {
        const percentageMap: Record<string, string> = {};
        existingExpense.splits.forEach((s: any) => {
          percentageMap[s.userId] = ((s.amount / existingExpense.amount) * 100).toString();
        });
        setCustomPercentages(percentageMap);
        setCustomAmounts({});
      } else {
        setCustomAmounts({});
        setCustomPercentages({});
      }
    }, 0);

    return () => clearTimeout(timer);
  }, [existingExpense, currentUser.id, getIndividualExpenseFriendIds, preferredCurrency.code]);

  useEffect(() => {
    if (participants.length === 0) return;

    const timer = setTimeout(() => {
      setIncluded((prev) => {
        const existingIncludedMap = getExistingIncludedMap(existingExpense);
        const nextIncluded = Object.fromEntries(
          participants.map((u) => [
            u.id,
            existingExpense ? !!existingIncludedMap[u.id] : (prev[u.id] ?? true),
          ])
        );

        const hasChanged = participants.some((u) => prev[u.id] !== nextIncluded[u.id]);
        const sizeChanged = Object.keys(prev).length !== Object.keys(nextIncluded).length;

        return hasChanged || sizeChanged ? nextIncluded : prev;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [participants, existingExpense]);

  const includedMembers = participants.filter((u) => included[u.id]);
  const parsedAmount = parseFloat(amount.replace(",", ".")) || 0;
  const equalShare = calculateEqualShare(includedMembers, parsedAmount);

  const currentCustomSum = calculateCustomSum(includedMembers, customAmounts);
  const remainingCustom = Math.max(0, parsedAmount - currentCustomSum);

  const currentPercentSum = calculatePercentSum(includedMembers, customPercentages);
  const remainingPercent = Math.max(0, 100 - currentPercentSum);

  async function handleSubmit(): Promise<void> {
    if (!selectedGroup && selectedFriends.length === 0) {
      toast.show({
        label: "Error",
        description: "Please select a group or friend",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (!title.trim()) {
      toast.show({
        label: "Error",
        description: "Please enter a title",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      toast.show({
        label: "Error",
        description: "Please enter a valid amount",
        variant: "danger",
        placement: "top",
      });
      return;
    }
    if (includedMembers.length === 0) {
      toast.show({
        label: "Error",
        description: "Include at least one member",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    if (splitMethod === "custom" && Math.abs(currentCustomSum - parsedAmount) > 0.01) {
      toast.show({
        label: "Error",
        description: `Custom amounts must equal exactly ${formatAmount(parsedAmount, expenseCurrency)}.`,
        variant: "danger",
        placement: "top",
      });
      return;
    }

    if (splitMethod === "percentage" && Math.abs(currentPercentSum - 100) > 0.01) {
      toast.show({
        label: "Error",
        description: "Percentages must add up to exactly 100%.",
        variant: "danger",
        placement: "top",
      });
      return;
    }

    setLoading(true);
    try {
      const splits = generateSplits(
        includedMembers,
        parsedAmount,
        splitMethod,
        customAmounts,
        customPercentages
      );

      if (existingExpense) {
        await updateExpense({
          id: existingExpense.id,
          updates: {
            title: title.trim(),
            amount: parsedAmount,
            currency: expenseCurrency,
            category,
            paidBy,
            splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
            splitMethod,
            date: expenseDate,
          },
        });
      } else {
        await addExpense({
          groupId: selectedGroup?.id,
          title: title.trim(),
          amount: parsedAmount,
          currency: expenseCurrency,
          category,
          paidBy,
          splits: splits.map((s) => ({ ...s, paid: s.userId === paidBy })),
          splitMethod,
          date: expenseDate,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace("/(tabs)");
      }
    } catch (e: any) {
      toast.show({
        label: "Error",
        description: e.message || "Something went wrong. Please try again.",
        variant: "danger",
        placement: "top",
      });
      setLoading(false);
    }
  }

  return {
    state: {
      existingExpense,
      selectedGroupId,
      selectedFriendIds,
      selectionConfirmed,
      selectionTab,
      searchQuery,
      uniqueFriends,
      filteredGroups,
      filteredFriends,
      selectedGroup,
      selectedFriends,
      participants,
      expenseCurrency,
      title,
      amount,
      category,
      splitMethod,
      paidBy,
      loading,
      expenseDate,
      showDatePicker,
      included,
      customAmounts,
      customPercentages,
      includedMembers,
      parsedAmount,
      equalShare,
      currentCustomSum,
      remainingCustom,
      currentPercentSum,
      remainingPercent,
    },
    actions: {
      setSelectedGroupId,
      setSelectedFriendIds,
      setSelectionConfirmed,
      setSelectionTab,
      setSearchQuery,
      setExpenseCurrency,
      setTitle,
      setAmount,
      setCategory,
      setSplitMethod,
      setPaidBy,
      setLoading,
      setExpenseDate,
      setShowDatePicker,
      setIncluded,
      setCustomAmounts,
      setCustomPercentages,
      handleSubmit,
      setCurrency,
    },
  };
}
